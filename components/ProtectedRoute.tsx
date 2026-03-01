// components/ProtectedRoute.tsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useProfile } from '../context/ProfileContext';
import LoadingScreen from './common/LoadingScreen';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireTeacher?: boolean;
}

export default function ProtectedRoute({ children, requireTeacher = false }: ProtectedRouteProps) {
  const location = useLocation();
  const { profile, loading } = useProfile();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!profile) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!profile.username) {
    return <Navigate to="/create-profile" replace />;
  }

  // Для маршрутов, требующих школу
  if (!requireTeacher && !profile.school_id) {
    return <Navigate to="/select-school" replace />;
  }

  if (requireTeacher && profile.role !== 'teacher') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}