import React from 'react';
import { Badge as UIBadge } from './ui/badge';
import { cn } from '../lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'brand' | 'accent' | 'success' | 'warning';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ 
  children, 
  variant = 'default', 
  className 
}) => {
  return (
    <UIBadge 
      variant={variant} 
      className={cn(
        "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-colors",
        className
      )}
    >
      {children}
    </UIBadge>
  );
};
