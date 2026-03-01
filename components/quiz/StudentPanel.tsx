import React, { useEffect } from 'react';
import { Clock, Trophy, Play } from 'lucide-react';
import { useQuizStore } from '../../hooks/useQuizStore';
import { useQuizApi } from '../../hooks/useQuizApi';
import { Quiz } from '../../types/quiz.types';
import { DIFFICULTY_LEVELS } from '../../constants/quiz.constants';
import { LoadingOverlay } from '../common/LoadingSpinner';
import styles from '../../pages/practice/BusinessGame.module.css';

export const StudentPanel: React.FC = () => {
  const {
    availableQuizzes,
    loading,
    startQuiz
  } = useQuizStore();

  const { loadQuizzes } = useQuizApi();

  useEffect(() => {
    loadQuizzes();
  }, [loadQuizzes]);

  const handleStartQuiz = (quiz: Quiz) => {
    if (quiz.questions && quiz.questions.length > 0) {
      startQuiz(quiz);
    }
  };

  if (loading) {
    return <LoadingOverlay text="Загрузка тестов..." />;
  }

  return (
    <div className={styles.mb8}>
      <h2 className={styles.cardTitle} style={{ marginBottom: '1.5rem' }}>
        Доступные тесты
      </h2>
      
      {availableQuizzes.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📚</div>
          <p className={styles.emptyText}>Пока нет доступных тестов</p>
          <p className={styles.emptySubtext}>
            Ожидайте, когда учитель опубликует новые тесты
          </p>
        </div>
      ) : (
        <>
          {/* Статистика */}
          <div className={styles.grid} style={{ 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '1rem',
            marginBottom: '2rem'
          }}>
            <div className={styles.statsCard}>
              <div className={styles.statsValue}>{availableQuizzes.length}</div>
              <div className={styles.statsLabel}>Доступных тестов</div>
            </div>
            <div className={styles.statsCard}>
              <div className={styles.statsValue}>
                {availableQuizzes.reduce((sum, quiz) => 
                  sum + (quiz.questions?.length || 0), 0
                )}
              </div>
              <div className={styles.statsLabel}>Всего вопросов</div>
            </div>
            <div className={styles.statsCard}>
              <div className={styles.statsValue}>
                {availableQuizzes.reduce((sum: number, quiz: Quiz) => 
                  sum + (quiz.questions?.reduce((qSum: number, q: any) => qSum + (q.points || 0), 0) || 0), 0
                )}
              </div>
              <div className={styles.statsLabel}>Возможных очков</div>
            </div>
          </div>

          {/* Список тестов */}
          <div className={styles.grid} style={{ 
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
            gap: '1.5rem' 
          }}>
            {availableQuizzes.map(quiz => (
              <QuizCard
                key={quiz.id}
                quiz={quiz}
                onStart={() => handleStartQuiz(quiz)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// Карточка теста для студента
interface QuizCardProps {
  quiz: Quiz;
  onStart: () => void;
}

const QuizCard: React.FC<QuizCardProps> = ({ quiz, onStart }) => {
  const getDifficultyInfo = (level: number) => {
    const difficulty = DIFFICULTY_LEVELS.find(d => d.id === level);
    const className = level === 1 ? styles.tagSuccess :
                     level === 2 ? styles.tagWarning :
                     level === 3 ? styles.tagDanger : styles.tagDanger;
    
    return { name: difficulty?.name || 'Неизвестно', className };
  };

  const difficultyInfo = getDifficultyInfo(quiz.difficulty_level);
  const totalPoints = quiz.questions?.reduce((sum: number, q: any) => sum + (q.points || 0), 0) || 0;
  const questionCount = quiz.questions?.length || 0;
  const hasQuestions = questionCount > 0;

  return (
    <div className={`${styles.card} ${styles.quizCard}`}>
      <div className={styles.mb4}>
        <div className={styles.flexBetween} style={{ marginBottom: '0.5rem' }}>
          <h4 className={styles.cardTitle}>{quiz.title}</h4>
          <span className={`${styles.tag} ${difficultyInfo.className}`}>
            {difficultyInfo.name}
          </span>
        </div>
        
        <p className={styles.cardDescription}>{quiz.description}</p>
        
        <div className={styles.tagContainer}>
          <span className={`${styles.tag} ${styles.tagPrimary}`}>
            {quiz.subject}
          </span>
          <span className={`${styles.tag} ${styles.tagPurple}`}>
            {questionCount} вопросов
          </span>
          {totalPoints > 0 && (
            <span className={`${styles.tag} ${styles.tagYellow}`}>
              {totalPoints} очков
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
            <span>До {totalPoints} очков</span>
          </div>
        </div>
      </div>
      
      <button
        onClick={onStart}
        disabled={!hasQuestions}
        className={`${styles.button} ${styles.buttonPrimary} ${styles.buttonFullWidth}`}
        style={{ 
          padding: '1rem',
          fontSize: '1rem',
          fontWeight: '600'
        }}
      >
        {hasQuestions ? (
          <>
            <Play size={20} />
            Начать тест
          </>
        ) : (
          'Тест пока недоступен'
        )}
      </button>
      
      {!hasQuestions && (
        <p className={styles.emptySubtext} style={{ textAlign: 'center', marginTop: '0.5rem' }}>
          В тесте пока нет вопросов
        </p>
      )}
    </div>
  );
};