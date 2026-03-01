import React, { useState, useEffect } from 'react';
import { Search, Clock, Star, BookOpen, Play, Trophy, Users, LogIn } from 'lucide-react';
import { Quiz } from '../../types/quiz.types';
import { useQuizApi } from '../../hooks/useQuizApi';
import { useQuizStore } from '../../hooks/useQuizStore';
import { useProfile } from '../../context/ProfileContext';
import { useAuth } from '../../hooks/useAuth';
import { apiClient } from '../../lib/apiClient';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { QuizPlayer } from '../../components/quiz/QuizPlayer';
import { Leaderboard } from '../../components/leaderboard/Leaderboard';
import styles from './StudentTests.module.css';

const StudentTests: React.FC = () => {
  const { profile } = useProfile();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { loadQuizzes } = useQuizApi();
  const { availableQuizzes, startQuiz, quizInProgress, currentQuiz, loading: storeLoading } = useQuizStore();
  
  // Определяем роль пользователя
  const userRole = profile?.role || 'student';
  
  console.log('StudentTests: State:', {
    user,
    userRole,
    isAuthenticated,
    authLoading,
    profile,
    availableQuizzes: availableQuizzes.length,
    availableQuizzesData: availableQuizzes
  });
  
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'tests' | 'completed' | 'leaderboard'>('tests');
  const [completedQuizIds, setCompletedQuizIds] = useState<Set<string>>(new Set());
  const [completedStats, setCompletedStats] = useState<{ completedCount: number; totalScore: number }>({
    completedCount: 0,
    totalScore: 0
  });

  useEffect(() => {
    if (!authLoading) {
      loadTests();
    }
  }, [isAuthenticated, user, authLoading]);

  const loadTests = async () => {
    if (!isAuthenticated) {
      console.log('StudentTests: User not authenticated');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      console.log('StudentTests: Loading tests...');
      console.log('StudentTests: User:', profile);
      await loadQuizzes();
      const quizzesAfterLoad = useQuizStore.getState().availableQuizzes;
      console.log('StudentTests: Available quizzes after load:', quizzesAfterLoad);

      if (user?.id) {
        try {
          const res = await apiClient.get('/quiz-results', {
            params: {
              student_id: user.id
            }
          });

          const rows = Array.isArray(res.data) ? res.data : [];
          const ids = new Set<string>(rows.map((r: any) => String(r.quiz_id)).filter(Boolean));
          setCompletedQuizIds(ids);

          const totalScore = rows.reduce((sum: number, r: any) => sum + (Number(r.score) || 0), 0);
          setCompletedStats({ completedCount: ids.size, totalScore });
        } catch (e) {
          try {
            const saved = localStorage.getItem(`codex_user_results_${user.id}`);
            const results = saved ? JSON.parse(saved) : [];
            const ids = new Set<string>(Array.isArray(results) ? results.map((r: any) => String(r.quiz_id)).filter(Boolean) : []);
            setCompletedQuizIds(ids);

            const totalScore = Array.isArray(results)
              ? results.reduce((sum: number, r: any) => sum + (Number(r.score) || 0), 0)
              : 0;
            setCompletedStats({ completedCount: ids.size, totalScore });
          } catch {
            setCompletedQuizIds(new Set());
            setCompletedStats({ completedCount: 0, totalScore: 0 });
          }
        }
      }
      
      // Добавляем тестовый тест, если нет реальных тестов
      if (quizzesAfterLoad.length === 0) {
        console.log('StudentTests: No quizzes found, adding test quiz');
        const testQuiz = {
          id: 'test-quiz-demo',
          title: 'Демо тест для лидерборда',
          description: 'Пройдите этот тест чтобы проверить работу лидерборда',
          subject: 'Математика',
          difficulty_level: 1,
          time_limit: 5,
          created_by: 'system',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_published: true,
          questions: [
            {
              id: 'q1',
              question_text: 'Сколько будет 2 + 2?',
              type: 'multiple_choice' as const,
              difficulty: 1,
              options: ['3', '4', '5', '6'],
              correct_answer: 1,
              points: 10
            },
            {
              id: 'q2',
              question_text: 'Сколько будет 5 + 3?',
              type: 'multiple_choice' as const,
              difficulty: 1,
              options: ['7', '8', '9', '10'],
              correct_answer: 1,
              points: 10
            }
          ]
        };
        
        // Временно добавляем тест в store
        useQuizStore.getState().setAvailableQuizzes([testQuiz]);
        console.log('StudentTests: Test quiz added:', testQuiz);
      }
    } catch (error) {
      console.error('Error loading tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuizComplete = () => {
    console.log('Quiz completed, reloading tests...');
    loadTests(); // Обновить список тестов после завершения
  };

  const handleStartQuiz = (quiz: Quiz) => {
    console.log('Starting quiz:', quiz.title);
    startQuiz(quiz); // Используем startQuiz из useQuizStore для начала теста
  };

  const completedQuizzes = availableQuizzes.filter(quiz => completedQuizIds.has(String(quiz.id)));
  const activeQuizzes = availableQuizzes.filter(quiz => !completedQuizIds.has(String(quiz.id)));
  const quizzesForTab = activeTab === 'completed' ? completedQuizzes : activeQuizzes;

  // Фильтрация тестов
  const filteredQuizzes = quizzesForTab.filter(quiz => {
    const matchesSearch = quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         quiz.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         quiz.subject.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSubject = filterSubject === 'all' || quiz.subject === filterSubject;
    const matchesDifficulty = filterDifficulty === 'all' || quiz.difficulty_level === Number(filterDifficulty);
    
    return matchesSearch && matchesSubject && matchesDifficulty;
  });

  const getDifficultyColor = (level: number) => {
    switch (level) {
      case 1: return styles.difficultyEasy;
      case 2: return styles.difficultyMedium;
      case 3: return styles.difficultyHard;
      case 4: return styles.difficultyExpert;
      default: return styles.difficultyEasy;
    }
  };

  const getDifficultyText = (level: number) => {
    switch (level) {
      case 1: return 'Легкий';
      case 2: return 'Средний';
      case 3: return 'Сложный';
      case 4: return 'Эксперт';
      default: return 'Легкий';
    }
  };

  const getSubjects = () => {
    const subjects = [...new Set(quizzesForTab.map(quiz => quiz.subject))];
    return subjects;
  };

  if (loading || authLoading || storeLoading) {
    return <LoadingSpinner text="Загрузка тестов..." />;
  }

  // Отладочная информация
  console.log('StudentTests render:', {
    isAuthenticated,
    availableQuizzes: availableQuizzes.length,
    filteredQuizzes: filteredQuizzes.length
  });

  // Если пользователь не авторизован, показываем предложение войти
  if (!isAuthenticated) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <BookOpen size={48} className={styles.emptyIcon} />
          <h3 className={styles.emptyTitle}>Требуется авторизация</h3>
          <p className={styles.emptyText}>
            Для доступа к тестам необходимо войти в систему
          </p>
          <button
            onClick={() => window.location.href = '/auth'}
            className={`${styles.button} ${styles.buttonPrimary}`}
          >
            <LogIn size={20} />
            Войти в систему
          </button>
        </div>
      </div>
    );
  }

  // Если тест в процессе, показываем QuizPlayer
  if (quizInProgress && currentQuiz && currentQuiz.questions) {
    return <QuizPlayer quiz={currentQuiz} onComplete={handleQuizComplete} />;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Тесты</h1>
          <p className={styles.subtitle}>
            {userRole === 'teacher' 
              ? 'Просмотр и прохождение доступных тестов' 
              : 'Пройдите тесты для проверки знаний'
            }
          </p>
        </div>
        <div className={styles.headerActions}>
          {userRole === 'teacher' && (
            <button
              onClick={() => window.location.href = '/tests/manage'}
              className={`${styles.button} ${styles.buttonSecondary}`}
            >
              Управление тестами
            </button>
          )}
          <div className={styles.stats}>
            <div className={styles.statItem}>
              <Trophy size={20} className={styles.statIcon} />
              <div className={styles.statInfo}>
                <div className={styles.statValue}>{completedStats.completedCount}</div>
                <div className={styles.statLabel}>Пройдено</div>
              </div>
            </div>
            <div className={styles.statItem}>
              <Star size={20} className={styles.statIcon} />
              <div className={styles.statInfo}>
                <div className={styles.statValue}>{completedStats.totalScore}</div>
                <div className={styles.statLabel}>Очков</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Вкладки */}
      <div className={styles.tabs}>
        <button
          onClick={() => setActiveTab('tests')}
          className={`${styles.tab} ${activeTab === 'tests' ? styles.activeTab : ''}`}
        >
          <BookOpen size={18} />
          Тесты
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`${styles.tab} ${activeTab === 'completed' ? styles.activeTab : ''}`}
        >
          <Trophy size={18} />
          Пройденные
        </button>
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`${styles.tab} ${activeTab === 'leaderboard' ? styles.activeTab : ''}`}
        >
          <Trophy size={18} />
          Лидерборд
        </button>
      </div>

      {/* Контент вкладок */}
      {activeTab === 'leaderboard' ? (
        <Leaderboard />
      ) : (
        <>
          {/* Фильтры и поиск */}
          <div className={styles.filters}>
            <div className={styles.searchContainer}>
              <Search size={20} className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Поиск по названию, описанию или предмету..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
            </div>
            
            <div className={styles.filterButtons}>
              <select
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="all">Все предметы</option>
                {getSubjects().map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
              
              <select
                value={filterDifficulty}
                onChange={(e) => setFilterDifficulty(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="all">Все сложности</option>
                <option value="1">Легкий</option>
                <option value="2">Средний</option>
                <option value="3">Сложный</option>
                <option value="4">Эксперт</option>
              </select>
            </div>
          </div>

          {/* Список тестов */}
          <div className={styles.quizzesGrid}>
            {filteredQuizzes.length === 0 ? (
              <div className={styles.emptyState}>
                <BookOpen size={48} className={styles.emptyIcon} />
                <h3 className={styles.emptyTitle}>Тесты не найдены</h3>
                <p className={styles.emptyText}>
                  {searchTerm || filterSubject !== 'all' || filterDifficulty !== 'all' 
                    ? 'Попробуйте изменить параметры поиска или фильтры'
                    : activeTab === 'completed'
                      ? 'Вы еще не проходили тесты'
                      : userRole === 'teacher'
                        ? 'Пока нет опубликованных тестов. Создайте свой первый тест!'
                        : 'Пока нет доступных тестов'
                  }
                </p>
                {userRole === 'teacher' && !searchTerm && filterSubject === 'all' && filterDifficulty === 'all' && (
                  <button
                    onClick={() => window.location.href = '/tests/manage'}
                    className={`${styles.button} ${styles.buttonPrimary}`}
                  >
                    Создать первый тест
                  </button>
                )}
              </div>
            ) : (
              filteredQuizzes.map((quiz) => (
                (() => {
                  const isCompleted = completedQuizIds.has(String(quiz.id));
                  return (
                <div key={quiz.id} className={styles.quizCard}>
                  <div className={styles.quizHeader}>
                    <div className={styles.quizInfo}>
                      <h3 className={styles.quizTitle}>{quiz.title}</h3>
                      <p className={styles.quizDescription}>{quiz.description}</p>
                    </div>
                    <div className={styles.quizDifficulty}>
                      <span className={`${styles.difficultyBadge} ${getDifficultyColor(quiz.difficulty_level)}`}>
                        {getDifficultyText(quiz.difficulty_level)}
                      </span>
                      {isCompleted && (
                        <span className={styles.completedBadge}>Пройден</span>
                      )}
                    </div>
                  </div>

                  <div className={styles.quizMeta}>
                    <div className={styles.metaItem}>
                      <BookOpen size={16} />
                      <span>{quiz.subject}</span>
                    </div>
                    <div className={styles.metaItem}>
                      <Clock size={16} />
                      <span>{quiz.time_limit} мин</span>
                    </div>
                    <div className={styles.metaItem}>
                      <Users size={16} />
                      <span>{quiz.questions?.length || 0} вопросов</span>
                    </div>
                    <div className={styles.metaItem}>
                      <Star size={16} />
                      <span>{quiz.difficulty_level * 10} очков</span>
                    </div>
                  </div>

                  <div className={styles.quizFooter}>
                    <button
                      onClick={() => handleStartQuiz(quiz)}
                      className={`${styles.button} ${styles.buttonPrimary}`}
                    >
                      <Play size={16} />
                      {isCompleted ? 'Пройти снова' : 'Начать тест'}
                    </button>
                  </div>
                </div>
                  );
                })()
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default StudentTests;