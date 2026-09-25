import React, { forwardRef } from 'react';
import { useFormField } from './FormField';

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', disabled, ...props }, ref) => {
    const { id, errorId, descriptionId, hasError } = useFormField();

    const describedBy = [descriptionId, hasError ? errorId : null]
      .filter(Boolean)
      .join(' ') || undefined;

    return (
      <textarea
        ref={ref}
        id={id}
        aria-invalid={hasError}
        aria-describedby={describedBy}
        disabled={disabled}
        className={`w-full bg-zinc-950 border rounded-lg p-3 text-xs text-zinc-100 placeholder:text-zinc-500 transition-colors focus:outline-none focus:ring-1 resize-y ${
          hasError
            ? 'border-rose-500/80 focus:border-rose-500 focus:ring-rose-500/30'
            : 'border-zinc-800 focus:border-indigo-500 focus:ring-indigo-500/30'
        } ${disabled ? 'opacity-50 cursor-not-allowed bg-zinc-900' : ''} ${className}`}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';
