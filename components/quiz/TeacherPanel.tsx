import React, { useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { useQuizStore } from '../../hooks/useQuizStore';
import { useQuizApi } from '../../hooks/useQuizApi';
import { useToast } from '../common/Toast';
import { Quiz, Question } from '../../types/quiz.types';
import { DIFFICULTY_LEVELS } from '../../constants/quiz.constants';
import { QuizForm } from './forms/QuizForm';
import { QuestionForm } from './forms/QuestionForm';
import { QuestionCard } from './QuestionCard';
import { LoadingOverlay } from '../common/LoadingSpinner';
import styles from '../../pages/practice/BusinessGame.module.css';

export const TeacherPanel: React.FC = () => {
  const {
    quizzes,
    showCreateQuiz,
    editingQuiz,
    questions,
    editingQuestion,
    loading,
    setShowCreateQuiz,
    setEditingQuiz,
    setQuestions,
    setEditingQuestion,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    resetQuizForm,
    resetQuestionForm
  } = useQuizStore();

  const { loadQuizzes, saveQuiz, publishQuiz, deleteQuiz } = useQuizApi();
  const toast = useToast();

  useEffect(() => {
    loadQuizzes();
  }, [loadQuizzes]);

  const handleCreateQuiz = () => {
    setShowCreateQuiz(true);
    setEditingQuiz(null);
    setQuestions([]);
  };

  const handleEditQuiz = (quiz: Quiz) => {
    setEditingQuiz(quiz);
    setQuestions(quiz.questions || []);
    setShowCreateQuiz(true);
  };

  const handleSaveQuiz = async (formData: any) => {
    const success = await saveQuiz(formData, questions, editingQuiz);
    if (success) {
      resetQuizForm();
    }
    return success;
  };

  const handleAddQuestion = () => {
    setEditingQuestion({
      id: '',
      question_text: '',
      type: 'multiple_choice',
      difficulty: 1,
      options: ['', '', '', ''],
      correct_answer: 0,
      explanation: '',
      points: 10,
      category: 'Финансы',
      tags: []
    });
  };

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question);
  };

  const handleSaveQuestion = async (questionData: Question) => {
    try {
      if (questionData.id && questions.find(q => q.id === questionData.id)) {
        updateQuestion(questionData.id, questionData);
      } else {
        const newQuestion = {
          ...questionData,
          id: `question_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
        addQuestion(newQuestion);
      }
      resetQuestionForm();
      return true;
    } catch (error) {
      console.error('Error saving question:', error);
      return false;
    }
  };

  const handleDeleteQuestion = (questionId: string) => {
    if (window.confirm('Вы уверены, что хотите удалить этот вопрос?')) {
      deleteQuestion(questionId);
      toast.success('Успешно', 'Вопрос удален');
    }
  };

  const handlePublishQuiz = async (quizId: string) => {
    if (window.confirm('Опубликовать тест? После публикации тест станет доступен студентам.')) {
      await publishQuiz(quizId);
    }
  };

  const handleDeleteQuiz = async (quizId: string) => {
    if (window.confirm('Вы уверены, что хотите удалить этот тест? Это действие нельзя отменить.')) {
      await deleteQuiz(quizId);
    }
  };

  return (
    <>
      {loading && <LoadingOverlay text="Загрузка..." />}
      
      {/* Редактор вопроса */}
      {editingQuestion && (
        <QuestionForm
          initialData={editingQuestion}
          onSubmit={handleSaveQuestion}
          onCancel={resetQuestionForm}
          isEditing={!!editingQuestion.id}
        />
      )}

      <div className={styles.mb8}>
        <div className={styles.flexBetween} style={{ marginBottom: '1.5rem' }}>
          <h2 className={styles.cardTitle}>Мои тесты</h2>
          <button
            onClick={handleCreateQuiz}
            className={`${styles.button} ${styles.buttonPrimary}`}
            disabled={loading}
          >
            <Plus size={20} />
            Создать тест
          </button>
        </div>

        {/* Форма создания/редактирования теста */}
        {showCreateQuiz && (
          <div className={styles.mb8}>
            <QuizForm
              initialData={editingQuiz ? {
                title: editingQuiz.title,
                description: editingQuiz.description,
                subject: editingQuiz.subject,
                difficulty_level: editingQuiz.difficulty_level,
                time_limit: editingQuiz.time_limit
              } : undefined}
              onSubmit={handleSaveQuiz}
              onCancel={resetQuizForm}
              isEditing={!!editingQuiz}
              isLoading={loading}
            />

            {/* Управление вопросами */}
            <div className={`${styles.card} ${styles.mt8}`}>
              <div className={styles.flexBetween} style={{ marginBottom: '1rem' }}>
                <h4 className={styles.cardTitle}>Вопросы теста</h4>
                <button
                  onClick={handleAddQuestion}
                  className={`${styles.button} ${styles.buttonSuccess}`}
                  disabled={loading}
                >
                  <Plus size={20} />
                  Добавить вопрос
                </button>
              </div>

              {questions.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>📝</div>
                  <p className={styles.emptyText}>В тесте пока нет вопросов</p>
                  <p className={styles.emptySubtext}>
                    Добавьте хотя бы один вопрос для сохранения теста
                  </p>
                </div>
              ) : (
                <div className={styles.flexCol} style={{ gap: '1rem' }}>
                  {questions.map((question, index) => (
                    <QuestionCard
                      key={question.id || index}
                      question={question}
                      index={index}
                      onEdit={handleEditQuestion}
                      onDelete={handleDeleteQuestion}
                      isLoading={loading}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Список существующих тестов */}
        <div className={styles.grid} style={{ 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '1.5rem' 
        }}>
          {quizzes.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>📚</div>
              <p className={styles.emptyText}>У вас пока нет тестов</p>
              <p className={styles.emptySubtext}>
                Создайте свой первый тест для студентов
              </p>
            </div>
          ) : (
            quizzes.map(quiz => (
              <QuizCard
                key={quiz.id}
                quiz={quiz}
                onEdit={() => handleEditQuiz(quiz)}
                onPublish={() => handlePublishQuiz(quiz.id)}
                onDelete={() => handleDeleteQuiz(quiz.id)}
                isLoading={loading}
              />
            ))
          )}
        </div>
      </div>
    </>
  );
};

// Карточка теста
interface QuizCardProps {
  quiz: Quiz;
  onEdit: () => void;
  onPublish: () => void;
  onDelete: () => void;
  isLoading?: boolean;
}

const QuizCard: React.FC<QuizCardProps> = ({
  quiz,
  onEdit,
  onPublish,
  onDelete,
  isLoading = false
}) => {
  const getDifficultyTag = (level: number) => {
    const className = level === 1 ? styles.tagSuccess :
                     level === 2 ? styles.tagWarning :
                     level === 3 ? styles.tagDanger : styles.tagDanger;
    
    return (
      <span className={`${styles.tag} ${className}`}>
        {DIFFICULTY_LEVELS.find(d => d.id === level)?.name}
      </span>
    );
  };

  const totalPoints = quiz.questions?.reduce((sum: number, q: any) => sum + (q.points || 0), 0) || 0;

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
            {getDifficultyTag(quiz.difficulty_level)}
            <span className={`${styles.tag} ${styles.tagPurple}`}>
              {quiz.questions?.length || 0} вопросов
            </span>
            <span className={`${styles.tag} ${styles.tagGray}`}>
              {quiz.time_limit} мин
            </span>
            {totalPoints > 0 && (
              <span className={`${styles.tag} ${styles.tagYellow}`}>
                {totalPoints} очков
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
              disabled={isLoading || !quiz.questions?.length}
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
};