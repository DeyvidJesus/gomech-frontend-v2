import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { useFormField } from './FormField';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options?: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', options, placeholder, children, disabled, ...props }, ref) => {
    const { id, errorId, descriptionId, hasError } = useFormField();

    const describedBy = [descriptionId, hasError ? errorId : null]
      .filter(Boolean)
      .join(' ') || undefined;

    return (
      <div className="relative flex items-center">
        <select
          ref={ref}
          id={id}
          aria-invalid={hasError}
          aria-describedby={describedBy}
          disabled={disabled}
          className={`w-full appearance-none bg-zinc-950 border rounded-lg pl-3 pr-9 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 transition-colors focus:outline-none focus:ring-1 cursor-pointer ${
            hasError
              ? 'border-rose-500/80 focus:border-rose-500 focus:ring-rose-500/30'
              : 'border-zinc-800 focus:border-indigo-500 focus:ring-indigo-500/30'
          } ${disabled ? 'opacity-50 cursor-not-allowed bg-zinc-900' : ''} ${className}`}
          {...props}
        >
          {placeholder && (
            <option value="" disabled className="bg-zinc-900 text-zinc-500">
              {placeholder}
            </option>
          )}
          {options
            ? options.map((opt) => (
                <option
                  key={opt.value}
                  value={opt.value}
                  disabled={opt.disabled}
                  className="bg-zinc-900 text-zinc-200"
                >
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        <div className="absolute right-3 text-zinc-400 pointer-events-none flex items-center">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>
    );
  }
);

Select.displayName = 'Select';
