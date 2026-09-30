import React from 'react';
import { Outlet } from 'react-router-dom';
import { Bell } from 'lucide-react';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-blue-600 text-white mb-4 shadow-xs">
          <Bell className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Notification System
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Multi-Channel Notification Management
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-lg sm:px-10">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
