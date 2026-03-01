import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Award, Star, TrendingUp, Users, Target } from 'lucide-react';
import { useLeaderboard } from '../../hooks/useLeaderboard';
import { useAuth } from '../../hooks/useAuth';
import styles from './Leaderboard.module.css';

export const Leaderboard: React.FC = () => {
  const { user } = useAuth();
  const { leaderboard, stats, getUserStats, getTopPlayers, loading } = useLeaderboard();
  const [timeFilter, setTimeFilter] = useState<'all' | 'week' | 'month'>('all');
  const [userRank, setUserRank] = useState<number | null>(null);

  useEffect(() => {
    if (user && leaderboard.length > 0) {
      const userStats = getUserStats(user.id);
      if (userStats) {
        setUserRank(userStats.user_rank);
      }
    }
  }, [user, leaderboard, getUserStats]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy size={24} className={styles.goldIcon} />;
      case 2:
        return <Medal size={24} className={styles.silverIcon} />;
      case 3:
        return <Award size={24} className={styles.bronzeIcon} />;
      default:
        return <span className={styles.rankNumber}>{rank}</span>;
    }
  };

  const getRankBadgeClass = (rank: number) => {
    switch (rank) {
      case 1:
        return styles.goldBadge;
      case 2:
        return styles.silverBadge;
      case 3:
        return styles.bronzeBadge;
      default:
        return styles.defaultBadge;
    }
  };

  const topPlayers = getTopPlayers(10);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Загрузка лидерборда...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <Trophy size={32} className={styles.titleIcon} />
          <div>
            <h2 className={styles.title}>Лидерборд</h2>
            <p className={styles.subtitle}>Лучшие ученики платформы</p>
          </div>
        </div>
        
        <div className={styles.filters}>
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value as 'all' | 'week' | 'month')}
            className={styles.filterSelect}
          >
            <option value="all">Все время</option>
            <option value="week">Эта неделя</option>
            <option value="month">Этот месяц</option>
          </select>
        </div>
      </div>

      {/* Статистика */}
      {stats && (
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <Users size={24} className={styles.statIcon} />
            <div className={styles.statInfo}>
              <div className={styles.statValue}>{stats.total_users}</div>
              <div className={styles.statLabel}>Участников</div>
            </div>
          </div>
          
          <div className={styles.statCard}>
            <Target size={24} className={styles.statIcon} />
            <div className={styles.statInfo}>
              <div className={styles.statValue}>{stats.top_score}</div>
              <div className={styles.statLabel}>Рекорд</div>
            </div>
          </div>
          
          <div className={styles.statCard}>
            <TrendingUp size={24} className={styles.statIcon} />
            <div className={styles.statInfo}>
              <div className={styles.statValue}>{stats.average_points}</div>
              <div className={styles.statLabel}>Средний балл</div>
            </div>
          </div>
          
          {user && userRank && (
            <div className={`${styles.statCard} ${styles.userStatCard}`}>
              <Star size={24} className={styles.statIcon} />
              <div className={styles.statInfo}>
                <div className={styles.statValue}>#{userRank}</div>
                <div className={styles.statLabel}>Ваш ранг</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Таблица лидеров */}
      <div className={styles.leaderboardTable}>
        <div className={styles.tableHeader}>
          <div className={styles.headerCell}>Ранг</div>
          <div className={styles.headerCell}>Ученик</div>
          <div className={styles.headerCell}>Баллы</div>
          <div className={styles.headerCell}>Тестов</div>
          <div className={styles.headerCell}>Средний балл</div>
        </div>

        <div className={styles.tableBody}>
          {topPlayers.length === 0 ? (
            <div className={styles.emptyState}>
              <Trophy size={48} className={styles.emptyIcon} />
              <h3 className={styles.emptyTitle}>Пока нет результатов</h3>
              <p className={styles.emptyText}>
                Пройдите тесты, чтобы попасть в лидерборд
              </p>
            </div>
          ) : (
            topPlayers.map((player) => (
              <div
                key={player.id}
                className={`${styles.tableRow} ${
                  user && player.user_id === user.id ? styles.currentUserRow : ''
                }`}
              >
                <div className={styles.rankCell}>
                  <div className={`${styles.rankBadge} ${getRankBadgeClass(player.rank)}`}>
                    {getRankIcon(player.rank)}
                  </div>
                </div>
                
                <div className={styles.userCell}>
                  <div className={styles.userInfo}>
                    <div className={styles.avatar}>
                      {player.avatar ? (
                        <img src={player.avatar} alt={player.username} />
                      ) : (
                        <div className={styles.defaultAvatar}>
                          {player.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className={styles.userDetails}>
                      <div className={styles.username}>{player.username}</div>
                      {player.streak > 0 && (
                        <div className={styles.streak}>
                          <TrendingUp size={12} />
                          {player.streak} дней подряд
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className={styles.pointsCell}>
                  <div className={styles.points}>
                    <Star size={16} className={styles.pointsIcon} />
                    {player.total_points}
                  </div>
                </div>
                
                <div className={styles.quizzesCell}>
                  {player.quizzes_completed}
                </div>
                
                <div className={styles.averageCell}>
                  {Math.round(player.average_score)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Пользователь в лидерборде */}
      {user && userRank && userRank > 10 && (
        <div className={styles.userPosition}>
          <div className={styles.userPositionContent}>
            <span className={styles.userPositionLabel}>Ваша позиция:</span>
            <div className={`${styles.rankBadge} ${getRankBadgeClass(userRank)}`}>
              {getRankIcon(userRank)}
            </div>
            <span className={styles.userPositionPoints}>
              {leaderboard.find(p => p.user_id === user.id)?.total_points || 0} баллов
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
