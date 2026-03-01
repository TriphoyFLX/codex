// context/ProfileContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { apiClient } from "../lib/apiClient";

interface ProfileContextType {
  profile: any;
  setProfile: (profile: any) => void;
  saveProfile: (profileData?: any) => Promise<void>;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Загрузка профиля - вынесена в useCallback
  const loadProfile = useCallback(async (userId: string) => {
    if (!userId) return;
    
    try {
      setLoading(true);
      
      const response = await apiClient.get(`/profiles/${userId}`);
      const data = response.data;

      if (data) {
        console.log('ProfileContext: Profile loaded:', data);
        setProfile(data);
      } else {
        console.log('ProfileContext: Profile not found');
        setProfile(null);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Обновление профиля
  const refreshProfile = async () => {
    const token = localStorage.getItem('auth_token');
    console.log('refreshProfile: token exists:', !!token);
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('refreshProfile: userId from token:', payload.userId);
        await loadProfile(payload.userId);
      } catch (error) {
        console.error('Error refreshing profile:', error);
      }
    } else {
      console.log('refreshProfile: no token found');
    }
  };

  // Сохранение профиля
  const saveProfile = async (profileData?: any) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('User not found');

      const payload = JSON.parse(atob(token.split('.')[1]));
      const profileToSave = profileData || profile;
      if (!profileToSave) throw new Error('No profile data to save');

      await apiClient.put(`/profiles/${payload.userId}`, profileToSave);
      
      // Обновляем локальное состояние
      await loadProfile(payload.userId);
    } catch (error) {
      console.error('Error saving profile:', error);
      throw error;
    }
  };

  // Основной useEffect для инициализации
  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      if (!isMounted) return;

      try {
        const token = localStorage.getItem('auth_token');
        
        if (!isMounted) return;
        
        if (!token) {
          // Нет пользователя
          setProfile(null);
          setLoading(false);
          return;
        }

        // Загружаем профиль с небольшой задержкой
        setTimeout(() => {
          if (isMounted) {
            try {
              const payload = JSON.parse(atob(token.split('.')[1]));
              loadProfile(payload.userId);
            } catch (error) {
              console.error('Error parsing token:', error);
              setProfile(null);
              setLoading(false);
            }
          }
        }, 100);
        
      } catch (error) {
        console.error('Initialization error:', error);
        if (isMounted) {
          setProfile(null);
          setLoading(false);
        }
      }
    };

    initialize();

    return () => {
      isMounted = false;
    };
  }, [loadProfile]);

  return (
    <ProfileContext.Provider value={{ 
      profile, 
      setProfile,
      saveProfile,
      loading,
      refreshProfile 
    }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) throw new Error('useProfile must be used within a ProfileProvider');
  return context;
};