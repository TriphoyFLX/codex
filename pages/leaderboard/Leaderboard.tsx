// src/components/Leaderboard.tsx
import React, { useEffect, useState } from "react";
import { useLeaderboard } from "../../hooks/useLeaderboard";
import { useProfile } from "../../context/ProfileContext";
import { apiClient } from "../../lib/apiClient";
import Avatar from "../../components/Avatar";
import styles from "./leaderboard.module.css";
import { Trophy, Star, TrendingUp } from "lucide-react";

const Leaderboard: React.FC = () => {
  const { profile } = useProfile();
  const { leaderboard, loading, getUserStats } = useLeaderboard();
  const [userStats, setUserStats] = useState<any>(null);
  const [timeFilter, setTimeFilter] = useState<'all' | 'week' | 'month'>('all');

  useEffect(() => {
    if (profile?.id) {
      const stats = getUserStats(profile.id);
      setUserStats(stats);
    }
  }, [profile?.id, leaderboard, getUserStats]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getRankColor = (rank: number) => {
    switch(rank) {
      case 1: return '#FFD700'; // Золото
      case 2: return '#C0C0C0'; // Серебро
      case 3: return '#CD7F32'; // Бронза
      default: return '#4B5563';
    }
  };

  const getRankIcon = (rank: number) => {
    switch(rank) {
      case 1: return "🥇";
      case 2: return "🥈";
      case 3: return "🥉";
      default: return `#${rank}`;
    }
  };

  if (loading) {
    return (
      <div className={styles.leaderboardContainer}>
        <div className={styles.loading}>
          <div className={styles.loadingSpinner}></div>
          <p>Загрузка рейтинга...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.leaderboardContainer}>
      <div className={styles.leaderboardHeader}>
        <h2 className={styles.leaderboardTitle}>
          <Trophy size={24} />
          Рейтинг игроков
        </h2>
        
        <div className={styles.filters}>
          <button 
            className={`${styles.filterButton} ${timeFilter === 'all' ? styles.active : ''}`}
            onClick={() => setTimeFilter('all')}
          >
            Все время
          </button>
          <button 
            className={`${styles.filterButton} ${timeFilter === 'month' ? styles.active : ''}`}
            onClick={() => setTimeFilter('month')}
          >
            За месяц
          </button>
          <button 
            className={`${styles.filterButton} ${timeFilter === 'week' ? styles.active : ''}`}
            onClick={() => setTimeFilter('week')}
          >
            За неделю
          </button>
        </div>
      </div>

      {/* Первые три места с особым оформлением */}
      <div className={styles.topThree}>
        {leaderboard.slice(0, 3).map((entry) => (
          <div key={entry.id} className={`${styles.topPlace} ${styles[`place${entry.rank}`]}`}>
            <div className={styles.rankBadge} style={{ backgroundColor: getRankColor(entry.rank) }}>
              {getRankIcon(entry.rank)}
            </div>
            <div className={styles.avatarContainer}>
              <Avatar
                username={entry.username}
                size="large"
              />
              {entry.rank === 1 && <div className={styles.crown}>👑</div>}
            </div>
            <div className={styles.userInfo}>
              <h3 className={styles.userName}>
                {entry.username}
              </h3>
              <p className={styles.username}>@{entry.username}</p>
            </div>
            <div className={styles.scoreInfo}>
              <div className={styles.scoreValue}>
                <Trophy size={18} />
                {entry.total_points.toLocaleString()} очков
              </div>
              <div className={styles.levelBadge}>
                Средний балл: {entry.average_score.toFixed(1)}
              </div>
            </div>
            <div className={styles.stats}>
              <span className={styles.stat}>
                <Star size={14} />
                {entry.quizzes_completed} тестов
              </span>
              <span className={styles.stat}>
                <TrendingUp size={14} />
                Серия: {entry.streak}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Остальной рейтинг */}
      <div className={styles.leaderboardList}>
        <div className={styles.listHeader}>
          <div className={styles.headerCell}>Место</div>
          <div className={styles.headerCell}>Игрок</div>
          <div className={styles.headerCell}>Уровень</div>
          <div className={styles.headerCell}>Очки</div>
          <div className={styles.headerCell}>Задания</div>
          <div className={styles.headerCell}>Активность</div>
        </div>

        {leaderboard.slice(3).map((entry) => (
          <div key={entry.id} className={styles.leaderboardItem}>
            <div className={styles.rankCell}>
              <span className={styles.rankNumber} style={{ color: getRankColor(entry.rank) }}>
                {entry.rank}
              </span>
            </div>
            
            <div className={styles.userCell}>
              <div className={styles.userWrapper}>
                <Avatar
                  username={entry.username}
                  size="small"
                />
                <div className={styles.userDetails}>
                  <span className={styles.userName}>
                    {entry.username}
                  </span>
                  <span className={styles.username}>@{entry.username}</span>
                </div>
              </div>
            </div>
            
            <div className={styles.levelCell}>
              <span className={styles.levelTag}>
                Ср. балл: {entry.average_score.toFixed(1)}
              </span>
            </div>
            
            <div className={styles.scoreCell}>
              <div className={styles.scoreWrapper}>
                <Trophy size={16} className={styles.scoreIcon} />
                <span className={styles.scoreValue}>{entry.total_points.toLocaleString()}</span>
              </div>
            </div>
            
            <div className={styles.quizzesCell}>
              <div className={styles.quizzesWrapper}>
                <span className={styles.quizzesCount}>{entry.quizzes_completed}</span>
                <span className={styles.quizzesLabel}>тестов</span>
              </div>
            </div>
            
            <div className={styles.activityCell}>
              <div className={styles.activityWrapper}>
                <span className={styles.lastActivity} title="Последняя активность">
                  {formatDate(entry.last_activity)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Статистика текущего пользователя */}
      {userStats && (
        <div className={styles.userStats}>
          <h3>Ваша позиция в рейтинге</h3>
          <div className={styles.userStatsGrid}>
            <div className={styles.statItem}>
              <div className={styles.statLabel}>Ваш ранг</div>
              <div className={styles.statValue}>
                #{userStats.user_rank}
              </div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statLabel}>Ваши баллы</div>
              <div className={styles.statValue}>
                {userStats.user_points.toLocaleString()}
              </div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statLabel}>Лучший счет</div>
              <div className={styles.statValue}>
                {userStats.top_score.toLocaleString()}
              </div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statLabel}>Средний балл</div>
              <div className={styles.statValue}>
                {userStats.average_points}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;