import React from 'react';
import { AlertTriangle, Clock, Info } from 'lucide-react';

interface NotificationBadgeProps {
  count: number;
  priority: 'low' | 'medium' | 'high';
  className?: string;
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  count,
  priority,
  className = ''
}) => {
  if (count === 0) return null;

  const getPriorityStyles = () => {
    switch (priority) {
      case 'high':
        return 'bg-red-500 border-red-600 text-white animate-pulse';
      case 'medium':
        return 'bg-yellow-500 border-yellow-600 text-white';
      case 'low':
        return 'bg-blue-500 border-blue-600 text-white';
      default:
        return 'bg-gray-500 border-gray-600 text-white';
    }
  };

  const getIcon = () => {
    switch (priority) {
      case 'high':
        return <AlertTriangle className="w-3 h-3" />;
      case 'medium':
        return <Clock className="w-3 h-3" />;
      case 'low':
        return <Info className="w-3 h-3" />;
    }
  };

  return (
    <div className={`
      inline-flex items-center justify-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border-2 
      ${getPriorityStyles()} 
      ${className}
    `}>
      {getIcon()}
      <span>{count > 99 ? '99+' : count}</span>
    </div>
  );
};