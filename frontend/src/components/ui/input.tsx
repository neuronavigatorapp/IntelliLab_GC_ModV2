import React from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  hint,
  className,
  id,
  ...props
}) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="space-y-1">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-text-primary"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          'block w-full px-3 py-2 border border-border rounded-md',
          'bg-surface text-text-primary placeholder-text-tertiary',
          'focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'transition-colors duration-200',
          error && 'border-error-500 focus:ring-error-500 focus:border-error-500',
          className
        )}
        {...props}
      />
      {hint && !error && (
        <p className="text-xs text-text-tertiary">{hint}</p>
      )}
      {error && (
        <p className="text-xs text-error-600">{error}</p>
      )}
    </div>
  );
};

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  hint,
  className,
  id,
  ...props
}) => {
  const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="space-y-1">
      {label && (
        <label
          htmlFor={textareaId}
          className="block text-sm font-medium text-text-primary"
        >
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={cn(
          'block w-full px-3 py-2 border border-border rounded-md',
          'bg-surface text-text-primary placeholder-text-tertiary',
          'focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'transition-colors duration-200 resize-none',
          error && 'border-error-500 focus:ring-error-500 focus:border-error-500',
          className
        )}
        {...props}
      />
      {hint && !error && (
        <p className="text-xs text-text-tertiary">{hint}</p>
      )}
      {error && (
        <p className="text-xs text-error-600">{error}</p>
      )}
    </div>
  );
};