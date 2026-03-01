// src/hooks/useSchool.ts
import { useState, useEffect } from 'react';
import { apiClient } from '../lib/apiClient';
import { useProfile } from '../context/ProfileContext';

interface School {
  id: string;
  name: string;
  city: string;
  address: string;
  verified: boolean;
  created_at: string;
  school_code?: string;
  region?: string;
  school_number?: string;
  teacher_count?: number;
  student_count?: number;
}

export function useSchool() {
  const { profile } = useProfile();
  const [school, setSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSchool = async () => {
    if (!profile?.school_id) {
      setSchool(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get(`/schools/${profile.school_id}`);
      setSchool(response.data);
    } catch (err: any) {
      console.error('Error fetching school:', err);
      setError(err.response?.data?.error || 'Ошибка загрузки школы');
      setSchool(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchool();
  }, [profile?.school_id]);

  const updateSchool = async (updates: Partial<School>) => {
    if (!profile?.school_id || profile.role !== 'admin') {
      throw new Error('Недостаточно прав для обновления школы');
    }

    try {
      await apiClient.put(`/schools/${profile.school_id}`, updates);
      await fetchSchool(); // Обновляем локальные данные
    } catch (err: any) {
      console.error('Error updating school:', err);
      throw err;
    }
  };

  return {
    school,
    loading,
    error,
    refetch: fetchSchool,
    updateSchool,
    hasSchool: !!profile?.school_id,
  };
}