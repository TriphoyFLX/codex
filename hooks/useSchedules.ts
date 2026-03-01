// src/hooks/useSchedules.ts
import { useEffect, useState, useCallback } from "react";
import { apiClient } from "../lib/apiClient";
import { useProfile } from "../context/ProfileContext";

// Интерфейс остался, но теперь мы ориентируемся на поле 'date'
export interface Schedule {
  id: string;
  course_id?: string;
  day_of_week: number; // Рассчитывается автоматически
  time_start: string;
  time_end: string;
  user_id: string;
  school_id: string;
  date?: string; // Основное поле для фильтрации
}

export function useSchedules(selectedDate: string) {
  const { profile } = useProfile();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSchedules = useCallback(async () => {
    if (!profile?.school_id) {
      setSchedules([]);
      return;
    }
    
    setLoading(true);

    try {
      const response = await apiClient.get('/schedules', {
        params: { 
          school_id: profile.school_id,
          date: selectedDate 
        }
      });
      setSchedules(response.data || []);
    } catch (error) {
      console.error("Ошибка загрузки расписания:", error);
      setSchedules([]);
    }

    setLoading(false);
  }, [profile?.school_id, selectedDate]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  return { schedules, loading, refetchSchedules: fetchSchedules };
}