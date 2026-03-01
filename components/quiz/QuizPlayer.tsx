import React, { useEffect, useMemo, useState } from 'react';
import { Clock, ChevronLeft, ChevronRight, XCircle, Flag } from 'lucide-react';
import { useQuizApi } from '../../hooks/useQuizApi';
import { useAuth } from '../../hooks/useAuth';
import { useLeaderboard } from '../../hooks/useLeaderboard';
import { Question, QuizAnswer } from '../../types/quiz.types';
import { DIFFICULTY_LEVELS } from '../../constants/quiz.constants';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { QuizCompletionModal } from './QuizCompletionModal';
import { useQuizStore } from '../../hooks/useQuizStore';
import styles from './QuizPlayer.module.css';

interface QuizPlayerProps {
  quiz: {
    id: string;
    title: string;
    description: string;
    subject: string;
    difficulty_level: number;
    time_limit: number;
    questions: Question[];
    teacher_id?: string;
  };
  onComplete?: (results: any) => void;
}

export const QuizPlayer: React.FC<QuizPlayerProps> = ({ quiz, onComplete }) => {
  const { user } = useAuth();
  const { saveQuizResults } = useQuizApi();
  const { addQuizResult } = useLeaderboard();
  const { endQuiz } = useQuizStore();
  
  console.log('QuizPlayer: Component mounted');
  console.log('QuizPlayer: User:', user);
  console.log('QuizPlayer: Quiz:', quiz);
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [timeLeft, setTimeLeft] = useState(quiz.time_limit * 60); // конвертируем минуты в секунды
  const [isCompleted, setIsCompleted] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [shortAnswerInput, setShortAnswerInput] = useState('');
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [finalResults, setFinalResults] = useState<any>(null);
  const [pendingCompletePayload, setPendingCompletePayload] = useState<any>(null);

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

  const selectedAnswer = useMemo(() => {
    if (!currentQuestion) return null;
    return answers[currentQuestion.id] ?? null;
  }, [answers, currentQuestion]);

  const unansweredCount = useMemo(() => {
    return quiz.questions.reduce((count, q) => (answers[q.id] === undefined ? count + 1 : count), 0);
  }, [answers, quiz.questions]);

  useEffect(() => {
    if (!currentQuestion) return;
    if (currentQuestion.type !== 'short_answer') return;

    const existing = answers[currentQuestion.id];
    setShortAnswerInput(typeof existing === 'string' ? existing : '');
  }, [answers, currentQuestion]);

  // Таймер
  useEffect(() => {
    if (timeLeft <= 0 || isCompleted) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleSubmitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isCompleted]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = (answer: string | number) => {
    if (!currentQuestion || isCompleted) return;

    setValidationError(null);

    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: answer
    }));
  };

  const buildQuizAnswers = () => {
    return quiz.questions
      .filter(q => answers[q.id] !== undefined)
      .map((q) => {
        const selected = answers[q.id] as string | number;
        return {
          question_id: q.id,
          selected_answer: selected,
          is_correct: selected === q.correct_answer
        } satisfies QuizAnswer;
      });
  };

  const handleSubmitQuiz = async () => {
    if (isCompleted) return;

    const builtAnswers = buildQuizAnswers();
    
    // Проверяем, что пользователь ответил хотя бы на один вопрос
    if (builtAnswers.length === 0) {
      console.log('No answers provided, not submitting quiz');
      setIsCompleted(true);
      
      // Показываем модальное окно с результатами (пустыми)
      const modalResults = {
        correctAnswers: 0,
        totalPoints: 0,
        maxPoints: quiz.questions.reduce((sum, q) => sum + (q.points || 10), 0),
        percentage: 0,
        timeSpent: (quiz.time_limit * 60) - timeLeft,
        quizTitle: quiz.title,
        quizSubject: quiz.subject,
        totalQuestions: quiz.questions.length
      };

      setFinalResults(modalResults);
      setShowResultsModal(true);

      setPendingCompletePayload({
        quiz_id: quiz.id,
        user_id: user?.id,
        answers: [],
        score: 0,
        max_score: quiz.questions.reduce((sum, q) => sum + (q.points || 10), 0),
        correct_answers: 0,
        total_questions: quiz.questions.length,
        time_spent: (quiz.time_limit * 60) - timeLeft,
        completed_at: new Date().toISOString()
      });
      
      return;
    }
    
    setIsCompleted(true);
    
    const correctAnswers = builtAnswers.filter(a => a.is_correct).length;
    const totalPoints = builtAnswers.reduce((sum, answer) => {
      if (!answer.is_correct) return sum;
      const question = quiz.questions.find(q => q.id === answer.question_id);
      return sum + (question?.points || 10);
    }, 0);
    const maxPoints = quiz.questions.reduce((sum, q) => sum + (q.points || 10), 0);

    const results = {
      quiz_id: quiz.id,
      user_id: user?.id,
      answers: builtAnswers,
      score: totalPoints,
      max_score: maxPoints,
      correct_answers: correctAnswers,
      total_questions: quiz.questions.length,
      time_spent: (quiz.time_limit * 60) - timeLeft,
      completed_at: new Date().toISOString()
    };

    try {
      await saveQuizResults(
        results.quiz_id,
        quiz.teacher_id || '',
        results.total_questions,
        results.correct_answers,
        results.score,
        results.max_score,
        results.answers
      );
      console.log('Results saved:', results);
      
      // Добавляем результат в лидерборд
      if (user) {
        console.log('Adding result to leaderboard:', {
          user_id: user.id,
          username: user.username || user.email || 'Anonymous',
          quiz_id: quiz.id,
          score: results.score,
          max_score: results.max_score,
          completed_at: results.completed_at
        });
        
        addQuizResult({
          user_id: user.id,
          username: user.username || user.email || 'Anonymous',
          quiz_id: quiz.id,
          score: results.score,
          max_score: results.max_score,
          completed_at: results.completed_at
        });
      } else {
        console.log('No user found, cannot add to leaderboard');
      }
    } catch (error) {
      console.error('Error saving results:', error);
      // Показываем модальное окно даже если сохранение не удалось
    }

    // Сохраняем результаты для модального окна
    const modalResults = {
      correctAnswers,
      totalPoints,
      maxPoints,
      percentage: maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0,
      timeSpent: (quiz.time_limit * 60) - timeLeft,
      quizTitle: quiz.title,
      quizSubject: quiz.subject,
      totalQuestions: quiz.questions.length
    };

    setFinalResults(modalResults);

    // Показываем модальное окно с результатами
    setShowResultsModal(true);

    setPendingCompletePayload(results);
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setValidationError(null);
    }
  };

  const handleNext = () => {
    if (!currentQuestion) return;
    if (selectedAnswer === null || selectedAnswer === undefined) {
      setValidationError('Выберите ответ, чтобы перейти дальше');
      return;
    }

    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setValidationError(null);
    }
  };

  const handleFinish = () => {
    if (unansweredCount > 0) {
      const ok = window.confirm(`Вы не ответили на ${unansweredCount} вопрос(ов). Завершить тест?`);
      if (!ok) return;
    }
    handleSubmitQuiz();
  };

  if (!currentQuestion) {
    return <LoadingSpinner text="Загрузка вопроса..." />;
  }

  const renderQuestionOptions = () => {
    if (currentQuestion.type === 'multiple_choice') {
      return (
        <div className={styles.optionsContainer}>
          {currentQuestion.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswerSelect(index)}
              className={`${styles.optionButton} ${
                selectedAnswer === index ? styles.selected : ''
              }`}
            >
              <span className={styles.optionLetter}>{String.fromCharCode(65 + index)}</span>
              <span className={styles.optionText}>{option}</span>
            </button>
          ))}
        </div>
      );
    }

    if (currentQuestion.type === 'true_false') {
      return (
        <div className={styles.optionsContainer}>
          <button
            onClick={() => handleAnswerSelect(0)}
            className={`${styles.optionButton} ${styles.trueFalseButton} ${
              selectedAnswer === 0 ? styles.selected : ''
            }`}
          >
            Верно
          </button>
          <button
            onClick={() => handleAnswerSelect(1)}
            className={`${styles.optionButton} ${styles.trueFalseButton} ${
              selectedAnswer === 1 ? styles.selected : ''
            }`}
          >
            Неверно
          </button>
        </div>
      );
    }

    if (currentQuestion.type === 'short_answer') {
      return (
        <div className={styles.shortAnswerContainer}>
          <input
            type="text"
            value={shortAnswerInput}
            onChange={(e) => setShortAnswerInput(e.target.value)}
            placeholder="Введите ваш ответ..."
            className={styles.shortAnswerInput}
          />
          <button
            onClick={() => handleAnswerSelect(shortAnswerInput)}
            disabled={!shortAnswerInput.trim()}
            className={styles.submitButton}
          >
            Ответить
          </button>
        </div>
      );
    }

    return null;
  };

  return (
    <div className={styles.quizContainer}>
      <div className={styles.quizHeader}>
        <div className={styles.quizInfo}>
          <h1>{quiz.title}</h1>
          <div className={styles.quizMeta}>
            <span className={styles.subject}>{quiz.subject}</span>
            <span className={styles.difficulty}>
              {DIFFICULTY_LEVELS.find(d => d.id === quiz.difficulty_level)?.name}
            </span>
          </div>
        </div>
        <div className={styles.timer}>
          <Clock size={20} />
          <span className={timeLeft < 60 ? styles.timeWarning : ''}>
            {formatTime(timeLeft)}
          </span>
        </div>
      </div>

      <div className={styles.progressBar}>
        <div 
          className={styles.progressFill}
          style={{ width: `${progress}%` }}
        />
        <span className={styles.progressText}>
          Вопрос {currentQuestionIndex + 1} из {quiz.questions.length}
        </span>
      </div>

      <div className={styles.questionContainer}>
        <div className={styles.questionHeader}>
          <h2 className={styles.questionText}>
            {currentQuestion.question_text}
          </h2>
          <div className={styles.questionPoints}>
            {currentQuestion.points || 10} баллов
          </div>
        </div>

        {renderQuestionOptions()}

        {validationError && (
          <div className={styles.validationError}>
            <XCircle size={18} />
            {validationError}
          </div>
        )}

        <div className={styles.navigation}>
          <button
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            className={styles.navButton}
          >
            <ChevronLeft size={20} />
            Предыдущий
          </button>
          
          {currentQuestionIndex === quiz.questions.length - 1 ? (
            <button
              onClick={handleFinish}
              className={styles.finishButton}
            >
              <Flag size={20} />
              Завершить тест
            </button>
          ) : (
            <button
              onClick={handleNext}
              className={styles.navButton}
            >
              Следующий
              <ChevronRight size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Модальное окно с результатами */}
      <QuizCompletionModal
        isOpen={showResultsModal}
        onClose={() => {
          setShowResultsModal(false);
          if (onComplete && pendingCompletePayload) {
            onComplete(pendingCompletePayload);
          }
          setPendingCompletePayload(null);
          endQuiz();
        }}
        results={finalResults ?? {
          correctAnswers: 0,
          totalPoints: 0,
          maxPoints: quiz.questions.reduce((sum, q) => sum + (q.points || 10), 0),
          percentage: 0,
          timeSpent: 0,
          quizTitle: quiz.title,
          quizSubject: quiz.subject,
          totalQuestions: quiz.questions.length
        }}
      />
    </div>
  );
};
