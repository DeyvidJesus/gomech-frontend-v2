import React from 'react';
import { AlertCircle } from 'lucide-react';
import { useFormField } from './FormField';

interface FormErrorProps {
  message?: string | null;
  className?: string;
}

export const FormError: React.FC<FormErrorProps> = ({ message, className = '' }) => {
  const { errorId } = useFormField();

  if (!message) return null;

  return (
    <div
      id={errorId}
      role="alert"
      className={`flex items-center gap-1.5 text-xs text-rose-400 font-medium animate-in fade-in-50 duration-150 ${className}`}
    >
      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
};
