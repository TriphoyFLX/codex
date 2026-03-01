import React from "react";
import { MapPin, GraduationCap, Calendar, Award } from "lucide-react";
import { useProfile } from "../../context/ProfileContext";
import { useFollowSystem } from "../../hooks/useFollowSystem";
import Avatar from "../../components/Avatar";
import styles from "./PublicProfile.module.css";

interface PublicProfileHeaderProps {
  profile: any;
}

const PublicProfileHeader: React.FC<PublicProfileHeaderProps> = ({ profile }) => {
  const { profile: currentProfile } = useProfile();
  const { followStats, loading, toggleFollow } = useFollowSystem(currentProfile?.id, profile?.id);
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getFullName = () => {
    if (profile.full_name) return profile.full_name;
    if (profile.first_name || profile.last_name) {
      return `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
    }
    return profile.username || 'Пользователь';
  };

  return (
    <div className={styles.profileHeader}>
      <div className={styles.headerContent}>
        <div className={styles.avatarSection}>
          <div className={styles.avatarContainer}>
            <Avatar
              src={profile.avatar_url || undefined}
              firstName={profile.first_name || undefined}
              lastName={profile.last_name || undefined}
              size="large"
            />
          </div>
          <div className={styles.profileInfo}>
            <h1 className={styles.profileName}>{getFullName()}</h1>
            {profile.username && (
              <p className={styles.username}>@{profile.username}</p>
            )}
            
            <div className={styles.followSection}>
              <div className={styles.followStats}>
                <span className={styles.followCount}>{followStats.followers_count} подписчиков</span>
                <span className={styles.followCount}>{followStats.following_count} подписок</span>
              </div>
              
              {currentProfile?.id !== profile?.id && (
                <button
                  className={`${styles.followButton} ${followStats.is_following ? styles.following : ''}`}
                  onClick={toggleFollow}
                  disabled={loading}
                >
                  {loading ? 'Загрузка...' : followStats.is_following ? 'Отписаться' : 'Подписаться'}
                </button>
              )}
            </div>
            
            <div className={styles.profileMeta}>
              {profile.role && (
                <div className={styles.metaItem}>
                  <Award size={16} />
                  <span>{profile.role === 'teacher' ? 'Преподаватель' : 'Студент'}</span>
                </div>
              )}
              {profile.school && (
                <div className={styles.metaItem}>
                  <GraduationCap size={16} />
                  <span>{profile.school}</span>
                </div>
              )}
              {profile.city && (
                <div className={styles.metaItem}>
                  <MapPin size={16} />
                  <span>{profile.city}</span>
                </div>
              )}
              <div className={styles.metaItem}>
                <Calendar size={16} />
                <span>На платформе с {formatDate(profile.created_at)}</span>
              </div>
            </div>
          </div>
        </div>

        {(profile.interests || profile.grade) && (
          <div className={styles.additionalInfo}>
            {profile.grade && (
              <div className={styles.infoCard}>
                <h3>Класс</h3>
                <p>{profile.grade}</p>
              </div>
            )}
            {profile.interests && (
              <div className={styles.infoCard}>
                <h3>Интересы</h3>
                <p>{profile.interests}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicProfileHeader;
