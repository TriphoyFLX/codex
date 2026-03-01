import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./Sidebar.module.css";
import { useProfile } from "../context/ProfileContext";
import { useSidebar } from "../context/SidebarContext";
import Avatar from "./Avatar";
import CodexLogo from "../assets/codexlogo.png";

// =======================================================
// Иконки (остаются без изменений)
// =======================================================
const HomeIcon = () => (
  <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 5.69l5 4.5V18h-4v-4h-2v4H7v-7.81zM12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3z" />
  </svg>
);

const CoursesIcon = () => (
  <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2L4 5v6.5C4 17.13 7.84 22 12 22s8-4.87 8-10.5V5l-8-3zm0 18.2C8.24 19.3 6 15.65 6 12V6.3l6-2.25 6 2.25V12c0 3.65-2.24 7.3-6 8.2z" />
  </svg>
);

const ProfileIcon = () => (
  <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
  </svg>
);

const PracticeIcon = () => (
  <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
    <path d="M17 19.22H5V7.96h7.02l2-2H5c-1.1 0-2 .9-2 2v12.04c0 1.1.89 2 2 2h14c1.1 0 2-.89 2-2V9.98l-2 2V19.22zM19.98 3H14v2h2.58l-8.5 8.5L9 15l8.5-8.5V9h2V3z" />
  </svg>
);

const AIPromptIcon = () => (
  <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.83-7-7.93h2c0 3.31 2.69 6 6 6v2c-2.43 0-4.66-1.19-6-3.04zM12 4c3.31 0 6 2.69 6 6h2c0-3.95-3.05-7-7-7V4zm6 12c-2.43 0-4.66-1.19-6-3.04v-2c3.31 0 6-2.69 6-6h2c0 3.95-3.05 7-7 7v2z" />
  </svg>
);

const LeaderboardIcon = () => (
  <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
    <path d="M13.5 5H18v16h-4.5V5zM3 13.5h4.5v7.5H3v-7.5zM8.25 9H12v12H8.25V9z" />
  </svg>
);

const PostsIcon = () => (
  <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
  </svg>
);

const ScheduleIcon = () => (
  <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
    <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.89.89-2 2v14c0 1.1.89 2 2 2h14c1.11 0 2-.89 2-2V5c0-1.11-.89-2-2-2zm-5 16H10v-2h4v2z" />
  </svg>
);

const MoreIcon = () => (
  <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
  </svg>
);

const ApplicationsIcon = () => (
  <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
    <path d="M9 4v1.38c-.83-.33-1.72-.5-2.61-.5-1.79 0-3.58.68-4.95 2.05l3.33 3.33h1.11v1.11c0 .86.16 1.71.47 2.5L9 14.58V4zm6.61 6.61L16.56 9c-.36-1.78-1.59-3.22-3.22-3.87l-.34.34 3.33 3.33h.28zm-3.22-3.22l-6.05-6.05c-.69-.69-1.81-.69-2.5 0s-.69 1.81 0 2.5l6.05 6.05c.69.69 1.81.69 2.5 0s.69-1.81 0-2.5zM12 20c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z" />
  </svg>
);

const TasksIcon = () => (
  <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
    <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.89 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z" />
    <path d="M8 12h8v2H8zm0 4h8v2H8z" />
  </svg>
);

const TestsIcon = () => (
  <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
    <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z" />
  </svg>
);

const ScheduleManageIcon = () => (
  <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2l3.09 6.26L22 9l-1 1-1 1-6.91-6.26L12 2zm0 2.67l6.17 6.17L22 15.5l-1 1-1 1-6.83-6.83L12 4.67zM12 2l3.09 6.26L22 9l-1 1-1 1-6.91-6.26L12 2zm0 2.67l6.17 6.17L22 15.5l-1 1-1 1-6.83-6.83L12 4.67z" opacity="0.3"/>
  </svg>
);

