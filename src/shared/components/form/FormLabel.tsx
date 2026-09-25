import React from 'react';
import { useFormField } from './FormField';

interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export const FormLabel: React.FC<FormLabelProps> = ({
  required = false,
  className = '',
  children,
  ...props
}) => {
  const { id } = useFormField();

  return (
    <label
      htmlFor={id}
      className={`block text-xs font-semibold text-zinc-300 ${className}`}
      {...props}
    >
      {children}
      {required && <span className="text-rose-400 ml-1" aria-hidden="true">*</span>}
    </label>
  );
};
