import React, { useState } from "react";
import { Users, UserPlus } from "lucide-react";
import { useUserFollows } from "../../hooks/useFollowSystem";
import { useProfile } from "../../context/ProfileContext";
import styles from "./FollowManagement.module.css";

const FollowManagement: React.FC = () => {
  const { profile } = useProfile();
  const { followers, following, loading } = useUserFollows(profile?.id);
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>('followers');

  if (!profile?.id) {
    return null;
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getUserName = (user: any) => {
    if (user.first_name || user.last_name) {
      return `${user.first_name || ''} ${user.last_name || ''}`.trim();
    }
    return user.username || 'Пользователь';
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Подписки</h2>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'followers' ? styles.active : ''}`}
            onClick={() => setActiveTab('followers')}
          >
            <Users size={16} />
            Подписчики ({followers.length})
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'following' ? styles.active : ''}`}
            onClick={() => setActiveTab('following')}
          >
            <UserPlus size={16} />
            Подписки ({following.length})
          </button>
        </div>
      </div>

      <div className={styles.content}>
        {activeTab === 'followers' && (
          <div className={styles.userList}>
            {followers.length === 0 ? (
              <div className={styles.emptyState}>
                <Users size={48} className={styles.emptyIcon} />
                <h3>Нет подписчиков</h3>
                <p>У вас пока нет подписчиков</p>
              </div>
            ) : (
              followers.map((user) => (
                <div key={user.id} className={styles.userCard}>
                  <div className={styles.userInfo}>
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url.startsWith('http') ? user.avatar_url : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://85.198.70.191'}${user.avatar_url}`}
                        alt={getUserName(user)}
                        className={styles.userAvatar}
                      />
                    ) : (
                      <div className={styles.defaultAvatar}>
                        <Users size={32} />
                      </div>
                    )}
                    <div className={styles.userDetails}>
                      <h4 className={styles.userName}>{getUserName(user)}</h4>
                      <p className={styles.userDate}>Подписан {formatDate(user.created_at)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'following' && (
          <div className={styles.userList}>
            {following.length === 0 ? (
              <div className={styles.emptyState}>
                <UserPlus size={48} className={styles.emptyIcon} />
                <h3>Нет подписок</h3>
                <p>Вы еще ни на кого не подписаны</p>
              </div>
            ) : (
              following.map((user) => (
                <div key={user.id} className={styles.userCard}>
                  <div className={styles.userInfo}>
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url.startsWith('http') ? user.avatar_url : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://85.198.70.191'}${user.avatar_url}`}
                        alt={getUserName(user)}
                        className={styles.userAvatar}
                      />
                    ) : (
                      <div className={styles.defaultAvatar}>
                        <Users size={32} />
                      </div>
                    )}
                    <div className={styles.userDetails}>
                      <h4 className={styles.userName}>{getUserName(user)}</h4>
                      <p className={styles.userDate}>Подписан на {formatDate(user.created_at)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FollowManagement;