// =======================================================
// Данные меню
// =======================================================
const mainItems = [
  { name: "Главная", icon: HomeIcon, href: "/" },
  { name: "Тесты", icon: TestsIcon, href: "/tests" },
  { name: "Задания", icon: TasksIcon, href: "/tasks" },
  { name: "Расписание", icon: ScheduleIcon, href: "/schedule" },
  { name: "Курсы", icon: CoursesIcon, href: "/courses" },
  { name: "Управление расписанием", icon: ScheduleManageIcon, href: "/schedule/manage", teacherOnly: true },
];

const hiddenItems = [
  { name: "Практика", icon: PracticeIcon, href: "/practice" },
  { name: "AI помощник", icon: AIPromptIcon, href: "/ai-assistant" },
  { name: "Лидерборд", icon: LeaderboardIcon, href: "/leaderboard" },
  { name: "Посты", icon: PostsIcon, href: "/posts" },
  { name: "Профиль", icon: ProfileIcon, href: "/profile" },
];

const adminItems = [
  { name: "Заявки", icon: ApplicationsIcon, href: "/admin/applications", teacherOnly: true },
];

const moreMobileItem = { name: "Ещё", icon: MoreIcon, href: "#more" };

// =======================================================
// Компонент Sidebar
// =======================================================
const Sidebar: React.FC = () => {
  const location = useLocation();
  const { profile } = useProfile() as {
    profile: {
      first_name?: string;
      last_name?: string;
      grade?: number;
      letter?: string;
      avatar_url?: string;
      role?: string;
    };
  };

  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
  const { isSidebarCollapsed, setIsSidebarCollapsed } = useSidebar();
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  // Определяем мобильное устройство и обработка ресайза
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);

      if (!mobile && window.innerWidth <= 1024) {
        setIsSidebarCollapsed(true);
      } else {
        setIsSidebarCollapsed(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, [setIsSidebarCollapsed]);

  // Закрытие меню "Ещё" при клике снаружи
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    };

    if (isMoreMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      // Блокируем прокрутку при открытом меню
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "unset";
    };
  }, [isMoreMenuOpen]);

  // Закрытие меню при смене маршрута
  useEffect(() => {
    if (isMobile) {
      setIsMoreMenuOpen(false);
    }
  }, [location.pathname, isMobile]);

  const allItems = [...mainItems, ...hiddenItems, ...(profile?.role === 'teacher' ? adminItems : [])];
  const mobileItems = [...mainItems.slice(0, 4), moreMobileItem];
  const itemsToRender = isMobile ? mobileItems : allItems;

  const renderNavItem = (item: { name: string; icon: React.FC; href: string }) => {
    const isCurrentActive =
      item.href === "/" 
        ? location.pathname === "/" 
        : location.pathname.startsWith(item.href);

    const handleMoreClick = (e: React.MouseEvent) => {
      if (item.name === "Ещё" && isMobile) {
        e.preventDefault();
        setIsMoreMenuOpen(!isMoreMenuOpen);
      }
    };

    const IconOrAvatar =
      item.name === "Профиль" && isMobile && profile?.avatar_url ? (
        <motion.img
          src={profile.avatar_url}
          alt="Аватар"
          className={styles.userAvatar}
          style={{
            width: "22px",
            height: "22px",
            border: isCurrentActive ? "2px solid white" : "none",
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        />
      ) : (
        <motion.div 
          whileHover={{ scale: 1.1 }} 
          whileTap={{ scale: 0.95 }}
          className={styles.navIcon}
        >
          <item.icon />
        </motion.div>
      );

    return (
      <Link
        to={item.href}
        key={item.name}
        className={`${styles.navItem} ${isCurrentActive ? styles.active : ""}`}
        onClick={handleMoreClick}
      >
        {IconOrAvatar}
        <span className={styles.navItemText}>{item.name}</span>
      </Link>
    );
  };

  const getUserRoleText = () => {
    if (profile?.role === "teacher") return "Учитель";
    if (profile?.grade && profile?.letter) return `${profile.grade}${profile.letter} Класс`;
    return "Ученик";
  };

  return (
    <>
      <motion.div
        className={`${styles.sidebar} ${isMobile ? styles.mobile : ""} ${isSidebarCollapsed ? styles.collapsed : ""}`}
        initial={false}
        animate={{
          width: isMobile ? "100%" : isSidebarCollapsed ? "80px" : "280px",
          bottom: isMobile ? "0" : "auto",
          left: isMobile ? "0" : "auto",
        }}
        transition={{
          duration: 0.3,
          type: "spring",
          stiffness: 300,
          damping: 25,
        }}
      >
        {!isMobile && (
          <div className={styles.header}>
            <div className={styles.logoContainer}>
              <img src={CodexLogo} alt="Codex Logo" className={styles.logo} />
            </div>
            {!isSidebarCollapsed && (
              <span className={styles.title}>CODEX LEARN</span>
            )}
          </div>
        )}

        {/* Кнопка сворачивания на десктопе */}
        {!isMobile && (
          <button
            className={styles.collapseButton}
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            title={isSidebarCollapsed ? "Развернуть" : "Свернуть"}
            aria-label={isSidebarCollapsed ? "Развернуть сайдбар" : "Свернуть сайдбар"}
          >
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
              {isSidebarCollapsed ? (
                <path d="M10 17l5-5-5-5v10z" />
              ) : (
                <path d="M14 17l-5-5 5-5v10z" />
              )}
            </svg>
          </button>
        )}

        <nav className={styles.nav}>
          {itemsToRender.map(renderNavItem)}
          {!isMobile && hiddenItems.length > 0 && !isSidebarCollapsed && (
            <div className={styles.divider}></div>
          )}
        </nav>

        {/* Блок пользователя для десктопа */}
        {!isMobile && !isSidebarCollapsed && (
          <Link to="/profile" className={styles.userBlock} style={{ textDecoration: "none" }}>
            <Avatar
              src={profile?.avatar_url || undefined}
              firstName={profile?.first_name || undefined}
              lastName={profile?.last_name || undefined}
              size="medium"
            />  
            <div className={styles.userInfo}>
              <div className={styles.userName}>
                {profile?.first_name || "Пользователь"} {profile?.last_name || ""}
              </div>
              <div className={styles.userRole}>{getUserRoleText()}</div>
            </div>
          </Link>
        )}

        {/* Свернутый вид сайдбара */}
        {!isMobile && isSidebarCollapsed && (
          <div className={styles.collapsedUser}>
            <Link to="/profile">
              <Avatar
                src={profile?.avatar_url || undefined}
                firstName={profile?.first_name || undefined}
                lastName={profile?.last_name || undefined}
                size="small"
              />
            </Link>
          </div>
        )}
      </motion.div>

      {/* Мобильное меню "Ещё" */}
      <AnimatePresence>
        {isMobile && isMoreMenuOpen && (
          <>
            <motion.div
              className={styles.mobileMoreOverlay}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMoreMenuOpen(false)}
              transition={{ duration: 0.2 }}
            />
            <motion.div
              ref={moreMenuRef}
              className={styles.mobileMoreMenu}
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <div className={styles.mobileMoreHeader}>
                <h3>Дополнительно</h3>
                <button
                  className={styles.mobileMoreClose}
                  onClick={() => setIsMoreMenuOpen(false)}
                  aria-label="Закрыть меню"
                >
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                  </svg>
                </button>
              </div>
              <div className={styles.mobileMoreContent}>
                {[...hiddenItems, ...(profile?.role === 'teacher' ? adminItems : [])].map((item) => {
                  const isCurrentActive =
                    item.href === "/" 
                      ? location.pathname === "/" 
                      : location.pathname.startsWith(item.href);
                  
                  return (
                    <Link
                      to={item.href}
                      key={item.name}
                      className={`${styles.mobileMoreItem} ${isCurrentActive ? styles.active : ""}`}
                      onClick={() => setIsMoreMenuOpen(false)}
                    >
                      <motion.div 
                        className={styles.mobileMoreIcon}
                        whileHover={{ scale: 1.1 }}
                      >
                        <item.icon />
                      </motion.div>
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;