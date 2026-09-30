import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Loading } from '../ui/Loading';

export const AdminRoute: React.FC = () => {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return <Loading message="Checking authorization..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/app" replace />;
  }

  return <Outlet />;
};
