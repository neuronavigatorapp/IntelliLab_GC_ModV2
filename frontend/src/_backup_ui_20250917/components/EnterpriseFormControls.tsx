import React, { useState, useRef } from 'react';
import { 
  ChevronDown, 
  Search, 
  Check, 
  AlertCircle, 
  Info, 
  Eye, 
  EyeOff
} from 'lucide-react';
import { cn } from '../lib/utils';

// Enterprise Input Component
interface EnterpriseInputProps {
  label: string;
  type?: 'text' | 'number' | 'email' | 'password' | 'search';
  placeholder?: string;
  value?: string | number;
  onChange?: (value: string | number) => void;
  error?: string;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
  unit?: string;
  precision?: number;
  min?: number;
  max?: number;
  icon?: React.ElementType;
  className?: string;
}

export const EnterpriseInput: React.FC<EnterpriseInputProps> = ({
  label,
  type = 'text',
  placeholder,
  value = '',
  onChange,
  error,
  hint,
  required = false,
  disabled = false,
  unit,
  precision = 2,
  min,
  max,
  icon: Icon,
  className
}) => {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (type === 'number') {
      const numValue = parseFloat(newValue);
      if (!isNaN(numValue)) {
        onChange?.(numValue);
      }
    } else {
      onChange?.(newValue);
    }
  };

  const inputType = type === 'password' && showPassword ? 'text' : type;

  return (
    <div className={cn('space-y-2', className)}>
      {/* Label */}
      <label className="enterprise-data-label block">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Input Container */}
      <div className="relative">
        <div
          className={cn(
            'relative flex items-center',
            'enterprise-input rounded-xl transition-all duration-300',
            'bg-white/80 backdrop-blur-sm border-2',
            focused 
              ? 'border-blue-500 shadow-lg shadow-blue-500/20 bg-white/95'
              : error 
                ? 'border-red-300 shadow-lg shadow-red-500/10'
                : 'border-gray-200 hover:border-gray-300',
            disabled && 'bg-gray-50 cursor-not-allowed opacity-60'
          )}
        >
          {/* Icon */}
          {Icon && (
            <div className="pl-4 pr-2">
              <Icon className={cn(
                'h-5 w-5 transition-colors',
                focused ? 'text-blue-500' : 'text-gray-400'
              )} />
            </div>
          )}

          {/* Input */}
          <input
            ref={inputRef}
            type={inputType}
            value={value}
            onChange={handleChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={placeholder}
            disabled={disabled}
            min={min}
            max={max}
            step={type === 'number' ? Math.pow(10, -precision) : undefined}
            className={cn(
              'flex-1 bg-transparent border-none outline-none',
              'text-gray-900 placeholder-gray-400',
              'font-mono text-sm',
              Icon ? 'pl-0' : 'pl-4',
              unit || type === 'password' ? 'pr-2' : 'pr-4'
            )}
          />

          {/* Unit Display */}
          {unit && (
            <div className="pr-4 text-sm text-gray-500 font-medium">
              {unit}
            </div>
          )}

          {/* Password Toggle */}
          {type === 'password' && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="pr-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          )}
        </div>

        {/* Floating Animation */}
        {focused && (
          <div className="absolute inset-0 -z-10 bg-blue-100/50 rounded-xl opacity-0 animate-fade-in" />
        )}
      </div>

      {/* Error or Hint */}
      {error && (
        <div className="opacity-0 animate-fade-in">
          <div className="flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {hint && !error && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Info className="h-4 w-4" />
          <span>{hint}</span>
        </div>
      )}
    </div>
  );
};

// Enterprise Select Component
interface EnterpriseSelectProps {
  label: string;
  options: Array<{ value: string | number; label: string; disabled?: boolean }>;
  value?: string | number;
  onChange?: (value: string | number) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  searchable?: boolean;
  className?: string;
}

