import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Quiz, Question, QuizResult } from '../types/quiz.types';

interface QuizState {
  // UI состояние
  role: 'student' | 'teacher';
  loading: boolean;
  error: string | null;
  
  // Данные пользователя
  points: number;
  streak: number;
  
  // Тесты
  quizzes: Quiz[];
  availableQuizzes: Quiz[];
  currentQuiz: Quiz | null;
  
  // Создание/редактирование тестов
  showCreateQuiz: boolean;
  editingQuiz: Quiz | null;
  questions: Question[];
  editingQuestion: Question | null;
  
  // Прохождение тестов
  quizInProgress: boolean;
  quizQuestions: Question[];
  currentQuestionIndex: number;
  quizAnswers: any[];
  quizTimer: number | null;
  quizResults: QuizResult | null;
  
  // Actions
  setRole: (role: 'student' | 'teacher') => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setPoints: (points: number) => void;
  setStreak: (streak: number) => void;
  
  // Quiz management
  setQuizzes: (quizzes: Quiz[]) => void;
  setAvailableQuizzes: (quizzes: Quiz[]) => void;
  setCurrentQuiz: (quiz: Quiz | null) => void;
  
  // Quiz creation
  setShowCreateQuiz: (show: boolean) => void;
  setEditingQuiz: (quiz: Quiz | null) => void;
  setQuestions: (questions: Question[]) => void;
  setEditingQuestion: (question: Question | null) => void;
  addQuestion: (question: Question) => void;
  updateQuestion: (id: string, question: Question) => void;
  deleteQuestion: (id: string) => void;
  
  // Quiz taking
  startQuiz: (quiz: Quiz) => void;
  setCurrentQuestionIndex: (index: number) => void;
  addQuizAnswer: (answer: any) => void;
  setQuizResults: (results: QuizResult | null) => void;
  endQuiz: () => void;
  
  // Timer
  setQuizTimer: (timer: number | null) => void;
  decrementTimer: () => void;
  
  // Reset functions
  resetQuizForm: () => void;
  resetQuestionForm: () => void;
}

export const useQuizStore = create<QuizState>()(
  devtools(
    (set, get) => ({
      // Initial state
      role: 'student',
      loading: false,
      error: null,
      points: 0,
      streak: 0,
      
      quizzes: [],
      availableQuizzes: [],
      currentQuiz: null,
      
      showCreateQuiz: false,
      editingQuiz: null,
      questions: [],
      editingQuestion: null,
      
      quizInProgress: false,
      quizQuestions: [],
      currentQuestionIndex: 0,
      quizAnswers: [],
      quizTimer: null,
      quizResults: null,
      
      // Basic setters
      setRole: (role) => set({ role }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      setPoints: (points) => set({ points }),
      setStreak: (streak) => set({ streak }),
      
      // Quiz management
      setQuizzes: (quizzes) => set({ quizzes }),
      setAvailableQuizzes: (availableQuizzes) => set({ availableQuizzes }),
      setCurrentQuiz: (currentQuiz) => set({ currentQuiz }),
      
      // Quiz creation
      setShowCreateQuiz: (showCreateQuiz) => set({ showCreateQuiz }),
      setEditingQuiz: (editingQuiz) => set({ editingQuiz }),
      setQuestions: (questions) => set({ questions }),
      setEditingQuestion: (editingQuestion) => set({ editingQuestion }),
      
      addQuestion: (question) => {
        const { questions } = get();
        set({ questions: [...questions, question] });
      },
      
      updateQuestion: (id, updatedQuestion) => {
        const { questions } = get();
        const index = questions.findIndex(q => q.id === id);
        if (index !== -1) {
          const newQuestions = [...questions];
          newQuestions[index] = updatedQuestion;
          set({ questions: newQuestions });
        }
      },
      
      deleteQuestion: (id) => {
        const { questions } = get();
        set({ questions: questions.filter(q => q.id !== id) });
      },
      
      // Quiz taking
      startQuiz: (quiz) => {
        set({
          currentQuiz: quiz,
          quizInProgress: true,
          quizQuestions: quiz.questions || [],
          currentQuestionIndex: 0,
          quizAnswers: [],
          quizResults: null,
          quizTimer: quiz.time_limit ? quiz.time_limit * 60 : null
        });
      },
      
      setCurrentQuestionIndex: (currentQuestionIndex) => set({ currentQuestionIndex }),
      
      addQuizAnswer: (answer) => {
        const { quizAnswers } = get();
        set({ quizAnswers: [...quizAnswers, answer] });
      },
      
      setQuizResults: (quizResults) => set({ quizResults }),
      
      endQuiz: () => {
        set({
          quizInProgress: false,
          currentQuiz: null,
          quizResults: null,
          quizQuestions: [],
          currentQuestionIndex: 0,
          quizAnswers: [],
          quizTimer: null
        });
      },
      
      // Timer
      setQuizTimer: (quizTimer) => set({ quizTimer }),
      
      decrementTimer: () => {
        const { quizTimer } = get();
        if (quizTimer !== null && quizTimer > 0) {
          set({ quizTimer: quizTimer - 1 });
        }
      },
      
      // Reset functions
      resetQuizForm: () => {
        set({
          showCreateQuiz: false,
          editingQuiz: null,
          questions: [],
          editingQuestion: null
        });
      },
      
      resetQuestionForm: () => {
        set({ editingQuestion: null });
      }
    }),
    { name: 'quiz-store' }
  )
);