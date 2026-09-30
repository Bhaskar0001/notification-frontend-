import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Loading } from '../ui/Loading';

export const PublicOnlyRoute: React.FC = () => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return <Loading message="Loading..." />;
  }

  if (isAuthenticated && user) {
    return <Navigate to={user.role === 'ADMIN' ? '/admin' : '/app'} replace />;
  }

  return <Outlet />;
};
