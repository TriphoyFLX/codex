import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../lib/apiClient';
import LoadingScreen from '../components/common/LoadingScreen';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        
        if (!token) {
          navigate('/login');
          return;
        }

        // Decode JWT to get user ID
        const payload = JSON.parse(atob(token.split('.')[1]));
        
        if (!payload.userId) {
          console.error('No user ID in token');
          localStorage.removeItem('auth_token');
          navigate('/login');
          return;
        }

        // Get user profile
        const profileResponse = await apiClient.get(`/profiles/${payload.userId}`);
        const profile = profileResponse.data;
        
        // If no profile or missing username - go to profile creation
        if (!profile || !profile.username) {
          navigate('/create-profile');
        } 
        // If has username but no school - go to school selection
        else if (!profile.school_id) {
          navigate('/select-school');
        } 
        // Otherwise go to main page
        else {
          navigate('/');
        }
      } catch (err) {
        console.error('Error in auth callback:', err);
        localStorage.removeItem('auth_token');
        navigate('/login');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return <LoadingScreen />;
}