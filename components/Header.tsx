import React, { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Settings } from "lucide-react";
import styles from "./Header.module.css";
import { useProfile } from "../context/ProfileContext";
import { apiClient } from "../lib/apiClient";
import Avatar from "./Avatar";

const SearchIcon = ({ className }: { className?: string }) => (
  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const BellIcon = () => (
  <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z" />
  </svg>
);

const Header: React.FC = () => {
  const { profile } = useProfile();
  const location = useLocation();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.is_read).length;
  }, [notifications]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiClient.get('/notifications/my');
        if (Array.isArray(res.data)) {
          setNotifications(res.data);
        } else if (res.data && Array.isArray(res.data.items)) {
          setNotifications(res.data.items);
        } else {
          setNotifications([]);
        }
      } catch (e) {
        setNotifications([]);
      }
    };

    if (profile?.id) {
      load();
    }
  }, [profile?.id]);

  // Страницы, где хедер не нужен
  const hideHeader = [
    "/ai-assistant", 
    "/search", 
    "/login", 
    "/register", 
    "/create-profile",
    "/auth/callback"
  ].includes(location.pathname);

  // Имя пользователя или гость
  const name = profile?.first_name || "Гость";

  // Аватар пользователя (будет использоваться Avatar компонент)
  const avatarUrl = profile?.avatar_url;

  const handleSearchClick = () => {
    navigate("/search");
  };

  const handleAvatarClick = () => {
    navigate("/profile");
  };

  const handleBellClick = () => {
    setShowNotifications(!showNotifications);
  };

  const handleReadAll = async () => {
    try {
      await apiClient.post('/notifications/my/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (e) {
      // ignore
    }
  };

  const handleAdminClick = () => {
    navigate("/admin");
  };

  // Форматирование приветствия по времени суток
  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 6) return "Доброй ночи";
    if (hour < 12) return "Доброе утро";
    if (hour < 18) return "Добрый день";
    return "Добрый вечер";
  };

  const timeGreeting = getTimeGreeting();

  if (hideHeader) return null;

  return (
    <>
      <header className={styles.mainHeader}>
        {/* Левая часть - приветствие */}
        <div className={styles.greeting}>
          <motion.div 
            className={styles.greetingContent}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className={styles.greetingTitle}>
              <span className={styles.timeGreeting}>{timeGreeting},</span>{" "}
              <span className={styles.userName}>{name}!</span>
            </h2>
            <p className={styles.greetingSubtitle}>
              {profile?.role === 'teacher' 
                ? "Добро пожаловать в панель преподавателя" 
                : "Что будем изучать сегодня?"}
            </p>
          </motion.div>
        </div>

        {/* Правая часть - действия */}
        <div className={styles.headerActions}>
          {/* Поиск */}
          <motion.div 
            className={styles.searchBar}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSearchClick}
          >
            <SearchIcon className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Поиск: олимпиады, курсы, уроки..."
              readOnly
              className={styles.searchInput}
            />
          </motion.div>

          {/* Уведомления */}
          <div className={styles.notificationsWrapper}>
            <motion.button 
              className={styles.bellButton}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleBellClick}
            >
              <BellIcon />
              {unreadCount > 0 && (
                <span className={styles.notificationBadge}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </motion.button>

            {/* Выпадающий список уведомлений */}
            <AnimatePresence>
              {showNotifications && (
                <motion.div 
                  className={styles.notificationsDropdown}
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className={styles.notificationsHeader}>
                    <h4>Уведомления</h4>
                    <button 
                      className={styles.clearAllButton}
                      onClick={handleReadAll}
                    >
                      Очистить все
                    </button>
                  </div>
                  <div className={styles.notificationsList}>
                    {notifications.length === 0 ? (
                      <div className={styles.notificationItem}>
                        <div>
                          <p className={styles.notificationText}>Нет уведомлений</p>
                        </div>
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div key={n.user_notification_id ?? n.notification_id ?? n.id} className={styles.notificationItem}>
                          {!n.is_read && <div className={styles.notificationDot}></div>}
                          <div>
                            <p className={styles.notificationText}>{n.message || n.title}</p>
                            <span className={styles.notificationTime}>
                              {n.delivered_at ? new Date(n.delivered_at).toLocaleString('ru-RU') : ''}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Кнопка админ панели - только для администраторов */}
          {(profile?.email === 'admin@codex.com' || profile?.email === 'dimon2281337@mail.ru') && (
            <motion.button 
              className={styles.bellButton}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleAdminClick}
              title="Админ панель"
            >
              <Settings size={20} />
            </motion.button>
          )}

          {/* Аватар пользователя */}
          <motion.div 
            className={styles.userAvatar}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleAvatarClick}
          >
            <Avatar
              src={avatarUrl}
              alt={name}
              firstName={profile?.first_name}
              lastName={profile?.last_name}
              username={profile?.username}
              size="medium"
            />
            {profile?.verified_school && (
              <div className={styles.verifiedIndicator} title="Аккаунт подтвержден">
                ✓
              </div>
            )}
          </motion.div>
        </div>
      </header>

      {/* Затемнение при открытых уведомлениях */}
      <AnimatePresence>
        {showNotifications && (
          <motion.div 
            className={styles.notificationsBackdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowNotifications(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;