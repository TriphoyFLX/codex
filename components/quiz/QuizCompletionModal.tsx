import React from 'react';
import { X, Trophy, Clock, BookOpen, CheckCircle, XCircle, AlertCircle, Target, TrendingUp } from 'lucide-react';
import styles from './QuizCompletionModal.module.css';

interface QuizCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  results: {
    correctAnswers: number;
    totalPoints: number;
    maxPoints: number;
    percentage: number;
    timeSpent?: number;
    quizTitle?: string;
    quizSubject?: string;
    totalQuestions?: number;
  };
}

export const QuizCompletionModal: React.FC<QuizCompletionModalProps> = ({
  isOpen,
  onClose,
  results
}) => {
  if (!isOpen) return null;

  const {
    correctAnswers,
    totalPoints,
    maxPoints,
    percentage,
    timeSpent = 0,
    quizTitle = 'Тест завершен',
    quizSubject = '',
    totalQuestions = 0
  } = results;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getGrade = (percentage: number) => {
    if (percentage >= 90) return { grade: 'A', color: '#059669', text: 'Отлично!', icon: '🏆' };
    if (percentage >= 80) return { grade: 'B', color: '#0891b2', text: 'Хорошо!', icon: '🌟' };
    if (percentage >= 70) return { grade: 'C', color: '#d97706', text: 'Неплохо', icon: '👍' };
    if (percentage >= 60) return { grade: 'D', color: '#ea580c', text: 'Удовлетворительно', icon: '📚' };
    return { grade: 'F', color: '#dc2626', text: 'Нужно улучшить', icon: '💪' };
  };

  const grade = getGrade(percentage);

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>Тест завершен!</h2>
          <button onClick={onClose} className={styles.closeButton}>
            <X size={24} />
          </button>
        </div>

        <div className={styles.content}>
          {/* Основная статистика */}
          <div className={styles.mainStats}>
            <div className={styles.scoreCircle}>
              <div className={styles.percentage}>{percentage}%</div>
              <div className={styles.grade} style={{ color: grade.color }}>
                {grade.grade}
              </div>
              <div className={styles.icon}>{grade.icon}</div>
            </div>
            
            <div className={styles.scoreInfo}>
              <h3 className={styles.quizTitle}>{quizTitle}</h3>
              {quizSubject && (
                <div className={styles.subject}>
                  <BookOpen size={16} />
                  <span>{quizSubject}</span>
                </div>
              )}
              <p className={styles.message}>{grade.text}</p>
            </div>
          </div>

          {/* Детальная статистика */}
          <div className={styles.detailedStats}>
            <div className={styles.statGrid}>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>
                  <CheckCircle size={24} color="#059669" />
                </div>
                <div className={styles.statInfo}>
                  <div className={styles.statValue}>{correctAnswers}</div>
                  <div className={styles.statLabel}>Правильных ответов</div>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIcon}>
                  <Target size={24} color="#3b82f6" />
                </div>
                <div className={styles.statInfo}>
                  <div className={styles.statValue}>{totalQuestions}</div>
                  <div className={styles.statLabel}>Всего вопросов</div>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIcon}>
                  <Trophy size={24} color="#f59e0b" />
                </div>
                <div className={styles.statInfo}>
                  <div className={styles.statValue}>{totalPoints}</div>
                  <div className={styles.statLabel}>Набрано баллов</div>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIcon}>
                  <TrendingUp size={24} color="#8b5cf6" />
                </div>
                <div className={styles.statInfo}>
                  <div className={styles.statValue}>{maxPoints}</div>
                  <div className={styles.statLabel}>Максимум баллов</div>
                </div>
              </div>

              {timeSpent > 0 && (
                <div className={styles.statCard}>
                  <div className={styles.statIcon}>
                    <Clock size={24} color="#6b7280" />
                  </div>
                  <div className={styles.statInfo}>
                    <div className={styles.statValue}>{formatTime(timeSpent)}</div>
                    <div className={styles.statLabel}>Время прохождения</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Прогресс-бар */}
          <div className={styles.progressSection}>
            <div className={styles.progressHeader}>
              <span className={styles.progressLabel}>Процент выполнения</span>
              <span className={styles.progressValue}>{percentage}%</span>
            </div>
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill}
                style={{ 
                  width: `${percentage}%`,
                  backgroundColor: grade.color 
                }}
              />
            </div>
          </div>

          {/* Рекомендации */}
          <div className={styles.recommendations}>
            <h4 className={styles.recommendationsTitle}>Рекомендации</h4>
            <div className={styles.recommendationsList}>
              {percentage >= 90 && (
                <div className={styles.recommendationItem}>
                  <CheckCircle size={16} color="#059669" />
                  <span>Отличная работа! Вы готовы к более сложным тестам.</span>
                </div>
              )}
              {percentage >= 70 && percentage < 90 && (
                <div className={styles.recommendationItem}>
                  <AlertCircle size={16} color="#d97706" />
                  <span>Хороший результат! Попробуйте повторить тест для закрепления.</span>
                </div>
              )}
              {percentage >= 50 && percentage < 70 && (
                <div className={styles.recommendationItem}>
                  <AlertCircle size={16} color="#ea580c" />
                  <span>Рекомендуется повторить материал и пройти тест снова.</span>
                </div>
              )}
              {percentage < 50 && (
                <div className={styles.recommendationItem}>
                  <XCircle size={16} color="#dc2626" />
                  <span>Необходимо изучить материал более тщательно перед повторной попыткой.</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <button onClick={onClose} className={styles.closeButton}>
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
