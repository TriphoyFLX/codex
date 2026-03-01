import { useCallback } from 'react';
import { apiClient } from '../lib/apiClient';
import { useAuth } from './useAuth';
import { useQuizStore } from './useQuizStore';
import { useToast } from '../components/common/Toast';
import { Quiz, Question, QuizFormData } from '../types/quiz.types';

export const useQuizApi = () => {
  const { user } = useAuth();
  const { 
    setLoading, 
    setError, 
    setQuizzes, 
    setAvailableQuizzes
  } = useQuizStore();
  const toast = useToast();

  // Загрузка данных пользователя
  const loadUserData = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      const { data: profile } = await apiClient.get(`/profiles/${user.id}`);
      
      if (profile) {
        useQuizStore.getState().setRole(profile.role || 'student');
      }
      
      const { data: leaderboard } = await apiClient.get(`/leaderboard/${user.id}`);
      
      if (leaderboard) {
        useQuizStore.getState().setPoints(leaderboard.total_score || 0);
      }
      
    } catch (error) {
      console.error('Error loading user data:', error);
      setError('Ошибка загрузки данных пользователя');
      toast.error('Ошибка', 'Не удалось загрузить данные пользователя');
    } finally {
      setLoading(false);
    }
  }, [user, setLoading, setError, toast]);

  // Загрузка тестов
  const loadQuizzes = useCallback(async () => {
    if (!user) {
      console.log('loadQuizzes: No user found');
      return;
    }
    
    try {
      setLoading(true);
      console.log('loadQuizzes: Starting load for user:', user.id);
      
      // Сначала загружаем данные пользователя для определения роли
      const { data: profile } = await apiClient.get(`/profiles/${user.id}`);
      const userRole = profile?.role || 'student';
      
      console.log('loadQuizzes: User role:', userRole);
      console.log('loadQuizzes: User profile:', profile);
      
      // Устанавливаем роль в store
      useQuizStore.getState().setRole(userRole);
      
      // Все авторизованные пользователи видят опубликованные тесты
      const { data: publishedQuizzes } = await apiClient.get('/quizzes', {
        params: { published: 'true' }
      });
      console.log('loadQuizzes: Available quizzes loaded:', publishedQuizzes?.length || 0);
      setAvailableQuizzes(publishedQuizzes || []);
      
      // Дополнительно загружаем тесты учителя, если он учитель
      if (userRole === 'teacher') {
        console.log('loadQuizzes: Loading teacher quizzes for user:', user.id);
        // Загружаем все тесты учителя (и опубликованные, и черновики)
        const { data: teacherQuizzes } = await apiClient.get('/quizzes', {
          params: { teacher_id: user.id }
        });
        console.log('loadQuizzes: Teacher quizzes loaded:', teacherQuizzes?.length || 0);
        console.log('loadQuizzes: Teacher quizzes data:', teacherQuizzes);
        setQuizzes(teacherQuizzes || []);
      } else {
        // Для студентов оставляем пустой массив тестов учителя
        setQuizzes([]);
      }
      
    } catch (error) {
      console.error('Error loading quizzes:', error);
      setError('Ошибка загрузки тестов');
      toast.error('Ошибка', 'Не удалось загрузить тесты');
    } finally {
      setLoading(false);
    }
  }, [user, setLoading, setError, setQuizzes, setAvailableQuizzes, toast]);

  // Сохранение теста
  const saveQuiz = useCallback(async (
    quizData: QuizFormData,
    questions: Question[] = [],
    editingQuiz?: Quiz | null
  ) => {
    if (!user) {
      toast.error('Ошибка', 'Пользователь не авторизован');
      return false;
    }

    try {
      setLoading(true);
      
      console.log('saveQuiz: Starting save with:', { quizData, questions, editingQuiz });
      
      // Получение school_id
      const { data: profile } = await apiClient.get(`/profiles/${user.id}`);
      console.log('saveQuiz: Profile data:', profile);

      const quiz = {
        title: quizData.title,
        description: quizData.description,
        subject: quizData.subject,
        difficulty_level: quizData.difficulty_level,
        time_limit: quizData.time_limit,
        teacher_id: user.id,
        questions: questions,
        is_published: false,
        school_id: profile?.school_id
      };

      console.log('saveQuiz: Saving quiz:', quiz);

      if (editingQuiz) {
        await apiClient.put(`/quizzes/${editingQuiz.id}`, quiz);
        toast.success('Успешно!', 'Тест обновлен');
      } else {
        await apiClient.post('/quizzes', quiz);
        toast.success('Успешно!', 'Тест создан');
      }
      
      // НЕ перезагружаем тесты автоматически - даем вызывающему коду контроль
      return true;
      
    } catch (error) {
      console.error('Error saving quiz:', error);
      setError('Ошибка при сохранении теста');
      toast.error('Ошибка', 'Не удалось сохранить тест');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, setLoading, toast]);

  // Публикация теста
  const publishQuiz = useCallback(async (quizId: string) => {
    try {
      setLoading(true);
      
      await apiClient.put(`/quizzes/${quizId}`, { is_published: true });
      
      toast.success('Успешно!', 'Тест опубликован');
      await loadQuizzes();
      
    } catch (error) {
      console.error('Error publishing quiz:', error);
      toast.error('Ошибка', 'Не удалось опубликовать тест');
    } finally {
      setLoading(false);
    }
  }, [setLoading, toast, loadQuizzes]);

  // Удаление теста
  const deleteQuiz = useCallback(async (quizId: string) => {
    try {
      setLoading(true);
      
      await apiClient.delete(`/quizzes/${quizId}`);
      
      toast.success('Успешно!', 'Тест удален');
      await loadQuizzes();
      
    } catch (error) {
      console.error('Error deleting quiz:', error);
      toast.error('Ошибка', 'Не удалось удалить тест');
    } finally {
      setLoading(false);
    }
  }, [setLoading, toast, loadQuizzes]);

  // Сохранение результатов теста
  const saveQuizResults = useCallback(async (
    quizId: string,
    teacherId: string,
    totalQuestions: number,
    correctAnswers: number,
    score: number,
    maxScore: number,
    answers: any[]
  ) => {
    if (!user) return;

    try {
      await apiClient.post('/quiz-results', {
        quiz_id: quizId,
        student_id: user.id,
        teacher_id: teacherId,
        total_questions: totalQuestions,
        correct_answers: correctAnswers,
        score: score,
        max_score: maxScore,
        answers: answers,
        completed_at: new Date().toISOString()
      });

      // Обновление статистики пользователя
      try {
        await apiClient.post(`/profiles/${user.id}/increment-tasks`);
      } catch (updateError) {
        console.error('Error updating user stats:', updateError);
      }

      toast.success('Успешно!', 'Результаты теста сохранены');
      
    } catch (error) {
      console.error('Error saving quiz results:', error);
      toast.error('Ошибка', 'Не удалось сохранить результаты');
    }
  }, [user, toast]);

  return {
    loadUserData,
    loadQuizzes,
    saveQuiz,
    publishQuiz,
    deleteQuiz,
    saveQuizResults
  };
};