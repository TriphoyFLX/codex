import React, { useEffect, useState } from 'react';
import { CheckCircle, Clock, X, User, Calendar, ArrowUpRight, Search, Mail, Phone } from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import { useProfile } from '../../context/ProfileContext';
import styles from './AdminApplications.module.css';

interface Application {
  id: string;
  course_id: string;
  user_id: string;
  name: string;
  phone: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  course_name: string;
  user_first_name: string;
  user_last_name: string;
  user_email: string;
}

const AdminApplications: React.FC = () => {
  const { profile } = useProfile();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await apiClient.get('/courses/applications');
      setApplications(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching applications:', error);
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (applicationId: string, newStatus: 'approved' | 'rejected') => {
    try {
      await apiClient.put(`/courses/applications/${applicationId}`, { status: newStatus });
      fetchApplications(); // Обновляем список
      alert(`Статус заявки изменен на "${newStatus === 'approved' ? 'одобрен' : 'отклонен'}"`);
    } catch (error) {
      console.error('Error updating application:', error);
      alert('Ошибка при обновлении статуса');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'approved': return '#10b981';
      case 'rejected': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock size={16} />;
      case 'approved': return <CheckCircle size={16} />;
      case 'rejected': return <X size={16} />;
      default: return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'На рассмотрении';
      case 'approved': return 'Одобрен';
      case 'rejected': return 'Отклонена';
      default: return status;
    }
  };

  const filteredApplications = applications.filter(app => 
    app.course_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.user_first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.user_last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.user_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!profile || profile.role !== 'teacher') {
    return (
      <div className={styles.accessDenied}>
        <div className={styles.accessMessage}>
          <User size={48} />
          <h2>Доступ запрещен</h2>
          <p>Только учителя могут просматривать эту страницу</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Загрузка заявок...</p>
      </div>
    );
  }

  return (
    <div className={styles.adminContainer}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Заявки на курсы</h1>
          <p className={styles.subtitle}>Управление заявками студентов на курсы</p>
        </div>
        
        <div className={styles.searchContainer}>
          <Search size={20} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Поиск по имени, email или курсу"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>

      <div className={styles.statsContainer}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <Clock size={24} />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statNumber}>{filteredApplications.filter(a => a.status === 'pending').length}</div>
            <div className={styles.statLabel}>На рассмотрении</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <CheckCircle size={24} />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statNumber}>{filteredApplications.filter(a => a.status === 'approved').length}</div>
            <div className={styles.statLabel}>Одобрено</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <X size={24} />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statNumber}>{filteredApplications.filter(a => a.status === 'rejected').length}</div>
            <div className={styles.statLabel}>Отклонено</div>
          </div>
        </div>
      </div>

      <div className={styles.applicationsList}>
        {filteredApplications.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <User size={48} />
            </div>
            <h3>Заявки не найдены</h3>
            <p>Попробуйте изменить параметры поиска</p>
          </div>
        ) : (
          filteredApplications.map((application) => (
            <div key={application.id} className={styles.applicationCard}>
              <div className={styles.cardHeader}>
                <div className={styles.courseInfo}>
                  <h3 className={styles.courseName}>{application.course_name}</h3>
                  <div className={styles.applicantInfo}>
                    <span className={styles.applicantName}>
                      {application.user_first_name} {application.user_last_name}
                    </span>
                    <span className={styles.applicantEmail}>{application.user_email}</span>
                  </div>
                </div>
                
                <div className={styles.statusContainer}>
                  <div 
                    className={styles.statusBadge}
                    data-status={application.status}
                  >
                    {getStatusIcon(application.status)}
                    <span>{getStatusText(application.status)}</span>
                  </div>
                </div>
              </div>

              <div className={styles.cardContent}>
                <div className={styles.contactInfo}>
                  <div className={styles.contactItem}>
                    <Mail size={16} className={styles.contactIcon} />
                    <span>{application.user_email}</span>
                  </div>
                  <div className={styles.contactItem}>
                    <Phone size={16} className={styles.contactIcon} />
                    <span>{application.phone}</span>
                  </div>
                  <div className={styles.contactItem}>
                    <Calendar size={16} className={styles.contactIcon} />
                    <span>{new Date(application.created_at).toLocaleDateString('ru-RU')}</span>
                  </div>
                </div>
                
                <div className={styles.actions}>
                  {application.status === 'pending' && (
                    <button 
                      className={styles.approveButton}
                      onClick={() => handleStatusUpdate(application.id, 'approved')}
                    >
                      <CheckCircle size={16} />
                      Одобрить
                    </button>
                  )}
                  
                  {application.status === 'pending' && (
                    <button 
                      className={styles.rejectButton}
                      onClick={() => handleStatusUpdate(application.id, 'rejected')}
                    >
                      <X size={16} />
                      Отклонить
                    </button>
                  )}
                  
                  {application.status === 'approved' && (
                    <button className={styles.viewCourseButton}>
                      <ArrowUpRight size={16} />
                      Перейти к курсу
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminApplications;