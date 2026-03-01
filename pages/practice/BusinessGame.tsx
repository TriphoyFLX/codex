import { useState, useEffect } from 'react';
import { Trophy, Plus, X, Edit, Trash2, Save, ArrowLeft, ArrowRight } from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import { useProfile } from '../../context/ProfileContext';
import styles from './BusinessGame.module.css';
import { useNavigate, useParams } from 'react-router-dom';

// Типы вопросов
const QUESTION_TYPES = [
  { id: 'multiple_choice', name: 'Множественный выбор', icon: '🔘' },
  { id: 'true_false', name: 'Верно/Неверно', icon: '✓✗' },
  { id: 'short_answer', name: 'Короткий ответ', icon: '📝' },
  { id: 'matching', name: 'Сопоставление', icon: '↔️' },
  { id: 'sequence', name: 'Последовательность', icon: '🔢' }
];

const DIFFICULTY_LEVELS = [
  { id: 1, name: 'Легкий', color: 'bg-green-500', points: 10 },
  { id: 2, name: 'Средний', color: 'bg-yellow-500', points: 20 },
  { id: 3, name: 'Сложный', color: 'bg-orange-500', points: 30 },
  { id: 4, name: 'Эксперт', color: 'bg-red-500', points: 50 }
];

interface Question {
  id?: string;
  question_text: string;
  type: string;
  difficulty: number;
  options: string[];
  correct_answer: string | number;
  explanation: string;
  points: number;
  category: string;
  tags: string[];
}

interface Quiz {
  id: string;
  teacher_id: string;
  title: string;
  description: string;
  subject: string;
  difficulty_level: number;
  time_limit: number;
  questions: Question[];
  is_published: boolean;
  is_active: boolean;
  created_at: string;
  school_id?: string;
  total_points?: number;
}

interface QuizResult {
  id: string;
  quiz_id: string;
  student_id: string;
  score: number;
  total_points: number;
  completed_at: string;
}

interface Leaderboard {
  id: string;
  student_id: string;
  total_score: number;
  total_quizzes: number;
  school_id?: string;
}

