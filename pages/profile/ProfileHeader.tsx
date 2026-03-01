// src/components/profile/ProfileHeader.tsx
import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import Avatar from "../../components/Avatar";

import { 
  Edit3, 
  CheckCircle, 
  Upload, 
  Award, 
  MapPin, 
  Mail, 
  GraduationCap,
  LogOut,
  ChevronRight,
  User
} from "lucide-react";
import { apiClient } from "../../lib/apiClient";
import styles from "./ProfileHeader.module.css";

interface ProfileHeaderProps {
  profile: any;
  onEditToggle: () => void;
  isExpanded: boolean;
  onProfileUpdate: (newProfile: any) => void;
  onLogout?: () => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  profile,
  onEditToggle,
  isExpanded,
  onProfileUpdate,
  onLogout
}) => {
  const [uploading, setUploading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showFullBio, setShowFullBio] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Определение мобильного устройства
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file || !profile.id) return;

      setUploading(true);

      // Проверка размера файла
      if (file.size > 5 * 1024 * 1024) {
        alert("Файл слишком большой. Максимальный размер: 5MB");
        return;
      }

      // Проверка типа файла
      const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/gif"];
      if (!allowedTypes.includes(file.type)) {
        alert("Можно загружать только изображения: PNG, JPG, JPEG, GIF");
        return;
      }

      // Загрузка файла на сервер
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch(`${import.meta.env.VITE_API_URL || '${import.meta.env.VITE_API_URL?.replace("/api", "") || "http://85.198.70.191"}/api'}/avatars`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Ошибка загрузки аватарки');
      }

      const data = await response.json();
      const avatarUrl = data.avatarUrl;

      // Обновление профиля с новым URL аватарки
      const updatedProfile = await apiClient.put(`/profiles/${profile.id}`, {
        avatar_url: avatarUrl
      });

      onProfileUpdate(updatedProfile.data);
      alert("Аватар обновлен!");
      
    } catch (err: any) {
      console.error("Ошибка загрузки аватарки:", err);
      alert(err.message || "Ошибка при загрузке изображения");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleLogoutClick = () => {
    if (window.confirm("Вы уверены, что хотите выйти?")) {
      onLogout?.();
    }
  };

  const getRoleLabel = (role: string) => {
    switch(role) {
      case 'teacher': return 'Учитель';
      case 'student': return 'Ученик';
      case 'admin': return 'Администратор';
      default: return 'Пользователь';
    }
  };

  // Функция для обрезки длинной биографии на мобильных
  const truncateBio = (bio: string, maxLength: number = 120) => {
    if (!bio) return '';
    if (!isMobile || showFullBio || bio.length <= maxLength) {
      return bio;
    }
    return bio.substring(0, maxLength) + '...';
  };

  return (
    <motion.div 
      className={styles.profileHeader}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Мобильное меню вверху */}
      <div className={styles.mobileHeader}>
        <div className={styles.mobileHeaderTop}>
          <div className={styles.mobileTitle}>
            <User size={20} />
            <span>Профиль</span>
          </div>
          
          {onLogout && isMobile && (
            <motion.button
              className={styles.mobileLogoutButton}
              onClick={handleLogoutClick}
              whileTap={{ scale: 0.95 }}
              title="Выйти"
              aria-label="Выйти из аккаунта"
            >
              <LogOut size={18} />
            </motion.button>
          )}
        </div>
      </div>

      {/* Основной контент */}
      <div className={styles.profileContent}>
        {/* Аватар на мобильных - по центру */}
        <div className={styles.avatarSection}>
          <div 
            className={styles.avatarContainer}
            onTouchStart={() => setIsHovered(true)}
            onTouchEnd={() => setTimeout(() => setIsHovered(false), 1000)}
          >
            <div className={styles.avatarWrapper}>
              <Avatar
                src={profile.avatar_url || undefined}
                firstName={profile.first_name || undefined}
                lastName={profile.last_name || undefined}
                size="large"
              />
              
              {profile.verified_school && (
                <motion.div 
                  className={styles.verifiedBadge}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  title="Школа подтверждена"
                >
                  <CheckCircle size={16} />
                </motion.div>
              )}
              
              {isHovered && (
                <motion.div 
                  className={styles.avatarOverlay}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <Upload size={20} />
                  <span>Изменить фото</span>
                </motion.div>
              )}
            </div>
            
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleAvatarUpload}
              className={styles.fileInput}
              aria-label="Загрузить новое фото профиля"
            />
          </div>
          
          <motion.button
            className={styles.editAvatarButton}
            onClick={() => fileInputRef.current?.click()}
            whileTap={{ scale: 0.95 }}
            disabled={uploading}
            aria-label="Изменить фото профиля"
          >
            {uploading ? "Загрузка..." : "Изменить фото"}
          </motion.button>
        </div>

        {/* Основная информация - адаптивная */}
        <div className={styles.infoSection}>
          <div className={styles.nameSection}>
            <h1 className={styles.name}>
              {profile.first_name || "Имя"} {profile.last_name || "Фамилия"}
              {profile.username && (
                <span className={styles.username}>@{profile.username}</span>
              )}
            </h1>
            
            <div className={styles.roleSection}>
              <motion.span
                className={styles.roleBadge}
                data-role={profile.role}
                whileTap={{ scale: 0.95 }}
              >
                <span className={styles.roleStatusIndicator} />
                {getRoleLabel(profile.role)}
                {profile.role === 'admin' && (
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                )}
              </motion.span>
              
              {profile.badges?.length > 0 && (
                <div className={styles.badgesPreview}>
                  <Award size={14} />
                  <span>{profile.badges.length}</span>
                </div>
              )}
            </div>
          </div>

          {/* Статистика - сверху на мобильных */}
          <div className={styles.mobileStats}>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>{profile.lessons_completed || 0}</span>
              <span className={styles.statLabel}>уроков</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <span className={styles.statNumber}>{profile.completed_tasks || 0}</span>
              <span className={styles.statLabel}>заданий</span>
            </div>
          </div>

          {/* Детали профиля - адаптивная сетка */}
          <div className={styles.detailsGrid}>
            {profile.grade && (
              <div className={styles.detailItem}>
                <div className={styles.detailIcon}>
                  <GraduationCap size={16} />
                </div>
                <div className={styles.detailContent}>
                  <span className={styles.detailLabel}>Класс</span>
                  <span className={styles.detailValue}>
                    {profile.grade}
                    {profile.letter ? `-${profile.letter}` : ""}
                  </span>
                </div>
              </div>
            )}
            
            {profile.school && (
              <div className={styles.detailItem}>
                <div className={styles.detailIcon}>
                  <CheckCircle size={16} />
                </div>
                <div className={styles.detailContent}>
                  <span className={styles.detailLabel}>Школа</span>
                  <span className={styles.detailValue}>{profile.school}</span>
                </div>
              </div>
            )}
            
            {profile.city && (
              <div className={styles.detailItem}>
                <div className={styles.detailIcon}>
                  <MapPin size={16} />
                </div>
                <div className={styles.detailContent}>
                  <span className={styles.detailLabel}>Город</span>
                  <span className={styles.detailValue}>{profile.city}</span>
                </div>
              </div>
            )}
            
            {profile.email && (
              <div className={styles.detailItem}>
                <div className={styles.detailIcon}>
                  <Mail size={16} />
                </div>
                <div className={styles.detailContent}>
                  <span className={styles.detailLabel}>Email</span>
                  <span className={styles.detailValue}>{profile.email}</span>
                </div>
              </div>
            )}
          </div>

          {/* Биография с кнопкой "Показать больше" */}
          {profile.bio && (
            <div className={styles.bioSection}>
              <p className={styles.bio}>
                {truncateBio(profile.bio)}
                {profile.bio.length > 120 && isMobile && !showFullBio && (
                  <button 
                    className={styles.showMoreButton}
                    onClick={() => setShowFullBio(true)}
                  >
                    Показать больше
                  </button>
                )}
              </p>
              {showFullBio && isMobile && (
                <button 
                  className={styles.showLessButton}
                  onClick={() => setShowFullBio(false)}
                >
                  Скрыть
                </button>
              )}
            </div>
          )}

          {/* Интересы - адаптивные */}
          {profile.interests && (
            <div className={styles.interestsSection}>
              <div className={styles.interestsHeader}>
                <span className={styles.interestsLabel}>Интересы</span>
                {isMobile && (
                  <ChevronRight size={16} className={styles.interestsChevron} />
                )}
              </div>
              <div className={styles.interestsList}>
                {profile.interests.split(',').slice(0, isMobile ? 3 : undefined).map((interest: string, index: number) => (
                  <span key={index} className={styles.interestTag}>
                    {interest.trim()}
                  </span>
                ))}
                {isMobile && profile.interests.split(',').length > 3 && (
                  <span className={styles.moreInterests}>
                    +{profile.interests.split(',').length - 3}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Кнопка редактирования - адаптивная */}
        <div className={styles.actionSection}>
          <motion.button
            className={`${styles.editButton} ${isExpanded ? styles.expanded : ""}`}
            onClick={onEditToggle}
            whileTap={{ scale: 0.98 }}
            aria-label={isExpanded ? "Скрыть редактор" : "Редактировать профиль"}
            aria-expanded={isExpanded}
          >
            <motion.div
              animate={isExpanded ? { rotate: 45 } : { rotate: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
            >
              <Edit3 size={16} />
            </motion.div>
            <span>
              {isExpanded ? "Скрыть" : "Редактировать"}
            </span>
          </motion.button>
          
          {/* Десктоп версия кнопки выхода */}
          {onLogout && !isMobile && (
            <motion.button
              className={styles.desktopLogoutButton}
              onClick={handleLogoutClick}
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.05 }}
              title="Выйти из аккаунта"
              aria-label="Выйти из аккаунта"
            >
              <LogOut size={18} />
              <span>Выйти</span>
            </motion.button>
          )}
          
          {/* Десктоп версия статистики */}
          <div className={styles.desktopStats}>
            <div className={styles.statPreview}>
              <span className={styles.statPreviewNumber}>{profile.lessons_completed || 0}</span>
              <span className={styles.statPreviewLabel}>уроков</span>
            </div>
            <div className={styles.statPreview}>
              <span className={styles.statPreviewNumber}>{profile.completed_tasks || 0}</span>
              <span className={styles.statPreviewLabel}>заданий</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProfileHeader;