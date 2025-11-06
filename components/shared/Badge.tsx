
import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'destructive' | 'warning';
}

const Badge: React.FC<BadgeProps> = React.memo(({ className, variant = 'default', ...props }) => {
  const variantClasses = {
    default: 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    success: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    destructive: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
  };

  return (
    <div
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent ${variantClasses[variant]} ${className}`}
      {...props}
    />
  );
});

export { Badge };