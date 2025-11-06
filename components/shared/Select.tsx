import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectContextProps {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  selectedValue: string;
  setSelectedValue: (value: string, label: string) => void;
  selectedLabel: string;
}

const SelectContext = createContext<SelectContextProps | undefined>(undefined);

const useSelectContext = () => {
  const context = useContext(SelectContext);
  if (!context) {
    throw new Error('useSelectContext must be used within a Select provider');
  }
  return context;
};

interface SelectProps {
  children: React.ReactNode;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
  value?: string;
}

const Select: React.FC<SelectProps> = ({ children, onValueChange, defaultValue = '', value }) => {
  const [isOpen, setIsOpen] = useState(false);
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue);
  const selectedValue = isControlled ? value! : internalValue;

  const getLabelForValue = (val: string) => {
    let label = '';
    const contentChild = React.Children.toArray(children).find(
      (child) => React.isValidElement(child) && child.type === SelectContent
    );

    if (contentChild && React.isValidElement(contentChild)) {
      // FIX: Cast `contentChild.props` to access `children` property safely. TypeScript infers `props` as `unknown` in this context.
      React.Children.forEach((contentChild.props as { children: React.ReactNode }).children, (item) => {
        // Fix: Cast item.props to access value and children properties safely.
        if (React.isValidElement(item) && item.type === SelectItem) {
          const props = item.props as { value: string; children: React.ReactNode };
          if (props.value === val) {
            label = typeof props.children === 'string' ? props.children : String(props.children);
          }
        }
      });
    }
    return label;
  };
  
  const [selectedLabel, setSelectedLabel] = useState(() => getLabelForValue(selectedValue));

  useEffect(() => {
    // This effect handles updates when the `value` prop changes in controlled mode,
    // or when the children change dynamically.
    setSelectedLabel(getLabelForValue(selectedValue));
  }, [selectedValue, children]);


  const setSelectedValue = (newValue: string, label: string) => {
    setSelectedLabel(label); // Set label directly from the selected item
    if (!isControlled) {
      setInternalValue(newValue);
    }
    if (onValueChange) {
      onValueChange(newValue);
    }
    setIsOpen(false);
  };
  
  const selectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <SelectContext.Provider value={{ isOpen, setIsOpen, selectedValue, setSelectedValue, selectedLabel }}>
      <div className="relative" ref={selectRef}>
        {children}
      </div>
    </SelectContext.Provider>
  );
};

const SelectTrigger = React.memo(React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(({ className, children, ...props }, ref) => {
  const { isOpen, setIsOpen } = useSelectContext();
  return (
    <button
      ref={ref}
      onClick={() => setIsOpen(!isOpen)}
      className={`flex h-10 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:focus:ring-blue-500 ${className}`}
      {...props}
    >
      {children}
      <ChevronDown className={`h-4 w-4 opacity-50 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
    </button>
  );
}));
SelectTrigger.displayName = "SelectTrigger";


const SelectValue: React.FC<{ placeholder?: string }> = React.memo(({ placeholder }) => {
  const { selectedLabel } = useSelectContext();
  
  if (!selectedLabel && placeholder) {
      return <span className="text-gray-500 dark:text-gray-400">{placeholder}</span>
  }
  
  return <span>{selectedLabel || placeholder}</span>;
});


const SelectContent = React.memo(React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, children, ...props }, ref) => {
  const { isOpen } = useSelectContext();
  if (!isOpen) return null;

  return (
    <div
      ref={ref}
      className={`absolute z-50 mt-1 w-full rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-80 dark:bg-gray-800 dark:border-gray-700 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}));
SelectContent.displayName = "SelectContent";


const SelectItem = React.memo(React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { value: string }>(({ className, children, value, ...props }, ref) => {
  const { setSelectedValue } = useSelectContext();
  const label = typeof children === 'string' ? children : String(children);

  return (
    <div
      ref={ref}
      onClick={() => setSelectedValue(value, label)}
      className={`relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-700 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}));
SelectItem.displayName = "SelectItem";


export { Select, SelectTrigger, SelectContent, SelectItem, SelectValue };