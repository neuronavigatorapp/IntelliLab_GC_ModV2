import React from 'react';
import { cn } from '../../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className,
  children,
  disabled,
  ...props
}) => {
  const baseStyles = [
    'inline-flex items-center justify-center font-medium transition-all',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'rounded-lg border'
  ];

  const variants = {
    primary: [
      'bg-accent-500 hover:bg-accent-600 text-white',
      'border-accent-500 hover:border-accent-600',
      'focus:ring-accent-300',
      'shadow-sm hover:shadow-md'
    ],
    secondary: [
      'bg-surface-elevated hover:bg-surface-hover text-text-primary',
      'border-border hover:border-border-hover',
      'focus:ring-accent-300'
    ],
    outline: [
      'bg-transparent hover:bg-surface-hover text-text-primary',
      'border-border hover:border-accent-500',
      'focus:ring-accent-300'
    ],
    ghost: [
      'bg-transparent hover:bg-surface-hover text-text-primary',
      'border-transparent',
      'focus:ring-accent-300'
    ],
    danger: [
      'bg-error-500 hover:bg-error-600 text-white',
      'border-error-500 hover:border-error-600',
      'focus:ring-error-300',
      'shadow-sm hover:shadow-md'
    ]
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <button
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};