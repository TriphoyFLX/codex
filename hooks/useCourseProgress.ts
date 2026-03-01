import { useState, useEffect, useRef } from 'react';

interface CourseProgress {
  id: string;
  user_id: string;
  course_id: string;
  time_spent: number;
  total_time: number;
  progress_percentage: number;
  status: 'active' | 'completed' | 'paused';
  last_accessed_at: string;
  completed_at?: string;
  points_earned: number;
  course_name: string;
}

export function useCourseProgress(
  courseId: string,
  courseName: string
) {
  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Загрузка прогресса
  useEffect(() => {
    const loadProgress = async () => {
      try {
        // Временная заглушка - TODO: реализовать через API
        const mockProgress: CourseProgress = {
          id: 'temp-id',
          user_id: 'temp-user-id',
          course_id: courseId,
          time_spent: 0,
          total_time: 3600,
          progress_percentage: 0,
          status: 'active',
          last_accessed_at: new Date().toISOString(),
          points_earned: 0,
          course_name: courseName
        };
        
        setProgress(mockProgress);
        setElapsedTime(0);
      } catch (err) {
        console.error('Error loading course progress:', err);
        setError(err instanceof Error ? err.message : 'Ошибка загрузки прогресса');
      } finally {
        setLoading(false);
      }
    };

    loadProgress();
  }, [courseId, courseName]);

  // Обновление прогресса
  const updateProgress = async (
    timeSpent: number,
    pointsEarned: number = 0
  ) => {
    // Временная заглушка - TODO: реализовать через API
    console.log('Updating progress:', { timeSpent, pointsEarned });
  };

  // Начать таймер
  const startTimer = () => {
    if (isTimerActive) return;
    setIsTimerActive(true);
  };

  // Поставить таймер на паузу
  const pauseTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsTimerActive(false);
  };

  // Форматирование времени
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Получить оставшееся время
  const getRemainingTime = (): number => {
    if (!progress) return 0;
    return Math.max(progress.total_time - elapsedTime, 0);
  };

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    progress,
    loading,
    error,
    elapsedTime,
    isTimerActive,
    startTimer,
    pauseTimer,
    formatTime,
    getRemainingTime,
    updateProgress
  };
}
