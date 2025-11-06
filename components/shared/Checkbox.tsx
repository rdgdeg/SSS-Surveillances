
import React from 'react';

interface CheckboxProps {
  id: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
}

const Checkbox: React.FC<CheckboxProps> = React.memo(({ id, checked, onCheckedChange, className }) => {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={(e) => {
          e.preventDefault(); // Prevent label's default behavior from firing twice
          onCheckedChange(!checked);
      }}
      id={id}
      className={`peer h-5 w-5 shrink-0 rounded-sm border border-indigo-600 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-indigo-400 ${checked ? 'bg-indigo-600 text-white dark:bg-indigo-500' : 'bg-transparent'} ${className}`}
    >
      {checked && (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mx-auto my-auto">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      )}
    </button>
  );
});

export { Checkbox };