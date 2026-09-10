import React from 'react';

interface FormFieldProps {
  id: string;
  label: string;
  type: 'text' | 'email' | 'password';
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  touched?: boolean;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  disabled?: boolean;
  helperText?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  id,
  label,
  type,
  value,
  onChange,
  onBlur,
  error,
  touched = false,
  placeholder,
  autoComplete,
  required = false,
  disabled = false,
  helperText,
}) => {
  const showError = Boolean(error && touched);
  const errorId = `${id}-error`;

  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold text-gray-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        id={id}
        type={type}
        autoComplete={autoComplete}
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        aria-invalid={showError}
        aria-describedby={showError ? errorId : undefined}
        className={`w-full px-3.5 py-2.5 text-sm border rounded-xl transition focus:outline-none focus:ring-2 ${
          showError
            ? 'border-red-400 bg-red-50/20 focus:border-red-500 focus:ring-red-200'
            : 'border-gray-200 bg-white focus:border-purple-500 focus:ring-purple-500/20'
        } disabled:bg-gray-100 disabled:cursor-not-allowed`}
      />
      {showError ? (
        <p id={errorId} className="mt-1.5 text-xs text-red-600 flex items-center gap-1 font-medium">
          <span aria-hidden="true">•</span>
          {error}
        </p>
      ) : helperText ? (
        <p className="mt-1 text-[11px] text-gray-400">{helperText}</p>
      ) : null}
    </div>
  );
};
