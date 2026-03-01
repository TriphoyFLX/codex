import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Users, Clock, Star, BookOpen, Eye, EyeOff } from 'lucide-react';
import { Quiz } from '../../types/quiz.types';
import { useQuizApi } from '../../hooks/useQuizApi';
import { useQuizStore } from '../../hooks/useQuizStore';
import { useProfile } from '../../context/ProfileContext';
import { useAuth } from '../../hooks/useAuth'; // Добавляем импорт
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { QuizForm } from '../../components/quiz/forms/QuizForm';
import { apiClient } from '../../lib/apiClient';
import { QuizResultsModal } from '../../components/quiz/QuizResultsModal'; // Добавлен импорт
import styles from './TestsManagement.module.css';

const TestsManagement: React.FC = () => {
  const { profile } = useProfile();
  const { user } = useAuth(); // Добавляем user из useAuth
  const { loadQuizzes, deleteQuiz, publishQuiz, saveQuiz } = useQuizApi();
  const { quizzes, loading: storeLoading } = useQuizStore(); // Используем store напрямую
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft'>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);

  // Добавим отладочное состояние
  const [debugInfo, setDebugInfo] = useState('Initial state');

  useEffect(() => {
    console.log('TestsManagement: profile:', profile);
    console.log('TestsManagement: user:', user);
    console.log('TestsManagement: school_id:', profile?.school_id);
    console.log('TestsManagement: user id:', profile?.id);
    setDebugInfo(`Profile: ${profile?.id}, Role: ${profile?.role}, User: ${user?.id}`);
    loadQuizzesData();
  }, [profile?.id, user?.id]); // Добавляем user.id в зависимости

  useEffect(() => {
    console.log('TestsManagement: showCreateForm changed:', showCreateForm);
    setDebugInfo(prev => `${prev} | showCreateForm: ${showCreateForm}`);
  }, [showCreateForm]);

  // Отслеживаем изменения в quizzes
  useEffect(() => {
    console.log('TestsManagement: Quizzes updated:', quizzes.length);
    setDebugInfo(prev => `${prev} | Quizzes: ${quizzes.length}`);
  }, [quizzes]);

  const loadQuizzesData = async () => {
    if (!profile?.id || !user?.id) {
      console.log('TestsManagement: No profile or user id, skipping load', { profileId: profile?.id, userId: user?.id });
      return;
    }
    
    try {
      setLoading(true);
      console.log('TestsManagement: Loading quizzes for teacher:', profile.id);
      await loadQuizzes();
      // Даем время на обновление store
      setTimeout(() => {
        console.log('TestsManagement: Quizzes after load:', quizzes);
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('Error loading quizzes:', error);
    } finally {
      // setLoading(false); // Убираем отсюда, так как устанавливаем в setTimeout
    }
  };

  const handlePublishQuiz = async (quiz: Quiz) => {
    try {
      if (quiz.is_published) {
        // Снять с публикации
        await apiClient.put(`/quizzes/${quiz.id}`, { is_published: false });
      } else {
        // Опубликовать
        await publishQuiz(quiz.id);
      }
      // Обновляем список тестов
      setTimeout(() => {
        loadQuizzesData();
      }, 200);
    } catch (error) {
      console.error('Error toggling quiz publication:', error);
    }
  };

  const handleDeleteQuiz = async (quizId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот тест?')) return;
    
    try {
      await deleteQuiz(quizId);
      // Обновляем список тестов
      setTimeout(() => {
        loadQuizzesData();
      }, 200);
    } catch (error) {
      console.error('Error deleting quiz:', error);
    }
  };

  const handleEditQuiz = (quiz: Quiz) => {
    setEditingQuiz(quiz);
    setShowCreateForm(true);
  };

  const handleFormClose = () => {
    console.log('handleFormClose called');
    setShowCreateForm(false);
    setEditingQuiz(null);
    // Перезагружаем тесты с небольшой задержкой
    setTimeout(() => {
      loadQuizzesData();
    }, 100);
  };

  // Фильтрация тестов
  const filteredQuizzes = quizzes.filter(quiz => {
    const matchesSearch = quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         quiz.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         quiz.subject.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'published' && quiz.is_published) ||
                         (filterStatus === 'draft' && !quiz.is_published);
    
    return matchesSearch && matchesFilter;
  });

  console.log('TestsManagement: All quizzes:', quizzes);
  console.log('TestsManagement: Filtered quizzes:', filteredQuizzes);

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

  if (loading || storeLoading) {
    return <LoadingSpinner text="Загрузка тестов..." />;
  }

  // Проверка прав доступа
  if (!profile?.username) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <h2 className={styles.emptyTitle}>Требуется авторизация</h2>
          <p className={styles.emptyText}>
            Пожалуйста, войдите в систему для доступа к управлению тестами.
          </p>
          <button
            onClick={() => window.location.href = '/login'}
            className={`${styles.button} ${styles.buttonPrimary}`}
          >
            Войти
          </button>
        </div>
      </div>
    );
  }

  if (showCreateForm) {
    console.log('Rendering QuizForm, showCreateForm:', showCreateForm, 'editingQuiz:', editingQuiz);
    return (
      <div className={styles.container}>
        <QuizForm
          initialData={editingQuiz ? {
            title: editingQuiz.title,
            description: editingQuiz.description,
            subject: editingQuiz.subject,
            difficulty_level: editingQuiz.difficulty_level,
            time_limit: editingQuiz.time_limit
          } : undefined}
          initialQuestions={editingQuiz?.questions || []}
          onSubmit={async (data, questions) => {
            console.log('Saving quiz:', data);
            console.log('Questions:', questions);
            const success = await saveQuiz(data, questions, editingQuiz);
            if (success) {
              // Не закрываем форму, а просто обновляем данные редактируемого теста
              if (editingQuiz) {
                // Обновляем editingQuiz новыми данными
                setEditingQuiz({
                  ...editingQuiz,
                  ...data,
                  questions: questions
                });
              }
              // Показываем уведомление об успехе
              console.log('Тест успешно сохранен, продолжаем редактирование');
            }
            return success;
          }}
          onSaveAndClose={async (data, questions) => {
            console.log('Saving quiz and closing:', data);
            console.log('Questions:', questions);
            const success = await saveQuiz(data, questions, editingQuiz);
            if (success) {
              handleFormClose();
            }
            return success;
          }}
          onCancel={handleFormClose}
          isEditing={!!editingQuiz}
        />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Управление тестами</h1>
          <p className={styles.subtitle}>Создавайте и управляйте тестами для ваших учеников</p>
          <div style={{fontSize: '12px', color: '#666', marginTop: '8px'}}>
            Debug: {debugInfo} | Role: {profile?.role}
          </div>
          {profile?.role !== 'teacher' && (
            <div style={{fontSize: '14px', color: '#dc2626', marginTop: '8px', padding: '8px', background: '#fef2f2', borderRadius: '4px'}}>
              ⚠️ Только учители могут управлять тестами. Ваша роль: {profile?.role}
            </div>
          )}
        </div>
        <button
          onClick={() => {
            console.log('Create test button clicked');
            setShowCreateForm(true);
          }}
          className={`${styles.button} ${styles.buttonPrimary}`}
          disabled={profile?.role !== 'teacher'}
        >
          <Plus size={20} />
          Создать тест
        </button>
      </div>

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
          <button
            onClick={() => setFilterStatus('all')}
            className={`${styles.filterButton} ${filterStatus === 'all' ? styles.filterActive : ''}`}
          >
            Все тесты
          </button>
          <button
            onClick={() => setFilterStatus('published')}
            className={`${styles.filterButton} ${filterStatus === 'published' ? styles.filterActive : ''}`}
          >
            Опубликованные
          </button>
          <button
            onClick={() => setFilterStatus('draft')}
            className={`${styles.filterButton} ${filterStatus === 'draft' ? styles.filterActive : ''}`}
          >
            Черновики
          </button>
        </div>
      </div>

      {/* Список тестов */}
      <div className={styles.quizzesGrid}>
        {filteredQuizzes.length === 0 ? (
          <div className={styles.emptyState}>
            <BookOpen size={48} className={styles.emptyIcon} />
            <h3 className={styles.emptyTitle}>Тесты не найдены</h3>
            <p className={styles.emptyText}>
              {searchTerm || filterStatus !== 'all' 
                ? 'Попробуйте изменить параметры поиска или фильтры'
                : 'Создайте свой первый тест для учеников'
              }
            </p>
            {!searchTerm && filterStatus === 'all' && (
              <button
                onClick={() => setShowCreateForm(true)}
                className={`${styles.button} ${styles.buttonPrimary}`}
              >
                <Plus size={20} />
                Создать первый тест
              </button>
            )}
          </div>
        ) : (
          filteredQuizzes.map((quiz) => (
            <div key={quiz.id} className={styles.quizCard}>
              <div className={styles.quizHeader}>
                <div className={styles.quizInfo}>
                  <h3 className={styles.quizTitle}>{quiz.title}</h3>
                  <p className={styles.quizDescription}>{quiz.description}</p>
                </div>
                <div className={styles.quizStatus}>
                  {quiz.is_published ? (
                    <span className={`${styles.status} ${styles.statusPublished}`}>
                      Опубликовано
                    </span>
                  ) : (
                    <span className={`${styles.status} ${styles.statusDraft}`}>
                      Черновик
                    </span>
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
                  <Star size={16} />
                  <span className={getDifficultyColor(quiz.difficulty_level)}>
                    {getDifficultyText(quiz.difficulty_level)}
                  </span>
                </div>
                <div className={styles.metaItem}>
                  <Users size={16} />
                  <span>{quiz.questions?.length || 0} вопросов</span>
                </div>
              </div>

              <div className={styles.quizActions}>
                <button
                  onClick={() => handlePublishQuiz(quiz)}
                  className={`${styles.button} ${quiz.is_published ? styles.buttonWarning : styles.buttonSuccess}`}
                >
                  {quiz.is_published ? <EyeOff size={16} /> : <Eye size={16} />}
                  {quiz.is_published ? 'Снять с публикации' : 'Опубликовать'}
                </button>
                <button
                  onClick={() => setSelectedQuiz(quiz)}
                  className={`${styles.button} ${styles.buttonSecondary}`}
                >
                  <Users size={16} />
                  Результаты
                </button>
                <button
                  onClick={() => handleEditQuiz(quiz)}
                  className={`${styles.button} ${styles.buttonSecondary}`}
                >
                  <Edit size={16} />
                  Редактировать
                </button>
                <button
                  onClick={() => handleDeleteQuiz(quiz.id)}
                  className={`${styles.button} ${styles.buttonDanger}`}
                >
                  <Trash2 size={16} />
                  Удалить
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Модальное окно результатов теста */}
      {selectedQuiz && (
        <QuizResultsModal
          quiz={selectedQuiz}
          onClose={() => setSelectedQuiz(null)}
        />
      )}
    </div>
  );
};

export default TestsManagement;