import React, { forwardRef } from 'react';
import { useFormField } from './FormField';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className = '', label, disabled, ...props }, ref) => {
    const { id, errorId, descriptionId, hasError } = useFormField();

    const describedBy = [descriptionId, hasError ? errorId : null]
      .filter(Boolean)
      .join(' ') || undefined;

    return (
      <div className="flex items-center gap-2">
        <input
          ref={ref}
          type="checkbox"
          id={id}
          aria-invalid={hasError}
          aria-describedby={describedBy}
          disabled={disabled}
          className={`w-4 h-4 rounded bg-zinc-950 border text-indigo-600 focus:ring-indigo-500 focus:ring-offset-zinc-900 cursor-pointer ${
            hasError ? 'border-rose-500' : 'border-zinc-700'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
          {...props}
        />
        {label && (
          <label
            htmlFor={id}
            className={`text-xs text-zinc-300 select-none cursor-pointer ${
              disabled ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {label}
          </label>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
