import React from 'react';
import { useFormField } from './FormField';

interface FormDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export const FormDescription: React.FC<FormDescriptionProps> = ({
  children,
  className = '',
}) => {
  const { descriptionId } = useFormField();

  return (
    <p
      id={descriptionId}
      className={`text-xs text-zinc-400 leading-relaxed ${className}`}
    >
      {children}
    </p>
  );
};
