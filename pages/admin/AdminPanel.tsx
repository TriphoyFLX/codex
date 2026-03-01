import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  MessageSquare, 
  BarChart3, 
  Settings,
  LogOut,
  Menu,
  X,
  Trash2,
  Edit,
  Plus,
  Eye
} from 'lucide-react';
import { useProfile } from '../../context/ProfileContext';
import { adminService, type AdminStats, type AdminUser, type AdminCourse, type AdminPost, type AdminNotification } from '../../services/adminService';
import styles from './AdminPanel.module.css';

const AdminPanel: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalCourses: 0,
    totalPosts: 0,
    activeUsers: 0,
    newUsersToday: 0
  });
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [newNotification, setNewNotification] = useState<{ title: string; message: string; type: string }>({
    title: '',
    message: '',
    type: 'info'
  });
  const [loading, setLoading] = useState(true);

  const menuItems = [
    { id: 'dashboard', label: 'Панель управления', icon: LayoutDashboard },
    { id: 'users', label: 'Пользователи', icon: Users },
    { id: 'courses', label: 'Курсы', icon: BookOpen },
    { id: 'posts', label: 'Посты', icon: MessageSquare },
    { id: 'notifications', label: 'Уведомления', icon: MessageSquare },
    { id: 'stats', label: 'Статистика', icon: BarChart3 },
    { id: 'settings', label: 'Настройки', icon: Settings },
  ];

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      
      // Получаем реальные данные через API
      const [statsData, usersData, coursesData, postsData] = await Promise.all([
        adminService.getStats(),
        adminService.getUsers(),
        adminService.getCourses(),
        adminService.getPosts()
      ]);

      setStats(statsData);
      setUsers(usersData);
      setCourses(coursesData);
      setPosts(postsData);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      // В случае ошибки используем моковые данные
      setStats({
        totalUsers: 1247,
        totalCourses: 45,
        totalPosts: 892,
        activeUsers: 324,
        newUsersToday: 12
      });

      setUsers([
        { id: '1', username: 'admin', email: 'admin@codex.com', role: 'admin', created_at: '2024-01-01' },
        { id: '2', username: 'teacher1', email: 'teacher1@school.com', role: 'teacher', created_at: '2024-01-15' },
        { id: '3', username: 'student1', email: 'student1@school.com', role: 'student', created_at: '2024-02-01' },
      ]);

      setCourses([
        { id: '1', title: 'Математика', description: 'Базовый курс математики', teacher_id: '2', created_at: '2024-01-20', students_count: 45 },
        { id: '2', title: 'Физика', description: 'Вводный курс физики', teacher_id: '2', created_at: '2024-02-01', students_count: 32 },
      ]);

      setPosts([
        { id: '1', title: 'Добро пожаловать!', content: 'Первый пост в системе', author_id: '1', author_name: 'admin', created_at: '2024-01-01', likes_count: 25 },
        { id: '2', title: 'Новый курс', content: 'Объявляем о запуске нового курса', author_id: '2', author_name: 'teacher1', created_at: '2024-01-25', likes_count: 18 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Вы уверены, что хотите удалить этого пользователя?')) {
      try {
        await adminService.deleteUser(userId);
        setUsers(users.filter(user => user.id !== userId));
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Ошибка при удалении пользователя');
      }
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (window.confirm('Вы уверены, что хотите удалить этот курс?')) {
      try {
        await adminService.deleteCourse(courseId);
        setCourses(courses.filter(course => course.id !== courseId));
      } catch (error) {
        console.error('Error deleting course:', error);
        alert('Ошибка при удалении курса');
      }
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (window.confirm('Вы уверены, что хотите удалить этот пост?')) {
      try {
        await adminService.deletePost(postId);
        setPosts(posts.filter(post => post.id !== postId));
      } catch (error) {
        console.error('Error deleting post:', error);
        alert('Ошибка при удалении поста');
      }
    }
  };

  const handleLogout = () => {
    // Здесь должна быть логика выхода
    navigate('/');
  };

  const loadNotifications = async () => {
    try {
      setNotificationsLoading(true);
      const data = await adminService.getNotifications();
      setNotifications(data);
    } finally {
      setNotificationsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'notifications') {
      loadNotifications();
    }
  }, [activeTab]);

  const handleCreateNotification = async () => {
    if (!newNotification.title.trim() || !newNotification.message.trim()) {
      alert('Заполни заголовок и текст');
      return;
    }

    try {
      const created = await adminService.createNotification({
        title: newNotification.title.trim(),
        message: newNotification.message.trim(),
        type: newNotification.type
      });
      setNotifications(prev => [created, ...prev]);
      setShowNotificationModal(false);
      setNewNotification({ title: '', message: '', type: 'info' });
    } catch (e) {
      alert('Ошибка при создании уведомления');
    }
  };

  const handleDeleteNotification = async (id: number) => {
    if (!window.confirm('Удалить уведомление?')) return;
    try {
      await adminService.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (e) {
      alert('Ошибка при удалении');
    }
  };

  const renderDashboard = () => (
    <div className={styles.dashboardGrid}>
      <div className={styles.statCard}>
        <div className={styles.statHeader}>
          <div className={styles.statInfo}>
            <h3>Всего пользователей</h3>
            <p className={styles.statValue}>{stats.totalUsers}</p>
          </div>
          <div className={`${styles.statIcon} ${styles.statIconUsers}`}>
            <Users className="h-6 w-6" />
          </div>
        </div>
      </div>
      <div className={styles.statCard}>
        <div className={styles.statHeader}>
          <div className={styles.statInfo}>
            <h3>Всего курсов</h3>
            <p className={styles.statValue}>{stats.totalCourses}</p>
          </div>
          <div className={`${styles.statIcon} ${styles.statIconCourses}`}>
            <BookOpen className="h-6 w-6" />
          </div>
        </div>
      </div>
      <div className={styles.statCard}>
        <div className={styles.statHeader}>
          <div className={styles.statInfo}>
            <h3>Всего постов</h3>
            <p className={styles.statValue}>{stats.totalPosts}</p>
          </div>
          <div className={`${styles.statIcon} ${styles.statIconPosts}`}>
            <MessageSquare className="h-6 w-6" />
          </div>
        </div>
      </div>
      <div className={styles.statCard}>
        <div className={styles.statHeader}>
          <div className={styles.statInfo}>
            <h3>Активные сегодня</h3>
            <p className={styles.statValue}>{stats.activeUsers}</p>
          </div>
          <div className={`${styles.statIcon} ${styles.statIconActive}`}>
            <BarChart3 className="h-6 w-6" />
          </div>
        </div>
      </div>
    </div>
  );

  const renderNotifications = () => (
    <div className={styles.tableContainer}>
      <div className={styles.tableHeader}>
        <h2 className={styles.tableTitle}>Уведомления</h2>
        <button className={styles.addButton} onClick={() => setShowNotificationModal(true)}>
          <Plus className="h-4 w-4" />
          Создать
        </button>
      </div>

      <div className={styles.tableWrapper}>
        {notificationsLoading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner}></div>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Заголовок</th>
                <th>Текст</th>
                <th>Тип</th>
                <th>Создано</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {notifications.map((n) => (
                <tr key={n.id}>
                  <td>{n.title}</td>
                  <td>{n.message}</td>
                  <td>{n.type}</td>
                  <td>{new Date(n.created_at).toLocaleString('ru-RU')}</td>
                  <td>
                    <div className={styles.actionButtons}>
                      <button
                        className={`${styles.actionButton} ${styles.actionButtonDelete}`}
                        onClick={() => handleDeleteNotification(n.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <AnimatePresence>
        {showNotificationModal && (
          <motion.div
            className={styles.modalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowNotificationModal(false)}
          >
            <motion.div
              className={styles.modalContent}
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 30, opacity: 0 }}
              transition={{ type: 'spring', damping: 22 }}
              onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle}>Новое уведомление</h3>
                <button className={styles.modalCloseButton} onClick={() => setShowNotificationModal(false)}>
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Заголовок</label>
                  <input
                    className={styles.formInput}
                    value={newNotification.title}
                    onChange={(e) => setNewNotification(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Текст</label>
                  <textarea
                    className={styles.formTextarea}
                    rows={4}
                    value={newNotification.message}
                    onChange={(e) => setNewNotification(prev => ({ ...prev, message: e.target.value }))}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Тип</label>
                  <select
                    className={styles.formSelect}
                    value={newNotification.type}
                    onChange={(e) => setNewNotification(prev => ({ ...prev, type: e.target.value }))}
                  >
                    <option value="info">info</option>
                    <option value="success">success</option>
                    <option value="warning">warning</option>
                    <option value="error">error</option>
                  </select>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button className={styles.secondaryButton} onClick={() => setShowNotificationModal(false)}>
                  Отмена
                </button>
                <button className={styles.primaryButton} onClick={handleCreateNotification}>
                  Создать
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  const renderUsers = () => (
    <div className={styles.tableContainer}>
      <div className={styles.tableHeader}>
        <h2 className={styles.tableTitle}>Управление пользователями</h2>
      </div>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Пользователь</th>
              <th>Email</th>
              <th>Роль</th>
              <th>Дата регистрации</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.username}</td>
                <td>{user.email}</td>
                <td>
                  <span className={`${styles.badge} ${
                    user.role === 'admin' ? styles.badgeAdmin : 
                    user.role === 'teacher' ? styles.badgeTeacher : 
                    styles.badgeStudent
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td>{user.created_at}</td>
                <td>
                  <div className={styles.actionButtons}>
                    <button className={`${styles.actionButton} ${styles.actionButtonDelete}`} onClick={() => handleDeleteUser(user.id)}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderCourses = () => (
    <div className={styles.tableContainer}>
      <div className={styles.tableHeader}>
        <h2 className={styles.tableTitle}>Управление курсами</h2>
        <button className={styles.addButton}>
          <Plus className="h-4 w-4" />
          Добавить курс
        </button>
      </div>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Название</th>
              <th>Описание</th>
              <th>Студентов</th>
              <th>Дата создания</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((course) => (
              <tr key={course.id}>
                <td>{course.title}</td>
                <td>{course.description}</td>
                <td>{course.students_count || 0}</td>
                <td>{course.created_at}</td>
                <td>
                  <div className={styles.actionButtons}>
                    <button className={`${styles.actionButton} ${styles.actionButtonEdit}`}>
                      <Edit className="h-4 w-4" />
                    </button>
                    <button className={`${styles.actionButton} ${styles.actionButtonDelete}`} onClick={() => handleDeleteCourse(course.id)}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderPosts = () => (
    <div className={styles.tableContainer}>
      <div className={styles.tableHeader}>
        <h2 className={styles.tableTitle}>Управление постами</h2>
      </div>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Заголовок</th>
              <th>Автор</th>
              <th>Лайки</th>
              <th>Дата создания</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.id}>
                <td>{post.title}</td>
                <td>{post.author_name}</td>
                <td>{post.likes_count}</td>
                <td>{post.created_at}</td>
                <td>
                  <div className={styles.actionButtons}>
                    <button className={`${styles.actionButton} ${styles.actionButtonView}`}>
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className={`${styles.actionButton} ${styles.actionButtonDelete}`} onClick={() => handleDeletePost(post.id)}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderStats = () => (
    <div className={styles.settingsContainer}>
      <h2 className={styles.settingsTitle}>Общая статистика</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-medium text-gray-600 mb-2">Пользователи</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Всего:</span>
              <span className="text-sm font-medium">{stats.totalUsers}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Активные сегодня:</span>
              <span className="text-sm font-medium">{stats.activeUsers}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Новые сегодня:</span>
              <span className="text-sm font-medium">{stats.newUsersToday}</span>
            </div>
          </div>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-600 mb-2">Контент</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Курсы:</span>
              <span className="text-sm font-medium">{stats.totalCourses}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Посты:</span>
              <span className="text-sm font-medium">{stats.totalPosts}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className={styles.settingsContainer}>
      <h2 className={styles.settingsTitle}>Настройки админ панели</h2>
      <div className={styles.settingsGroup}>
        <label className={styles.settingsLabel}>Email администратора</label>
        <input
          type="email"
          value={profile?.email || ''}
          readOnly
          className={styles.settingsInput}
        />
      </div>
      <div className={styles.settingsGroup}>
        <label className={styles.settingsLabel}>Текущий пользователь</label>
        <input
          type="text"
          value={profile?.username || ''}
          readOnly
          className={styles.settingsInput}
        />
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return renderDashboard();
      case 'users':
        return renderUsers();
      case 'courses':
        return renderCourses();
      case 'posts':
        return renderPosts();
      case 'notifications':
        return renderNotifications();
      case 'stats':
        return renderStats();
      case 'settings':
        return renderSettings();
      default:
        return renderDashboard();
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={styles.menuButton}
            >
              {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
            <h1 className={styles.title}>Админ Панель</h1>
          </div>
          <div className={styles.headerRight}>
            <div className={styles.userInfo}>
              <span className={styles.userName}>{profile?.username}</span>
            </div>
            <button
              onClick={handleLogout}
              className={styles.logoutButton}
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <div className={styles.layout}>
        {/* Sidebar */}
        <aside className={`${styles.sidebar} ${sidebarOpen ? '' : styles.collapsed}`}>
          <nav className={styles.sidebarNav}>
            <div className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`${styles.menuItem} ${activeTab === item.id ? styles.active : ''}`}
                  >
                    <Icon className={styles.menuIcon} />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className={styles.mainContent}>
          <div className={styles.fadeIn}>
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminPanel;
