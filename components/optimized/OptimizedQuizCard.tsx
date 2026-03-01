import React, { memo } from 'react';
import { Clock, Trophy, Play, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { Quiz } from '../../types/quiz.types';
import { DIFFICULTY_LEVELS } from '../../constants/quiz.constants';
import styles from '../../pages/practice/BusinessGame.module.css';

interface QuizCardProps {
  quiz: Quiz;
  mode: 'student' | 'teacher';
  onStart?: () => void;
  onEdit?: () => void;
  onPublish?: () => void;
  onDelete?: () => void;
  isLoading?: boolean;
}

export const OptimizedQuizCard: React.FC<QuizCardProps> = memo(({
  quiz,
  mode,
  onStart,
  onEdit,
  onPublish,
  onDelete,
  isLoading = false
}) => {
  const getDifficultyInfo = React.useMemo(() => {
    const difficulty = DIFFICULTY_LEVELS.find(d => d.id === quiz.difficulty_level);
    const className = quiz.difficulty_level === 1 ? styles.tagSuccess :
                     quiz.difficulty_level === 2 ? styles.tagWarning :
                     quiz.difficulty_level === 3 ? styles.tagDanger : styles.tagDanger;
    
    return { name: difficulty?.name || 'Неизвестно', className };
  }, [quiz.difficulty_level]);

  const quizStats = React.useMemo(() => {
    const totalPoints = quiz.questions?.reduce((sum, q) => sum + (q.points || 0), 0) || 0;
    const questionCount = quiz.questions?.length || 0;
    return { totalPoints, questionCount, hasQuestions: questionCount > 0 };
  }, [quiz.questions]);

  if (mode === 'student') {
    return (
      <div className={`${styles.card} ${styles.quizCard}`}>
        <div className={styles.mb4}>
          <div className={styles.flexBetween} style={{ marginBottom: '0.5rem' }}>
            <h4 className={styles.cardTitle}>{quiz.title}</h4>
            <span className={`${styles.tag} ${getDifficultyInfo.className}`}>
              {getDifficultyInfo.name}
            </span>
          </div>
          
          <p className={styles.cardDescription}>{quiz.description}</p>
          
          <div className={styles.tagContainer}>
            <span className={`${styles.tag} ${styles.tagPrimary}`}>
              {quiz.subject}
            </span>
            <span className={`${styles.tag} ${styles.tagPurple}`}>
              {quizStats.questionCount} вопросов
            </span>
            {quizStats.totalPoints > 0 && (
              <span className={`${styles.tag} ${styles.tagYellow}`}>
                {quizStats.totalPoints} очков
              </span>
            )}
          </div>
          
          <div className={styles.quizStats}>
            <div className={styles.statItem}>
              <Clock size={16} />
              <span>{quiz.time_limit} минут</span>
            </div>
            <div className={styles.statItem}>
              <Trophy size={16} />
              <span>До {quizStats.totalPoints} очков</span>
            </div>
          </div>
        </div>
        
        <button
          onClick={onStart}
          disabled={!quizStats.hasQuestions || isLoading}
          className={`${styles.button} ${styles.buttonPrimary} ${styles.buttonFullWidth}`}
          style={{ 
            padding: '1rem',
            fontSize: '1rem',
            fontWeight: '600'
          }}
        >
          {quizStats.hasQuestions ? (
            <>
              <Play size={20} />
              Начать тест
            </>
          ) : (
            'Тест пока недоступен'
          )}
        </button>
        
        {!quizStats.hasQuestions && (
          <p className={styles.emptySubtext} style={{ textAlign: 'center', marginTop: '0.5rem' }}>
            В тесте пока нет вопросов
          </p>
        )}
      </div>
    );
  }

  // Teacher mode
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div>
          <div className={styles.flexBetween} style={{ marginBottom: '0.5rem' }}>
            <h4 className={styles.cardTitle}>{quiz.title}</h4>
            {quiz.is_published ? (
              <span className={`${styles.tag} ${styles.tagSuccess}`}>
                <Eye size={14} />
                Опубликован
              </span>
            ) : (
              <span className={`${styles.tag} ${styles.tagGray}`}>
                <EyeOff size={14} />
                Черновик
              </span>
            )}
          </div>
          
          <p className={styles.cardDescription}>{quiz.description}</p>
          
          <div className={styles.tagContainer}>
            <span className={`${styles.tag} ${styles.tagPrimary}`}>
              {quiz.subject}
            </span>
            <span className={`${styles.tag} ${getDifficultyInfo.className}`}>
              {getDifficultyInfo.name}
            </span>
            <span className={`${styles.tag} ${styles.tagPurple}`}>
              {quizStats.questionCount} вопросов
            </span>
            <span className={`${styles.tag} ${styles.tagGray}`}>
              {quiz.time_limit} мин
            </span>
            {quizStats.totalPoints > 0 && (
              <span className={`${styles.tag} ${styles.tagYellow}`}>
                {quizStats.totalPoints} очков
              </span>
            )}
          </div>
        </div>
      </div>
      
      <div className={styles.cardFooter}>
        <div className={styles.flex} style={{ gap: '0.5rem' }}>
          <button
            onClick={onEdit}
            disabled={isLoading}
            className={`${styles.button} ${styles.buttonSecondary}`}
            title="Редактировать тест"
          >
            <Edit size={16} />
            Редактировать
          </button>
          
          {!quiz.is_published && (
            <button
              onClick={onPublish}
              disabled={isLoading || !quizStats.hasQuestions}
              className={`${styles.button} ${styles.buttonSuccess}`}
              title="Опубликовать тест"
            >
              <Eye size={16} />
              Опубликовать
            </button>
          )}
          
          <button
            onClick={onDelete}
            disabled={isLoading}
            className={`${styles.button} ${styles.buttonDanger}`}
            title="Удалить тест"
          >
            <Trash2 size={16} />
          </button>
        </div>
        
        <div className={styles.emptySubtext}>
          Создан: {new Date(quiz.created_at).toLocaleDateString('ru-RU')}
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Оптимизированное сравнение для предотвращения лишних рендеров
  return (
    prevProps.quiz.id === nextProps.quiz.id &&
    prevProps.quiz.title === nextProps.quiz.title &&
    prevProps.quiz.is_published === nextProps.quiz.is_published &&
    prevProps.quiz.questions?.length === nextProps.quiz.questions?.length &&
    prevProps.isLoading === nextProps.isLoading
  );
});