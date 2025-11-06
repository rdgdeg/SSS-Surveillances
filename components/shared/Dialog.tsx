
import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { X } from 'lucide-react';

interface DialogContextProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const DialogContext = createContext<DialogContextProps | undefined>(undefined);

const useDialogContext = () => {
  const context = useContext(DialogContext);
  if (!context) throw new Error('useDialogContext must be used within a Dialog');
  return context;
};

export const Dialog: React.FC<{ children: ReactNode; open?: boolean; onOpenChange?: (open: boolean) => void }> = ({ children, open, onOpenChange }) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined && onOpenChange !== undefined;

  const isOpen = isControlled ? open : internalOpen;
  const setIsOpen = isControlled ? onOpenChange : setInternalOpen;
  
  return <DialogContext.Provider value={{ isOpen, onOpenChange: setIsOpen }}>{children}</DialogContext.Provider>;
};

export const DialogTrigger: React.FC<{ children: React.ReactElement; asChild?: boolean }> = ({ children, asChild = false }) => {
  const { onOpenChange } = useDialogContext();
  
  const triggerProps = { onClick: () => onOpenChange(true) };
  
  if (asChild) {
    // Fix: Use Object.assign to avoid a potential TypeScript error when spreading generic props.
    return React.cloneElement(children, Object.assign({}, children.props, triggerProps));
  }
  return <div {...triggerProps}>{children}</div>;
};


export const DialogContent: React.FC<{ children: ReactNode; className?: string }> = ({ children, className }) => {
  const { isOpen, onOpenChange } = useDialogContext();
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';

      // Focus trap logic
      const focusableElements = contentRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (focusableElements && focusableElements.length > 0) {
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        firstElement.focus();

        const handleTabKeyPress = (e: KeyboardEvent) => {
            if (e.key !== 'Tab') return;
            
            if (e.shiftKey) { // Shift+Tab
                if (document.activeElement === firstElement) {
                    lastElement.focus();
                    e.preventDefault();
                }
            } else { // Tab
                if (document.activeElement === lastElement) {
                    firstElement.focus();
                    e.preventDefault();
                }
            }
        };

        document.addEventListener('keydown', handleTabKeyPress);
        
        return () => {
          document.removeEventListener('keydown', handleKeyDown);
          document.removeEventListener('keydown', handleTabKeyPress);
          document.body.style.overflow = '';
        };
      }
    }
    
    return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';
    };
  }, [isOpen, onOpenChange]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onMouseDown={() => onOpenChange(false)}>
      <div
        ref={contentRef}
        role="dialog"
        aria-modal="true"
        className={`relative w-full max-w-lg rounded-xl border bg-white text-gray-900 dark:text-gray-50 shadow-lg dark:border-gray-700 dark:bg-gray-800 animate-in fade-in-90 zoom-in-95 ${className}`}
        onMouseDown={e => e.stopPropagation()}
      >
        {children}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-4 right-4 p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="Close dialog"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export const DialogHeader: React.FC<{ children: ReactNode; className?: string }> = ({ children, className }) => (
  <div className={`flex flex-col space-y-1.5 text-center sm:text-left p-6 border-b dark:border-gray-700 ${className}`}>{children}</div>
);

export const DialogTitle: React.FC<{ children: ReactNode; className?: string }> = ({ children, className }) => (
  <h2 className={`text-xl font-semibold leading-none tracking-tight ${className}`}>{children}</h2>
);

export const DialogDescription: React.FC<{ children: ReactNode; className?: string }> = ({ children, className }) => (
  <p className={`text-sm text-muted-foreground text-gray-500 dark:text-gray-400 ${className}`}>{children}</p>
);

export const DialogFooter: React.FC<{ children: ReactNode; className?: string }> = ({ children, className }) => (
  <div className={`flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 p-6 border-t dark:border-gray-700 ${className}`}>{children}</div>
);