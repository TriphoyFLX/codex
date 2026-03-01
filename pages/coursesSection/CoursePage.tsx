import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../../lib/apiClient';
import { useProfile } from '../../context/ProfileContext';
import { useCourseProgress } from '../../hooks/useCourseProgress';
import styles from './CoursePage.module.css';
import { 
  Clock, 
  Play, 
  Pause, 
  RotateCcw, 
  Trophy, 
  BookOpen, 
  ArrowLeft,
  Target,
  Award
} from 'lucide-react';

interface Course {
  id: string;
  name: string;
  description: string;
  image_url: string | null;
  duration: string | null;
  price: number | null;
  grades?: string | string[];
}

const CoursePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { profile } = useProfile();
  const navigate = useNavigate();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);

  // Используем хук для управления прогрессом
  const {
    progress,
    loading: progressLoading,
    error: progressError,
    isTimerActive,
    elapsedTime,
    formatTime,
    startTimer,
    pauseTimer,
    getRemainingTime,
    updateProgress
  } = useCourseProgress(
    id || '',
    course?.name || ''
  );

  // Вычисляем производные свойства
  const progressPercentage = progress ? progress.progress_percentage : 0;
  const remainingTime = getRemainingTime();
  const isCompleted = progress?.status === 'completed';

  // Загрузка информации о курсе
  useEffect(() => {
    const fetchCourse = async () => {
      if (!id) return;

      try {
        const response = await apiClient.get(`/courses/${id}`);
        const data = response.data;
        const error = response.data?.error;

        if (error) throw error;
        setCourse(data);

        // Проверяем, записан ли пользователь
        if (profile?.id) {
          const appResponse = await apiClient.get('/course_applications', {
            params: {
              course_id: id,
              user_id: profile.id
            }
          });
          const { data: application } = appResponse;

          setIsEnrolled(application?.status === 'approved');
        }
      } catch (err) {
        console.error('Error fetching course:', err);
        setError(err instanceof Error ? err.message : 'Ошибка загрузки курса');
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [id, profile]);

  // Управление таймером при фокусе/разфокусе страницы
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        pauseTimer();
      } else if (isEnrolled && !isCompleted) {
        startTimer();
      }
    };

    const handleBeforeUnload = () => {
      pauseTimer();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      pauseTimer();
    };
  }, [isEnrolled, isCompleted, pauseTimer, startTimer]);

  const handleEnroll = async () => {
    if (!profile?.id || !course) return;

    try {
      const response = await apiClient.post('/course_applications', {
        course_id: id,
        user_id: profile.id,
        status: 'pending'
      });
      const error = response.data?.error;

      if (error) throw error;
      
      alert('Заявка отправлена! Ожидайте подтверждения.');
    } catch (err) {
      console.error('Error enrolling:', err);
      alert('Ошибка при записи на курс');
    }
  };

  if (loading || progressLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>Загрузка курса...</p>
      </div>
    );
  }

  if (error || progressError) {
    return (
      <div className={styles.error}>
        <h2>Ошибка</h2>
        <p>{error || progressError}</p>
        <button onClick={() => navigate('/courses')}>
          <ArrowLeft size={16} />
          Вернуться к курсам
        </button>
      </div>
    );
  }

  if (!course) {
    return (
      <div className={styles.error}>
        <h2>Курс не найден</h2>
        <button onClick={() => navigate('/courses')}>
          <ArrowLeft size={16} />
          Вернуться к курсам
        </button>
      </div>
    );
  }

  return (
    <div className={styles.coursePage}>
      {/* Хедер курса */}
      <div className={styles.header}>
        <button 
          className={styles.backButton}
          onClick={() => navigate('/courses')}
        >
          <ArrowLeft size={20} />
          Вернуться
        </button>
        
        <div className={styles.courseInfo}>
          <h1 className={styles.title}>{course.name}</h1>
          <p className={styles.description}>{course.description}</p>
          
          {course.image_url && (
            <img 
              src={course.image_url} 
              alt={course.name}
              className={styles.courseImage}
            />
          )}
        </div>
      </div>

      {/* Панель прогресса и таймера */}
      {isEnrolled && (
        <div className={styles.progressPanel}>
          <div className={styles.progressHeader}>
            <div className={styles.progressInfo}>
              <div className={styles.progressCircle}>
                <svg width="120" height="120" className={styles.progressSvg}>
                  <circle
                    cx="60"
                    cy="60"
                    r="54"
                    stroke="#e8ebff"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="54"
                    stroke="url(#gradient)"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 54}`}
                    strokeDashoffset={`${2 * Math.PI * 54 * (1 - progressPercentage / 100)}`}
                    transform="rotate(-90 60 60)"
                    className={styles.progressCircleFill}
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#5d45fd" />
                      <stop offset="100%" stopColor="#7b5fff" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className={styles.progressText}>
                  <span className={styles.percentage}>{progressPercentage}%</span>
                  <span className={styles.label}>пройдено</span>
                </div>
              </div>
              
              <div className={styles.stats}>
                <div className={styles.statItem}>
                  <Clock size={16} />
                  <div>
                    <div className={styles.statLabel}>Время обучения</div>
                    <div className={styles.statValue}>{formatTime(elapsedTime)}</div>
                  </div>
                </div>
                
                <div className={styles.statItem}>
                  <Target size={16} />
                  <div>
                    <div className={styles.statLabel}>Осталось времени</div>
                    <div className={styles.statValue}>{formatTime(remainingTime)}</div>
                  </div>
                </div>
                
                {progress && progress.points_earned > 0 && (
                  <div className={styles.statItem}>
                    <Trophy size={16} />
                    <div>
                      <div className={styles.statLabel}>Начислено очков</div>
                      <div className={styles.statValue}>+{progress.points_earned}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Таймер и управление */}
            <div className={styles.timerSection}>
              <div className={styles.timerDisplay}>
                <div className={styles.currentTime}>{formatTime(elapsedTime)}</div>
                <div className={styles.totalTime}>из {formatTime(progress?.total_time || 0)}</div>
              </div>
              
              <div className={styles.timerControls}>
                {!isCompleted ? (
                  <>
                    {isTimerActive ? (
                      <button 
                        className={styles.pauseButton}
                        onClick={pauseTimer}
                      >
                        <Pause size={20} />
                        Пауза
                      </button>
                    ) : (
                      <button 
                        className={styles.playButton}
                        onClick={startTimer}
                      >
                        <Play size={20} />
                        {elapsedTime > 0 ? 'Продолжить' : 'Начать'}
                      </button>
                    )}
                    
                    <button 
                      className={styles.resetButton}
                      onClick={() => window.location.reload()}
                    >
                      <RotateCcw size={16} />
                      Сброс
                    </button>
                  </>
                ) : (
                  <div className={styles.completedSection}>
                    <Trophy size={24} />
                    <div>
                      <div className={styles.completedTitle}>Курс завершен!</div>
                      <div className={styles.completedSubtitle}>
                        Вы заработали {progress?.points_earned || 50} очков
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Прогресс бар */}
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Контент курса */}
      <div className={styles.content}>
        {!isEnrolled ? (
          <div className={styles.enrollSection}>
            <BookOpen size={48} className={styles.enrollIcon} />
            <h2>Начните обучение</h2>
            <p>Запишитесь на курс, чтобы получить доступ к материалам и начать отслеживать прогресс</p>
            
            <div className={styles.courseMeta}>
              {course.duration && (
                <div className={styles.metaItem}>
                  <Clock size={16} />
                  {course.duration}
                </div>
              )}
              {course.price && (
                <div className={styles.metaItem}>
                  <Award size={16} />
                  {course.price} ₽
                </div>
              )}
            </div>
            
            <button 
              className={styles.enrollButton}
              onClick={handleEnroll}
            >
              Записаться на курс
            </button>
          </div>
        ) : (
          <div className={styles.learningSection}>
            <h2>Материалы курса</h2>
            <p className={styles.placeholder}>
              Здесь будут размещены учебные материалы, видеоуроки и задания для курса "{course.name}".
            </p>
            
            {/* Заглушка для контента */}
            <div className={styles.contentPlaceholder}>
              <BookOpen size={64} />
              <h3>Контент в разработке</h3>
              <p>Материалы курса будут доступны в ближайшее время</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoursePage;
