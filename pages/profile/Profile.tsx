// src/pages/Profile.tsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useProfile } from "../../context/ProfileContext";
import ProfileHeader from "./ProfileHeader";
import ProfileDetails from "./ProfileDetails";
import PostsSection from "./PostsSection";
import MyCoursesSection from "../coursesSection/MyCoursesSection";
import VerifySchool from "../verefySchool/VerifySchool";
import FollowManagement from "./FollowManagement";
import styles from "./Profile.module.css";

const Profile: React.FC = () => {
  const { profile, setProfile, saveProfile, loading } = useProfile();
  const [showDetails, setShowDetails] = useState(false);
  const [showSchoolForm, setShowSchoolForm] = useState(false);
  const [, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleLogout = async () => {
    if (window.confirm("Вы уверены, что хотите выйти?")) {
      // Очищаем localStorage
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      setProfile(null);
      window.location.href = "/login";
    }
  };

  if (loading || !profile) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingContent}>
          <div className={styles.spinner}></div>
          <p>Загружаем ваш профиль...</p>
          <span className={styles.loadingSubtitle}>Это займет всего секунду</span>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={styles.profileContainer}
    >
      {/* Основной контент */}
      <div className={styles.mainContent}>
        {/* Левый сайдбар с профилем */}
        <h1 className={styles.profileTitle}>Профиль</h1>
        <div className={styles.leftPanel}>
          <ProfileHeader
            profile={profile}
            onEditToggle={() => setShowDetails(!showDetails)}
            isExpanded={showDetails}
            onProfileUpdate={setProfile}
            onLogout={handleLogout} // Передаем функцию выхода в хедер
          />
          
          <AnimatePresence>
            {showDetails && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className={styles.detailsWrapper}
              >
                <ProfileDetails 
                  profile={profile} 
                  setProfile={setProfile} 
                  onSave={saveProfile} 
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Центральная часть с постами */}
        <div className={styles.centerPanel}>
          <PostsSection />
        </div>

        {/* Правый сайдбар */}
        <div className={styles.rightPanel}>
          <FollowManagement />
          <MyCoursesSection />
          
          {!profile.verified_school && (
            <div className={styles.schoolPrompt}>
              <div className={styles.iconWrapper}>
                <span className={styles.promptIcon}>🎓</span>
              </div>

              <div className={styles.text}>
                <h4>Подтвердите школу</h4>
                <p>Откройте полный доступ к возможностям платформы</p>
              </div>

              <button
                onClick={() => setShowSchoolForm(true)}
                className={styles.promptButton}
              >
                Подтвердить
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Модалка верификации школы */}
      <AnimatePresence>
        {showSchoolForm && (
          <motion.div
            className={styles.modalBackdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSchoolForm(false)}
          >
            <motion.div
              className={styles.modalContent}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              transition={{ type: "spring", damping: 25 }}
              onClick={(e) => e.stopPropagation()}
            >
              <VerifySchool 
                onClose={() => setShowSchoolForm(false)} 
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Profile;