// src/components/SchoolProtectedRoute.tsx
import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LoadingScreen from './common/LoadingScreen';

interface SchoolProtectedRouteProps {
  children: React.ReactNode;
  requireTeacher?: boolean;
}

export default function SchoolProtectedRoute({ 
  children, 
  requireTeacher = false 
}: SchoolProtectedRouteProps) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!loading) {
      // Логика для отладки
      console.log('SchoolProtectedRoute:', {
        user: !!user,
        profile: profile,
        schoolId: profile?.school_id,
        requireTeacher,
        profileRole: profile?.role
      });
    }
  }, [user, profile, loading, requireTeacher]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!profile) {
    return <Navigate to="/create-profile" replace />;
  }

  if (!profile.school_id) {
    return <Navigate to="/select-school" replace />;
  }

  if (requireTeacher && profile.role !== 'teacher') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}