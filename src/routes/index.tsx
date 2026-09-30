import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import { AuthLayout } from '../layouts/AuthLayout';
import { UserLayout } from '../layouts/UserLayout';
import { AdminLayout } from '../layouts/AdminLayout';

// Shared Route Guards
import { ProtectedRoute } from '../components/shared/ProtectedRoute';
import { AdminRoute } from '../components/shared/AdminRoute';
import { PublicOnlyRoute } from '../components/shared/PublicOnlyRoute';

// Pages
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { UserDashboard } from '../pages/UserDashboard';
import { UserProfile } from '../pages/UserProfile';
import { AdminDashboard } from '../pages/AdminDashboard';
import { NotificationSettings } from '../pages/NotificationSettings';
import { DeliveryLogs } from '../pages/DeliveryLogs';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Root redirect */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Public routes (Only accessible when logged out) */}
      <Route element={<PublicOnlyRoute />}>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>
      </Route>

      {/* Authenticated User routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<UserLayout />}>
          <Route path="/app" element={<UserDashboard />} />
          <Route path="/app/profile" element={<UserProfile />} />
        </Route>
      </Route>

      {/* Authenticated Admin routes */}
      <Route element={<AdminRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/notifications" element={<NotificationSettings />} />
          <Route path="/admin/logs" element={<DeliveryLogs />} />
        </Route>
      </Route>

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};
