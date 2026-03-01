import React, { useState, useEffect } from 'react';
import { X, Users, Clock, Trophy } from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import styles from './QuizResultsModal.module.css';

interface QuizResultsModalProps {
  quiz: {
    id: string;
    title: string;
    description: string;
    subject: string;
    difficulty_level: number;
    total_points?: number;
  };
  onClose: () => void;
}

interface QuizResult {
  id: string;
  student_name: string;
  student_email: string;
  score: number;
  max_score: number;
  completed_at: string;
  time_spent: number;
}

const QuizResultsModal: React.FC<QuizResultsModalProps> = ({ quiz, onClose }) => {
  const [results, setResults] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadResults();
  }, [quiz.id]);

  const loadResults = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data } = await apiClient.get(`/quiz-results/${quiz.id}`);
      setResults(data || []);
    } catch (error) {
      console.error('Error loading quiz results:', error);
      setError('Не удалось загрузить результаты');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 90) return styles.excellent;
    if (percentage >= 75) return styles.good;
    if (percentage >= 60) return styles.average;
    return styles.poor;
  };

  const averageScore = results.length > 0 
    ? Math.round(results.reduce((sum, result) => sum + (result.score / result.max_score * 100), 0) / results.length)
    : 0;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.headerInfo}>
            <h2 className={styles.modalTitle}>Результаты теста</h2>
            <h3 className={styles.quizName}>{quiz.title}</h3>
            <div className={styles.quizMeta}>
              <span className={styles.subject}>{quiz.subject}</span>
              <span className={styles.difficulty}>
                {quiz.difficulty_level === 1 ? 'Легкий' :
                 quiz.difficulty_level === 2 ? 'Средний' :
                 quiz.difficulty_level === 3 ? 'Сложный' : 'Эксперт'}
              </span>
              <span className={styles.points}>{quiz.total_points || 'N/A'} баллов</span>
            </div>
          </div>
          <button onClick={onClose} className={styles.modalClose}>
            <X size={20} />
          </button>
        </div>
        
        <div className={styles.modalBody}>
          {loading ? (
            <div className={styles.loadingState}>
              <div className={styles.spinner}></div>
              <p>Загрузка результатов...</p>
            </div>
          ) : error ? (
            <div className={styles.errorState}>
              <p>{error}</p>
              <button onClick={loadResults} className={styles.retryButton}>
                Попробовать снова
              </button>
            </div>
          ) : results.length === 0 ? (
            <div className={styles.emptyState}>
              <Users size={48} className={styles.emptyIcon} />
              <h3>Пока никто не прошел этот тест</h3>
              <p>Результаты появятся здесь, как только ученики начнут проходить тест</p>
            </div>
          ) : (
            <>
              <div className={styles.statsOverview}>
                <div className={styles.statCard}>
                  <div className={styles.statIcon}>
                    <Users size={20} />
                  </div>
                  <div className={styles.statInfo}>
                    <div className={styles.statValue}>{results.length}</div>
                    <div className={styles.statLabel}>Участников</div>
                  </div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statIcon}>
                    <Trophy size={20} />
                  </div>
                  <div className={styles.statInfo}>
                    <div className={styles.statValue}>{averageScore}%</div>
                    <div className={styles.statLabel}>Средний балл</div>
                  </div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statIcon}>
                    <Clock size={20} />
                  </div>
                  <div className={styles.statInfo}>
                    <div className={styles.statValue}>
                      {results.length > 0 
                        ? formatTime(Math.round(results.reduce((sum, r) => sum + r.time_spent, 0) / results.length))
                        : '0:00'
                      }
                    </div>
                    <div className={styles.statLabel}>Среднее время</div>
                  </div>
                </div>
              </div>

              <div className={styles.resultsList}>
                <div className={styles.resultsHeader}>
                  <div className={styles.headerStudent}>Ученик</div>
                  <div className={styles.headerScore}>Результат</div>
                  <div className={styles.headerTime}>Время</div>
                  <div className={styles.headerDate}>Дата</div>
                </div>
                {results.map((result) => {
                  const percentage = Math.round((result.score / result.max_score) * 100);
                  return (
                    <div key={result.id} className={styles.resultItem}>
                      <div className={styles.resultStudent}>
                        <div className={styles.studentInfo}>
                          <span className={styles.studentName}>{result.student_name}</span>
                          <span className={styles.studentEmail}>{result.student_email}</span>
                        </div>
                      </div>
                      <div className={styles.resultScore}>
                        <div className={styles.scoreInfo}>
                          <span className={`${styles.scoreValue} ${getScoreColor(percentage)}`}>
                            {result.score}/{result.max_score}
                          </span>
                          <span className={`${styles.scorePercentage} ${getScoreColor(percentage)}`}>
                            {percentage}%
                          </span>
                        </div>
                      </div>
                      <div className={styles.resultTime}>
                        <span className={styles.timeValue}>{formatTime(result.time_spent)}</span>
                      </div>
                      <div className={styles.resultDate}>
                        <span className={styles.dateValue}>{formatDate(result.completed_at)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export { QuizResultsModal };
