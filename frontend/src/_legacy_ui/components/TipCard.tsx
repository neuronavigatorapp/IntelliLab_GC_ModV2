import React from 'react';
import { Card, CardContent } from './ui/card';
import { Lightbulb } from 'lucide-react';
import { cn } from '../lib/utils';

interface TipCardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const TipCard: React.FC<TipCardProps> = ({ 
  title = "Tip", 
  children, 
  className 
}) => {
  return (
    <Card className={cn(
      "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200",
      className
    )}>
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <Lightbulb className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-blue-900 mb-1">
              {title}
            </h4>
            <p className="text-sm text-blue-800">
              {children}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
