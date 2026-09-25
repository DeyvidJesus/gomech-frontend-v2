import { forwardRef } from 'react';
import { useFormField } from './FormField';

export interface CurrencyInputProps {
  value?: number;
  onChange?: (value: number) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value = 0, onChange, disabled, className = '', placeholder = 'R$ 0,00' }, ref) => {
    const { id, errorId, descriptionId, hasError } = useFormField();

    const describedBy = [descriptionId, hasError ? errorId : null]
      .filter(Boolean)
      .join(' ') || undefined;

    const formattedValue = (value || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value.replace(/\D/g, '');
      const numValue = Number(rawValue) / 100;
      if (onChange) {
        onChange(numValue);
      }
    };

    return (
      <input
        ref={ref}
        type="text"
        id={id}
        value={value !== undefined ? formattedValue : ''}
        onChange={handleChange}
        placeholder={placeholder}
        aria-invalid={hasError}
        aria-describedby={describedBy}
        disabled={disabled}
        className={`w-full bg-zinc-950 border rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 transition-colors focus:outline-none focus:ring-1 ${
          hasError
            ? 'border-rose-500/80 focus:border-rose-500 focus:ring-rose-500/30'
            : 'border-zinc-800 focus:border-indigo-500 focus:ring-indigo-500/30'
        } ${disabled ? 'opacity-50 cursor-not-allowed bg-zinc-900' : ''} ${className}`}
      />
    );
  }
);

CurrencyInput.displayName = 'CurrencyInput';
