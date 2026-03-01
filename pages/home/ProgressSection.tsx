import { useState, useEffect } from 'react';
import { useProfile } from '../../context/ProfileContext';
import { useFollowSystem } from '../../hooks/useFollowSystem';
import { apiClient } from '../../lib/apiClient';
import styles from './Home.module.css';

interface CourseProgress {
  id: string;
  name: string;
  progress: number;
  total_lessons: number;
  completed_lessons: number;
}

interface TestStats {
  total_tests: number;
  completed_tests: number;
  average_score: number;
  best_score: number;
}

export default function ProgressSection() {
  const { profile } = useProfile();
  const { followStats } = useFollowSystem(profile?.id, profile?.id);
  const [courseProgress, setCourseProgress] = useState<CourseProgress[]>([]);
  const [testStats, setTestStats] = useState<TestStats>({
    total_tests: 0,
    completed_tests: 0,
    average_score: 0,
    best_score: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.id) {
      fetchProgressData();
    }
  }, [profile]);

  const fetchProgressData = async () => {
    try {
      setLoading(true);
      
      // Fetch course progress
      const coursesResponse = await apiClient.get('/progress/courses', {
        params: { user_id: profile?.id }
      });
      
      // Fetch test statistics
      const testsResponse = await apiClient.get('/progress/tests', {
        params: { user_id: profile?.id }
      });
      
      setCourseProgress(coursesResponse.data || []);
      setTestStats(testsResponse.data || {
        total_tests: 0,
        completed_tests: 0,
        average_score: 0,
        best_score: 0
      });
    } catch (error) {
      console.error('Error fetching progress data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProgressPercentage = (completed: number, total: number) => {
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const getFollowersGrowth = () => {
    // Показываем общее количество подписчиков
    return followStats.followers_count;
  };

  const getFollowersGoal = () => {
    // Mock: цель 100 подписчиков
    return 100;
  };

  const getFollowersProgress = () => {
    return Math.min(100, Math.round((followStats.followers_count / getFollowersGoal()) * 100));
  };

  if (loading) {
    return (
      <section className={styles.progressSection}>
        <h2 className={styles.sectionTitle}>Ваш прогресс</h2>
        <div className={styles.progressGrid}>
          {[1, 2, 3].map(i => (
            <div key={i} className={styles.progressCard}>
              <div className={styles.skeletonLoader}></div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className={styles.progressSection}>
      <h2 className={styles.sectionTitle}>Ваш прогресс</h2>
      <div className={styles.progressGrid}>

        {/* Подписчики */}
        <div className={styles.progressCard}>
          <div className={styles.cardMeta}>
            <span className={styles.metaBadge}>Сообщество</span>
          </div>
          <h3 className={styles.cardTitle}>{getFollowersGrowth()} подписчиков</h3>
          <p className={styles.cardSubtitle}>Всего</p>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill} 
              style={{ width: `${getFollowersProgress()}%` }}
            ></div>
          </div>
          <div className={styles.cardFooter}>
            Цель: {getFollowersGoal()} подписчиков
          </div>
        </div>

        {/* Лучший курс */}
        {courseProgress.length > 0 && (
          <div className={styles.progressCard}>
            <div className={styles.cardMeta}>
              <span className={styles.metaBadge}>Курс</span>
            </div>
            <h3 className={styles.cardTitle}>{courseProgress[0].name}</h3>
            <p className={styles.cardSubtitle}>
              Вы прошли {courseProgress[0].progress}%
            </p>
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill} 
                style={{ width: `${courseProgress[0].progress}%` }}
              ></div>
            </div>
            <div className={styles.cardFooter}>
              Осталось {courseProgress[0].total_lessons - courseProgress[0].completed_lessons} уроков
            </div>
          </div>
        )}

        {/* Статистика тестов */}
        <div className={styles.progressCard}>
          <div className={styles.cardMeta}>
            <span className={styles.metaBadge}>Олимпиада</span>
          </div>
          <h3 className={styles.cardTitle}>Результаты тестов</h3>
          <p className={styles.cardSubtitle}>
            Средний балл: {(() => {
              const avg = Number(testStats.average_score);
              return Number.isFinite(avg) ? avg.toFixed(1) : '0';
            })()}
          </p>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill} 
              style={{ width: `${getProgressPercentage(testStats.completed_tests, testStats.total_tests)}%` }}
            ></div>
          </div>
          <div className={styles.cardFooter}>
            Лучший результат: {testStats.best_score || 0} баллов
          </div>
        </div>

      </div>
    </section>
  );
}