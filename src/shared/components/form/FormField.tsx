import React, { createContext, useContext, useId } from 'react';

interface FormFieldContextValue {
  id: string;
  errorId: string;
  descriptionId: string;
  hasError: boolean;
}

const FormFieldContext = createContext<FormFieldContextValue | null>(null);

export function useFormField() {
  const context = useContext(FormFieldContext);
  if (!context) {
    throw new Error('useFormField must be used within a FormField');
  }
  return context;
}

interface FormFieldProps {
  error?: string | null;
  className?: string;
  children: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({
  error,
  className = '',
  children,
}) => {
  const id = useId();
  const errorId = `${id}-error`;
  const descriptionId = `${id}-description`;
  const hasError = Boolean(error);

  return (
    <FormFieldContext.Provider value={{ id, errorId, descriptionId, hasError }}>
      <div className={`space-y-1.5 ${className}`}>
        {children}
      </div>
    </FormFieldContext.Provider>
  );
};