export default function BusinessGame() {
  const { profile } = useProfile();
  const { quizId } = useParams();
  const navigate = useNavigate();
  
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [userResults, setUserResults] = useState<QuizResult[]>([]);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [userRole, setUserRole] = useState<'student' | 'teacher'>('student');
  const [showQuizForm, setShowQuizForm] = useState(false);
  const [currentQuizResult, setCurrentQuizResult] = useState<QuizResult | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, any>>({});
  const [quizStartTime, setQuizStartTime] = useState<Date | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [totalQuizPoints, setTotalQuizPoints] = useState(0);
  const [showResults, setShowResults] = useState(false);

  // Загрузка теста
  useEffect(() => {
    if (quizId) {
      const fetchQuiz = async () => {
        try {
          const response = await apiClient.get(`/quizzes/${quizId}`);
          setQuiz(response.data);
        } catch (error) {
          console.error('Error loading quiz:', error);
        }
      };
      fetchQuiz();
    }
  }, [quizId]);

  // Загрузка результатов пользователя
  useEffect(() => {
    if (profile?.id) {
      const fetchUserResults = async () => {
        try {
          const response = await apiClient.get('/quiz_results', {
            params: { student_id: profile.id }
          });
          setUserResults(response.data || []);
        } catch (error) {
          console.error('Error loading user results:', error);
        }
      };
      fetchUserResults();
    }
  }, [profile?.id]);

  // Загрузка тестов для учителей
  useEffect(() => {
    const user = profile;
    if (!user) return;
    
    const fetchQuizzes = async () => {
      try {
        const endpoint = user.role === 'teacher' 
          ? `/quizzes?teacher_id=${user.id}`
          : '/quizzes?published=true';
        
        const response = await apiClient.get(endpoint);
        setQuizzes(response.data || []);
      } catch (error) {
        console.error('Error loading quizzes:', error);
      }
    };
    
    if (user) {
      setUserRole(user.role);
      fetchQuizzes();
    }
  }, [profile]);

  // Загрузка результатов конкретного теста
  useEffect(() => {
    const user = profile;
    if (!user || !quizId) return;
    
    const fetchQuizResult = async () => {
      try {
        const response = await apiClient.get('/quiz_results', {
          params: { 
            quiz_id: quizId,
            student_id: user.id 
          }
        });
        
        if (response.data && response.data.length > 0) {
          setCurrentQuizResult(response.data[0]);
        }
      } catch (error) {
        console.error('Error loading quiz result:', error);
      }
    };
    
    fetchQuizResult();
  }, [profile, quizId]);

  // Создание/обновление теста
  const handleSaveQuiz = async (quizData: Partial<Quiz>) => {
    if (!profile?.id) return;

    try {
      if (editingQuiz) {
        await apiClient.put(`/quizzes/${editingQuiz.id}`, quizData);
        alert('Тест обновлен!');
      } else {
        await apiClient.post('/quizzes', {
          ...quizData,
          teacher_id: profile.id,
          school_id: profile.school_id
        });
        alert('Тест создан!');
      }
      
      setEditingQuiz(null);
      setShowQuizForm(false);
      setIsCreating(false);
      
      // Перезагружаем тесты
      const response = await apiClient.get(`/quizzes?teacher_id=${profile.id}`);
      setQuizzes(response.data || []);
    } catch (error) {
      console.error('Error saving quiz:', error);
      alert('Ошибка сохранения теста');
    }
  };

  // Управление публикацией теста
  const handlePublishQuiz = async (quizId: string, publish: boolean) => {
    try {
      await apiClient.put(`/quizzes/${quizId}`, { 
        is_published: publish 
      });
      
      // Обновляем список тестов
      const response = await apiClient.get(`/quizzes?teacher_id=${profile?.id}`);
      setQuizzes(response.data || []);
    } catch (error) {
      console.error('Error publishing quiz:', error);
    }
  };

  // Начало прохождения теста
  const startQuiz = (quizData: Quiz) => {
    setQuizStartTime(new Date());
    setSelectedAnswers({});
    setQuizScore(0);
    setTotalQuizPoints(quizData.questions.reduce((sum, q) => sum + q.points, 0));
    setShowResults(false);
  };

  // Отправка результатов теста
  const submitQuizResults = async () => {
    if (!profile?.id || !quiz || !quizStartTime) return;

    try {
      let score = 0;
      const totalPoints = quiz.questions.reduce((sum, q) => sum + q.points, 0);

      // Подсчет очков
      Object.entries(selectedAnswers).forEach(([questionId, answer]) => {
        const question = quiz.questions.find(q => q.id === questionId);
        if (question) {
          // Простая логика подсчета очков
          score += question.points;
        }
      });

      const resultData = {
        quiz_id: quiz.id,
        student_id: profile.id,
        score: score,
        total_points: totalPoints
      };

      // Проверяем, существует ли уже запись о прохождении теста
      const existingResponse = await apiClient.get('/quiz_results', {
        params: { 
          quiz_id: quiz.id,
          student_id: profile.id 
        }
      });

      if (existingResponse.data && existingResponse.data.length > 0) {
        const existingResult = existingResponse.data[0];
        // Обновляем существующую запись
        await apiClient.put(`/quiz_results/${existingResult.id}`, {
          ...resultData,
          score: Math.max(score, existingResult.score)
        });
      } else {
        // Создаем новую запись
        await apiClient.post('/quiz_results', resultData);
      }

      // Обновляем очки пользователя в лидерборде
      await updateUserPoints(profile.id, score, totalPoints);

      setShowResults(true);
    } catch (error) {
      console.error('Error submitting quiz:', error);
      alert('Ошибка отправки результатов');
    }
  };

  // Обновление очков пользователя
  const updateUserPoints = async (userId: string, newPoints: number, previousScore: number = 0) => {
    try {
      // Получаем текущие очки
      const response = await apiClient.get('/leaderboard', {
        params: { student_id: userId }
      });

      if (response.data && response.data.length > 0) {
        const existingScore = response.data[0];
        const updatedTotal = existingScore.total_score + newPoints;
        const updatedQuizzes = existingScore.total_quizzes + 1;
        
        // Обновляем или создаем запись в лидерборде
        if (existingScore.id) {
          await apiClient.put(`/leaderboard/${existingScore.id}`, { 
            total_score: updatedTotal,
            total_quizzes: updatedQuizzes,
            average_score: ((updatedTotal / updatedQuizzes) * 10).toFixed(2)
          });
        } else {
          await apiClient.post('/leaderboard', {
            student_id: userId,
            total_score: newPoints,
            total_quizzes: 1,
            average_score: ((newPoints / 1) * 10).toFixed(2)
          });
        }
      }
    } catch (error) {
      console.error('Error updating user points:', error);
    }
  };

  // Удаление теста
  const handleDeleteQuiz = async (quizId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот тест?')) return;

    try {
      await apiClient.delete(`/quizzes/${quizId}`);
      
      // Обновляем список тестов
      const response = await apiClient.get(`/quizzes?teacher_id=${profile?.id}`);
      setQuizzes(response.data || []);
    } catch (error) {
      console.error('Error deleting quiz:', error);
      alert('Ошибка удаления теста');
    }
  };

  if (!profile) {
    return <div className={styles.container}>Загрузка...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button 
          onClick={() => navigate('/practice')}
          className={styles.backButton}
        >
          <ArrowLeft size={20} />
          Назад к тестам
        </button>
        
        <h1>Бизнес-игра</h1>
        {userRole === 'teacher' && (
          <button 
            onClick={() => setShowQuizForm(true)}
            className={styles.createButton}
          >
            <Plus size={20} />
            Создать тест
          </button>
        )}
      </div>

      {quizId && quiz ? (
        <div className={styles.quizContainer}>
          <div className={styles.quizHeader}>
            <h2>{quiz.title}</h2>
            <p>{quiz.description}</p>
            <div className={styles.quizMeta}>
              <span>Предмет: {quiz.subject}</span>
              <span>Сложность: {DIFFICULTY_LEVELS.find(d => d.id === quiz.difficulty_level)?.name}</span>
              <span>Время: {quiz.time_limit} мин</span>
              <span>Очки: {quiz.total_points}</span>
            </div>
            
            {userRole === 'teacher' && (
              <div className={styles.teacherActions}>
                <button onClick={() => handlePublishQuiz(quiz.id, !quiz.is_published)}>
                  {quiz.is_published ? 'Снять с публикации' : 'Опубликовать'}
                </button>
                <button onClick={() => setEditingQuiz(quiz)}>
                  <Edit size={16} />
                </button>
                <button onClick={() => handleDeleteQuiz(quiz.id)}>
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </div>

          {!showResults ? (
            <div className={styles.quizContent}>
              {quiz.questions.map((question, index) => (
                <div key={question.id} className={styles.question}>
                  <div className={styles.questionHeader}>
                    <span className={styles.questionNumber}>Вопрос {index + 1}</span>
                    <span className={styles.questionPoints}>{question.points} очков</span>
                  </div>
                  
                  <div className={styles.questionText}>
                    {question.question_text}
                  </div>
                  
                  {question.type === 'multiple_choice' && (
                    <div className={styles.options}>
                      {question.options.map((option, optIndex) => (
                        <label key={optIndex} className={styles.option}>
                          <input
                            type="radio"
                            name={`question-${question.id}`}
                            value={option}
                            onChange={(e) => setSelectedAnswers({
                              ...selectedAnswers,
                              [question.id as string]: e.target.value
                            })}
                          />
                          {option}
                        </label>
                      ))}
                    </div>
                  )}
                  
                  {question.type === 'short_answer' && (
                    <textarea
                      className={styles.textAnswer}
                      placeholder="Ваш ответ..."
                      onChange={(e) => setSelectedAnswers({
                        ...selectedAnswers,
                        [question.id as string]: e.target.value
                      })}
                    />
                  )}
                </div>
              ))}
              
              <button 
                onClick={submitQuizResults}
                className={styles.submitButton}
              >
                Завершить тест
              </button>
            </div>
          ) : (
            <div className={styles.results}>
              <h3>Результаты</h3>
              <div className={styles.scoreDisplay}>
                <div className={styles.scoreItem}>
                  <span>Ваши очки:</span>
                  <span className={styles.scoreValue}>{quizScore}</span>
                </div>
                <div className={styles.scoreItem}>
                  <span>Всего очков:</span>
                  <span className={styles.scoreValue}>{totalQuizPoints}</span>
                </div>
                <div className={styles.scoreItem}>
                  <span>Процент:</span>
                  <span className={styles.scoreValue}>
                    {totalQuizPoints > 0 ? ((quizScore / totalQuizPoints) * 100).toFixed(1) : '0'}%
                  </span>
                </div>
              </div>
              
              <button 
                onClick={() => {
                  setShowResults(false);
                  startQuiz(quiz);
                }}
                className={styles.retryButton}
              >
                Пройти заново
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className={styles.quizzesList}>
          <h2>Тесты</h2>
          
          {userRole === 'teacher' && showQuizForm && (
            <div className={styles.quizForm}>
              <h3>{editingQuiz ? 'Редактировать тест' : 'Создать тест'}</h3>
              
              <input
                type="text"
                placeholder="Название теста"
                defaultValue={editingQuiz?.title || ''}
                ref={input => { if (input) input.value = editingQuiz?.title || ''; }}
              />
              
              <textarea
                placeholder="Описание"
                defaultValue={editingQuiz?.description || ''}
                ref={textarea => { if (textarea) textarea.value = editingQuiz?.description || ''; }}
              />
              
              <select defaultValue={editingQuiz?.subject || ''}>
                <option value="">Выберите предмет</option>
                <option value="Математика">Математика</option>
                <option value="Русский язык">Русский язык</option>
                <option value="Английский язык">Английский язык</option>
              </select>
              
              <select defaultValue={editingQuiz?.difficulty_level?.toString() || '1'}>
                {DIFFICULTY_LEVELS.map(level => (
                  <option key={level.id} value={level.id}>
                    {level.name}
                  </option>
                ))}
              </select>
              
              <input
                type="number"
                placeholder="Время限制 (минуты)"
                defaultValue={editingQuiz?.time_limit?.toString() || '30'}
              />
              
              <div className={styles.formActions}>
                <button 
                  onClick={() => {
                    const title = (document.querySelector('input[placeholder="Название теста"]') as HTMLInputElement)?.value || '';
                    const description = (document.querySelector('textarea[placeholder="Описание"]') as HTMLTextAreaElement)?.value || '';
                    const subject = (document.querySelector('select') as HTMLSelectElement)?.value || '';
                    const difficulty = parseInt((document.querySelector('select[defaultValue]') as HTMLSelectElement)?.value || '1');
                    const timeLimit = parseInt((document.querySelector('input[placeholder="Время限制 (минуты)"]') as HTMLInputElement)?.value || '30');
                    
                    handleSaveQuiz({
                      title,
                      description,
                      subject,
                      difficulty_level: difficulty,
                      time_limit: timeLimit,
                      questions: []
                    });
                  }}
                  className={styles.saveButton}
                >
                  <Save size={16} />
                  {editingQuiz ? 'Обновить' : 'Создать'}
                </button>
                
                <button 
                  onClick={() => {
                    setShowQuizForm(false);
                    setEditingQuiz(null);
                  }}
                  className={styles.cancelButton}
                >
                  <X size={16} />
                  Отмена
                </button>
              </div>
            </div>
          )}
          
          <div className={styles.quizzesGrid}>
            {quizzes.map(quizItem => (
              <div key={quizItem.id} className={styles.quizCard}>
                <h3>{quizItem.title}</h3>
                <p>{quizItem.description}</p>
                <div className={styles.quizMeta}>
                  <span>Предмет: {quizItem.subject}</span>
                  <span>Сложность: {DIFFICULTY_LEVELS.find(d => d.id === quizItem.difficulty_level)?.name}</span>
                  <span>Вопросов: {quizItem.questions.length}</span>
                  <span>Очков: {quizItem.total_points}</span>
                  <span>Статус: {quizItem.is_published ? 'Опубликовано' : 'Черновик'}</span>
                </div>
                
                <div className={styles.quizActions}>
                  <button onClick={() => navigate(`/practice/${quizItem.id}`)}>
                    <ArrowRight size={16} />
                  </button>
                  
                  {userRole === 'teacher' && (
                    <>
                      <button onClick={() => setEditingQuiz(quizItem)}>
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handleDeleteQuiz(quizItem.id)}>
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {userRole === 'student' && (
        <div className={styles.leaderboard}>
          <h2>Таблица лидеров</h2>
          <div className={styles.leaderboardList}>
            {userResults
              .sort((a, b) => b.score - a.score)
              .slice(0, 10)
              .map((result, index) => (
                <div key={result.id} className={styles.leaderboardItem}>
                  <span className={styles.rank}>#{index + 1}</span>
                  <span className={styles.score}>{result.score} очков</span>
                  <span className={styles.date}>
                    {new Date(result.completed_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
