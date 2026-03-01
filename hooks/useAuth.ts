// hooks/useAuth.ts - аутентификация через новый API
import { useState, useEffect } from 'react';
import { apiClient } from "../lib/apiClient";

export const useAuth = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserData = async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // Decode JWT to get user ID
        const payload = JSON.parse(atob(token.split('.')[1]));
        
        if (!payload.userId) {
          console.error('No user ID in JWT payload');
          localStorage.removeItem('auth_token');
          setLoading(false);
          return;
        }

        setUser({ id: payload.userId });

        // Load full user profile
        const profileResponse = await apiClient.get(`/profiles/${payload.userId}`);
        setProfile(profileResponse.data);
      } catch (error) {
        console.error('Error loading user data:', error);
        localStorage.removeItem('auth_token');
        setUser(null);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      const { user: userData, token } = response.data;
      
      localStorage.setItem('auth_token', token);
      setUser(userData);
      
      // Загружаем полный профиль после логина
      try {
        const profileResponse = await apiClient.get(`/profiles/${userData.id}`);
        setProfile(profileResponse.data);
      } catch (error) {
        setProfile(userData);
      }
      
      return { user: userData, error: null };
    } catch (error: any) {
      return { 
        user: null, 
        error: error.response?.data?.error || 'Login failed' 
      };
    }
  };

  const register = async (email: string, password: string, username: string, firstName: string, lastName: string) => {
    try {
      const response = await apiClient.post('/auth/register', { 
        email, 
        password, 
        username, 
        firstName, 
        lastName 
      });
      const { user: userData, token } = response.data;
      
      localStorage.setItem('auth_token', token);
      setUser(userData);
      
      // Загружаем полный профиль после регистрации
      try {
        const profileResponse = await apiClient.get(`/profiles/${userData.id}`);
        setProfile(profileResponse.data);
      } catch (error) {
        setProfile(userData);
      }
      
      return { user: userData, error: null };
    } catch (error: any) {
      return { 
        user: null, 
        error: error.response?.data?.error || 'Registration failed' 
      };
    }
  };

  const signOut = async () => {
    localStorage.removeItem('auth_token');
    setUser(null);
    setProfile(null);
    window.location.href = '/login';
  };

  const getCurrentUser = () => {
    return user;
  };

  return {
    user,
    profile,
    loading,
    login,
    register,
    signOut,
    getCurrentUser,
    isAuthenticated: !!user && !!localStorage.getItem('auth_token')
  };
};