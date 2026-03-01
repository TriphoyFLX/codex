import { useState, useEffect } from 'react';
import { LeaderboardEntry, LeaderboardStats, QuizResultForLeaderboard } from '../types/leaderboard.types';
import { apiClient } from "../lib/apiClient";

const LEADERBOARD_KEY = 'codex_leaderboard';
const USER_RESULTS_KEY = 'codex_user_results';

export const useLeaderboard = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [stats, setStats] = useState<LeaderboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Загрузка результатов из базы данных
  const loadResultsFromDatabase = async () => {
    try {
      const response = await apiClient.get('/quiz-results');
      const dbResults = response.data;
      
      // Сохраняем результаты из БД в localStorage для оффлайн доступа
      const userResultsMap = new Map<string, QuizResultForLeaderboard[]>();
      
      dbResults.forEach((result: any) => {
        const userId = result.student_id;
        if (!userResultsMap.has(userId)) {
          userResultsMap.set(userId, []);
        }
        
        userResultsMap.get(userId)?.push({
          user_id: result.student_id,
          username: result.full_name || result.email || 'Unknown',
          quiz_id: result.quiz_id,
          score: result.score,
          max_score: result.max_score,
          completed_at: result.completed_at
        });
      });
      
      // Сохраняем в localStorage
      userResultsMap.forEach((results, userId) => {
        localStorage.setItem(`${USER_RESULTS_KEY}_${userId}`, JSON.stringify(results));
      });
      
      console.log('Loaded results from database:', userResultsMap.size, 'users');
      return true;
    } catch (error) {
      console.error('Error loading results from database:', error);
      return false;
    }
  };

  // Загрузка данных из localStorage
  const loadLeaderboard = () => {
    try {
      const savedData = localStorage.getItem(LEADERBOARD_KEY);
      if (savedData) {
        const data = JSON.parse(savedData);
        setLeaderboard(data);
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    }
  };

  // Сохранение данных в localStorage
  const saveLeaderboard = (data: LeaderboardEntry[]) => {
    try {
      localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving leaderboard:', error);
    }
  };

  // Добавление результата теста
  const addQuizResult = async (result: QuizResultForLeaderboard) => {
    console.log('addQuizResult called with:', result);
    
    // Сначала сохраняем в localStorage
    const existingResults = loadUserResults(result.user_id);
    const updatedResults = [...existingResults, result];
    
    console.log('Existing results for user:', result.user_id, existingResults);
    console.log('Updated results:', updatedResults);
    
    try {
      localStorage.setItem(`${USER_RESULTS_KEY}_${result.user_id}`, JSON.stringify(updatedResults));
      console.log('Saved to localStorage:', `${USER_RESULTS_KEY}_${result.user_id}`);
    } catch (error) {
      console.error('Error saving user results:', error);
    }

    // Затем сохраняем в базу данных
    try {
      await apiClient.post('/quiz-results', {
        quiz_id: result.quiz_id,
        student_id: result.user_id,
        total_questions: 1, // Для заданий считаем как 1 вопрос
        correct_answers: result.score > 0 ? 1 : 0,
        score: result.score,
        max_score: result.max_score,
        answers: [], // Задания не имеют детальных ответов
        completed_at: result.completed_at
      });
      console.log('Saved to database:', result);
    } catch (error) {
      console.error('Error saving to database:', error);
      // Не прерываем выполнение, если сохранение в БД не удалось
    }

    // Обновляем лидерборд в localStorage
    updateLeaderboard();
    
    // Обновляем лидерборд в базе данных
    try {
      await apiClient.post('/leaderboard', {
        student_id: result.user_id,
        total_score: result.score,
        total_quizzes: 1,
        average_score: result.score
      });
      console.log('Updated leaderboard in database');
    } catch (error) {
      console.error('Error updating leaderboard in database:', error);
    }
  };

  // Загрузка результатов пользователя
  const loadUserResults = (userId: string): QuizResultForLeaderboard[] => {
    try {
      const savedData = localStorage.getItem(`${USER_RESULTS_KEY}_${userId}`);
      return savedData ? JSON.parse(savedData) : [];
    } catch (error) {
      console.error('Error loading user results:', error);
      return [];
    }
  };

  // Обновление лидерборда
  const updateLeaderboard = () => {
    console.log('updateLeaderboard called');
    setLoading(true);
    
    try {
      // Получаем все ключи результатов пользователей
      const keys = Object.keys(localStorage).filter(key => key.startsWith(USER_RESULTS_KEY));
      console.log('Found localStorage keys:', keys);
      
      const allResults: QuizResultForLeaderboard[] = [];
      
      keys.forEach(key => {
        try {
          const results = JSON.parse(localStorage.getItem(key) || '[]');
          console.log(`Results for ${key}:`, results);
          allResults.push(...results);
        } catch (error) {
          console.error('Error parsing results for key:', key);
        }
      });

      console.log('All results combined:', allResults);

      // Группируем результаты по пользователям
      const userStats = new Map<string, LeaderboardEntry>();
      
      allResults.forEach(result => {
        const existing = userStats.get(result.user_id);
        
        if (existing) {
          existing.total_points += result.score;
          existing.quizzes_completed += 1;
          existing.average_score = existing.total_points / existing.quizzes_completed;
          existing.last_activity = result.completed_at;
        } else {
          userStats.set(result.user_id, {
            id: result.user_id,
            user_id: result.user_id,
            username: result.username,
            total_points: result.score,
            quizzes_completed: 1,
            average_score: result.score,
            streak: 0,
            last_activity: result.completed_at,
            rank: 0
          });
        }
      });

      console.log('User stats before sorting:', Array.from(userStats.values()));

      // Сортируем и присваиваем ранги
      const sortedEntries = Array.from(userStats.values())
        .sort((a, b) => b.total_points - a.total_points)
        .map((entry, index) => ({
          ...entry,
          rank: index + 1
        }));

      console.log('Sorted leaderboard entries:', sortedEntries);

      setLeaderboard(sortedEntries);
      saveLeaderboard(sortedEntries);
      
      // Обновляем статистику
      updateStats(sortedEntries);
      
    } catch (error) {
      console.error('Error updating leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  // Обновление статистики
  const updateStats = (entries: LeaderboardEntry[]) => {
    if (entries.length === 0) {
      setStats(null);
      return;
    }

    const totalUsers = entries.length;
    const topScore = entries[0]?.total_points || 0;
    const averagePoints = entries.reduce((sum, entry) => sum + entry.total_points, 0) / totalUsers;

    setStats({
      total_users: totalUsers,
      user_rank: 0, // Будет обновлено при получении ID пользователя
      user_points: 0,
      top_score: topScore,
      average_points: Math.round(averagePoints)
    });
  };

  // Получение статистики для конкретного пользователя
  const getUserStats = (userId: string) => {
    const userEntry = leaderboard.find(entry => entry.user_id === userId);
    
    if (!userEntry || !stats) return null;

    return {
      ...stats,
      user_rank: userEntry.rank,
      user_points: userEntry.total_points
    };
  };

  // Получение топ-N игроков
  const getTopPlayers = (limit: number = 10) => {
    return leaderboard.slice(0, limit);
  };

  // Очистка лидерборда (для тестирования)
  const clearLeaderboard = () => {
    try {
      const keys = Object.keys(localStorage).filter(key => 
        key.startsWith(LEADERBOARD_KEY) || key.startsWith(USER_RESULTS_KEY)
      );
      keys.forEach(key => localStorage.removeItem(key));
      setLeaderboard([]);
      setStats(null);
    } catch (error) {
      console.error('Error clearing leaderboard:', error);
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      // Сначала загружаем из localStorage для быстрого отображения
      loadLeaderboard();
      
      // Затем загружаем свежие данные из базы данных
      await loadResultsFromDatabase();
      
      // Обновляем лидерборд с учетом данных из БД
      updateLeaderboard();
    };
    
    initializeData();
  }, []);

  return {
    leaderboard,
    stats,
    loading,
    addQuizResult,
    getUserStats,
    getTopPlayers,
    updateLeaderboard,
    clearLeaderboard,
    loadUserResults
  };
};