export const EnterpriseSelect: React.FC<EnterpriseSelectProps> = ({
  label,
  options,
  value,
  onChange,
  placeholder = 'Select an option...',
  error,
  required = false,
  disabled = false,
  searchable = false,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [focused, setFocused] = useState(false);

  const filteredOptions = searchable
    ? options.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options;

  const selectedOption = options.find(option => option.value === value);

  const handleSelect = (optionValue: string | number) => {
    onChange?.(optionValue);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className={cn('relative space-y-2', className)}>
      {/* Label */}
      <label className="enterprise-data-label block">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Select Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        disabled={disabled}
        className={cn(
          'w-full flex items-center justify-between',
          'enterprise-input rounded-xl transition-all duration-300',
          'bg-white/80 backdrop-blur-sm border-2 text-left',
          focused || isOpen
            ? 'border-blue-500 shadow-lg shadow-blue-500/20 bg-white/95'
            : error
              ? 'border-red-300 shadow-lg shadow-red-500/10'
              : 'border-gray-200 hover:border-gray-300',
          disabled && 'bg-gray-50 cursor-not-allowed opacity-60'
        )}
      >
        <span className={cn(
          'text-sm',
          selectedOption ? 'text-gray-900 font-medium' : 'text-gray-400'
        )}>
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown className={cn(
          'h-5 w-5 transition-transform duration-200',
          isOpen ? 'rotate-180' : 'rotate-0',
          focused ? 'text-blue-500' : 'text-gray-400'
        )} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="opacity-0 animate-fade-in">
        
            <div className="absolute top-full left-0 right-0 z-50 mt-2">
              <div className="enterprise-glass-card p-2 max-h-64 overflow-y-auto shadow-xl border">
              {/* Search */}
              {searchable && (
                <div className="p-2 border-b border-gray-100">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search options..."
                      className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>
              )}

              {/* Options */}
              <div className="py-1">
                {filteredOptions.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-gray-500 text-center">
                    No options found
                  </div>
                ) : (
                  filteredOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => !option.disabled && handleSelect(option.value)}
                      disabled={option.disabled}
                      className={cn(
                        'w-full flex items-center justify-between px-4 py-3 text-sm text-left',
                        'hover:bg-blue-50 transition-colors duration-150 rounded-lg mx-1',
                        option.value === value && 'bg-blue-100 text-blue-900 font-medium',
                        option.disabled && 'text-gray-400 cursor-not-allowed'
                      )}
                    >
                      <span>{option.label}</span>
                      {option.value === value && (
                        <Check className="h-4 w-4 text-blue-600" />
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Click Outside Handler */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Error */}
      {error && (
        <div className="opacity-0 animate-fade-in">
          <div className="flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Enterprise Range Slider
interface EnterpriseSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  precision?: number;
  disabled?: boolean;
  className?: string;
}

export const EnterpriseSlider: React.FC<EnterpriseSliderProps> = ({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit,
  precision = 1,
  disabled = false,
  className
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Label and Value */}
      <div className="flex items-center justify-between">
        <label className="enterprise-data-label">{label}</label>
        <div className="flex items-baseline gap-1">
          <span className="enterprise-data-value text-lg font-mono">
            {value.toFixed(precision)}
          </span>
          {unit && <span className="enterprise-data-unit">{unit}</span>}
        </div>
      </div>

      {/* Slider Track */}
      <div className="relative">
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          {/* Progress */}
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300 rounded-full"
            style={{ width: `${percentage}%` }}
          />
          
          {/* Glow Effect */}
          {isDragging && (
            <div 
              className="absolute top-0 h-full bg-blue-400 opacity-50 transition-all duration-300 rounded-full blur-sm"
              style={{ width: `${percentage}%` }}
            />
          )}
        </div>

        {/* Slider Input */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />

        {/* Slider Thumb */}
        <div
          className={cn(
            'absolute top-1/2 w-6 h-6 -mt-3 -ml-3 pointer-events-none',
            'bg-white border-2 border-blue-500 rounded-full shadow-lg',
            'transition-all duration-200',
            isDragging ? 'scale-125 shadow-xl shadow-blue-500/25' : 'scale-100',
            disabled && 'border-gray-300 bg-gray-100'
          )}
          style={{ left: `${percentage}%` }}
        />
      </div>

      {/* Min/Max Labels */}
      <div className="flex justify-between text-xs text-gray-500 font-mono">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
};

// Enterprise Button Component
interface EnterpriseButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  icon?: React.ElementType;
  iconPosition?: 'left' | 'right';
  className?: string;
}

export const EnterpriseButton: React.FC<EnterpriseButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  onClick,
  type = 'button',
  icon: Icon,
  iconPosition = 'left',
  className
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30';
      case 'secondary':
        return 'bg-white/80 text-gray-700 border-2 border-gray-200 backdrop-blur-sm hover:bg-white hover:border-gray-300';
      case 'success':
        return 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-500/25 hover:shadow-xl hover:shadow-green-500/30';
      case 'warning':
        return 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white shadow-lg shadow-yellow-500/25 hover:shadow-xl hover:shadow-yellow-500/30';
      case 'danger':
        return 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/30';
      case 'ghost':
        return 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-800';
      default:
        return '';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-4 py-2 text-sm';
      case 'lg':
        return 'px-8 py-4 text-lg';
      case 'xl':
        return 'px-10 py-5 text-xl';
      default:
        return 'px-6 py-3 text-base';
    }
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-3 font-medium rounded-xl',
        'transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-500/20',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'hover:scale-105 active:scale-95',
        getVariantClasses(),
        getSizeClasses(),
        className
      )}
    >
      {loading && (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      
      {Icon && iconPosition === 'left' && !loading && (
        <Icon className="w-5 h-5" />
      )}
      
      {children}
      
      {Icon && iconPosition === 'right' && !loading && (
        <Icon className="w-5 h-5" />
      )}
    </button>
  );
};