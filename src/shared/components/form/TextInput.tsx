import React, { forwardRef } from 'react';
import { useFormField } from './FormField';

export interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  ({ className = '', leftIcon, rightIcon, disabled, ...props }, ref) => {
    const { id, errorId, descriptionId, hasError } = useFormField();

    const describedBy = [descriptionId, hasError ? errorId : null]
      .filter(Boolean)
      .join(' ') || undefined;

    return (
      <div className="relative flex items-center">
        {leftIcon && (
          <div className="absolute left-3 text-zinc-400 pointer-events-none flex items-center">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          id={id}
          aria-invalid={hasError}
          aria-describedby={describedBy}
          disabled={disabled}
          className={`w-full bg-zinc-950 border rounded-lg py-2 text-xs text-zinc-100 placeholder:text-zinc-500 transition-colors focus:outline-none focus:ring-1 ${
            leftIcon ? 'pl-9' : 'pl-3'
          } ${rightIcon ? 'pr-9' : 'pr-3'} ${
            hasError
              ? 'border-rose-500/80 focus:border-rose-500 focus:ring-rose-500/30'
              : 'border-zinc-800 focus:border-indigo-500 focus:ring-indigo-500/30'
          } ${disabled ? 'opacity-50 cursor-not-allowed bg-zinc-900' : ''} ${className}`}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 text-zinc-400 pointer-events-none flex items-center">
            {rightIcon}
          </div>
        )}
      </div>
    );
  }
);

TextInput.displayName = 'TextInput';
