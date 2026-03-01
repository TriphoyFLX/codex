import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { apiClient } from '../lib/apiClient';
import { useProfile } from './ProfileContext';

interface TaskProgress {
  completedTasks: number[];
  currentXp: number;
  maxXp: number;
}

interface ProgressContextType {
  progress: TaskProgress;
  setProgress: (progress: TaskProgress) => void;
  loading: boolean;
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

export const ProgressProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { profile } = useProfile();
  const [progress, setProgress] = useState<TaskProgress>({
    completedTasks: [],
    currentXp: 0,
    maxXp: 1000
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.id) loadProgress();
  }, [profile]);

  const loadProgress = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/progress', {
        params: { user_id: profile.id }
      });

      if (response.data?.error) {
        throw response.data.error;
      }

      if (!response.data) {
        const createResponse = await apiClient.post('/progress', {
          user_id: profile.id,
          completed_tasks: [],
          current_xp: 0,
          max_xp: 1000
        });

        if (createResponse.data?.error) {
          throw createResponse.data.error;
        }

        setProgress({
          completedTasks: [],
          currentXp: 0,
          maxXp: 1000
        });
      } else {
        setProgress({
          completedTasks: response.data.completed_tasks || [],
          currentXp: response.data.current_xp,
          maxXp: response.data.max_xp
        });
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    } finally {
      setLoading(false);
    }
  };


  return (
    <ProgressContext.Provider
      value={{ progress, setProgress, loading }}
    >
      {children}
    </ProgressContext.Provider>
  );
};

export const useProgress = () => {
  const context = useContext(ProgressContext);
  if (!context) throw new Error('useProgress must be used within a ProgressProvider');
  return context;
};
