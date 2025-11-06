
import React, { createContext, useContext, useState, useRef, ReactNode } from 'react';

interface TooltipContextProps {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  triggerRef: React.RefObject<HTMLElement>;
}

const TooltipContext = createContext<TooltipContextProps | undefined>(undefined);

const useTooltipContext = () => {
  const context = useContext(TooltipContext);
  if (!context) {
    throw new Error('Tooltip components must be used within a TooltipProvider');
  }
  return context;
};

const TooltipProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    return <div>{children}</div>;
}

const Tooltip: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLElement>(null);

  return (
    <TooltipContext.Provider value={{ isOpen, setIsOpen, triggerRef }}>
      <div className="relative inline-block">{children}</div>
    </TooltipContext.Provider>
  );
};

const TooltipTrigger: React.FC<{ children: React.ReactElement; asChild?: boolean }> = ({ children, asChild = false }) => {
  const { setIsOpen, triggerRef } = useTooltipContext();

  const handleMouseEnter = () => setIsOpen(true);
  const handleMouseLeave = () => setIsOpen(false);

  const triggerProps = {
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    ref: triggerRef as React.Ref<any>,
  };

  if (asChild) {
    return React.cloneElement(children, triggerProps);
  }

  return <div {...triggerProps}>{children}</div>;
};


const TooltipContent: React.FC<{ children: ReactNode; className?: string }> = ({ children, className = '' }) => {
  const { isOpen } = useTooltipContext();

  if (!isOpen) return null;

  return (
    <div
      className={`absolute z-10 w-max max-w-xs px-3 py-2 text-sm font-normal text-white bg-gray-900 rounded-lg shadow-sm dark:bg-gray-700 bottom-full left-1/2 -translate-x-1/2 mb-2 ${className}`}
      role="tooltip"
    >
      {children}
      <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-900 dark:border-t-gray-700"></div>
    </div>
  );
};

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
