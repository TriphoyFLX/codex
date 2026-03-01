import React from 'react';
import { Navigate } from 'react-router-dom';
import { useProfile } from '../context/ProfileContext';

interface AdminRouteProps {
  children: React.ReactNode;
}

const ADMIN_EMAILS = [
  'admin@codex.com',
  'dimon2281337@mail.ru',
  // Добавьте другие админские email здесь
];

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { profile } = useProfile();

  if (!profile) {
    return <Navigate to="/login" replace />;
  }

  // Проверяем email пользователя в списке админов
  if (!ADMIN_EMAILS.includes(profile.email || '')) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default AdminRoute;
