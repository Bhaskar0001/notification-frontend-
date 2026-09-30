import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  action,
  icon,
}) => (
  <div className="flex flex-col items-center justify-center p-12 text-center bg-white border border-slate-200 rounded-lg">
    <div className="p-3 bg-slate-50 text-slate-400 rounded-full mb-3">
      {icon || <Inbox className="w-8 h-8" />}
    </div>
    <h4 className="text-base font-semibold text-slate-900 mb-1">{title}</h4>
    <p className="text-sm text-slate-500 max-w-sm mb-4">{description}</p>
    {action}
  </div>
);
