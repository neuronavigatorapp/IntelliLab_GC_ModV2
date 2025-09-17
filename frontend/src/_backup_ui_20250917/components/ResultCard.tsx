import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { CheckCircle, AlertCircle, Info } from 'lucide-react';
import { cn } from '../lib/utils';

interface ResultCardProps {
  title: string;
  value: string | number;
  unit?: string;
  description?: string;
  status?: 'success' | 'warning' | 'info';
  className?: string;
}

export const ResultCard: React.FC<ResultCardProps> = ({
  title,
  value,
  unit,
  description,
  status = 'success',
  className
}) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-600" />;
      default:
        return <CheckCircle className="h-5 w-5 text-green-600" />;
    }
  };

  const getStatusStyles = () => {
    switch (status) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'info':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-green-200 bg-green-50';
    }
  };

  return (
    <Card className={cn(
      "transition-all duration-200 animate-in slide-in-from-bottom-2",
      getStatusStyles(),
      className
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-gray-900 mb-2">
          {value}
          {unit && <span className="text-lg font-normal text-gray-600 ml-1">{unit}</span>}
        </div>
        {description && (
          <p className="text-sm text-gray-700">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
