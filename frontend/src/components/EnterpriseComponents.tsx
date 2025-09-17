import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Filter, Download } from 'lucide-react';

// Enterprise-grade data table
interface Column {
  key: string;
  label: string;
  width?: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  format?: (value: any) => string;
}

interface DataTableProps {
  columns: Column[];
  data: Record<string, any>[];
  searchable?: boolean;
  sortable?: boolean;
  pagination?: boolean;
  pageSize?: number;
  onRowClick?: (row: Record<string, any>) => void;
}

export const EnterpriseDataTable: React.FC<DataTableProps> = ({
  columns,
  data,
  searchable = true,
  sortable = true,
  pagination = true,
  pageSize = 10,
  onRowClick
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredData = data.filter(row =>
    Object.values(row).some(value =>
      value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const sortedData = sortColumn
    ? [...filteredData].sort((a, b) => {
        const aValue = a[sortColumn];
        const bValue = b[sortColumn];
        const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        return sortDirection === 'asc' ? comparison : -comparison;
      })
    : filteredData;

  const paginatedData = pagination
    ? sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : sortedData;

  const totalPages = Math.ceil(filteredData.length / pageSize);

  const handleSort = (columnKey: string) => {
    if (!sortable) return;
    
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  return (
    <div className="enterprise-card overflow-hidden">
      {/* Table Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
        <div className="flex items-center justify-between">
          <h3 className="enterprise-h4">Data Analysis Results</h3>
          <div className="flex items-center gap-2">
            {searchable && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search data..."
                  className="enterprise-input pl-10 w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            )}
            <button className="enterprise-btn enterprise-btn-secondary">
              <Filter className="w-4 h-4" />
              Filter
            </button>
            <button className="enterprise-btn enterprise-btn-secondary">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="enterprise-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`cursor-pointer select-none ${column.align ? `text-${column.align}` : 'text-left'}`}
                  style={{ width: column.width }}
                  onClick={() => column.sortable !== false && handleSort(column.key)}
                >
                  <div className="flex items-center gap-2">
                    {column.label}
                    {sortable && column.sortable !== false && (
                      <div className="flex flex-col">
                        <ChevronDown 
                          className={`w-3 h-3 transform transition-colors ${
                            sortColumn === column.key && sortDirection === 'asc'
                              ? 'text-blue-600 rotate-180'
                              : 'text-gray-400'
                          }`} 
                        />
                        <ChevronDown 
                          className={`w-3 h-3 -mt-1 transition-colors ${
                            sortColumn === column.key && sortDirection === 'desc'
                              ? 'text-blue-600'
                              : 'text-gray-400'
                          }`} 
                        />
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, index) => (
              <tr
                key={index}
                className={`transition-colors ${onRowClick ? 'cursor-pointer hover:bg-blue-50' : ''}`}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`${column.align ? `text-${column.align}` : 'text-left'}`}
                  >
                    <div className="enterprise-mono text-sm">
                      {column.format ? column.format(row[column.key]) : row[column.key]}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="enterprise-body-sm text-gray-600">
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredData.length)} of {filteredData.length} results
            </div>
            <div className="flex items-center gap-2">
              <button
                className="enterprise-btn enterprise-btn-secondary"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                Previous
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    className={`px-3 py-1 rounded text-sm ${
                      page === currentPage
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-600 border'
                    }`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                );
              })}
              <button
                className="enterprise-btn enterprise-btn-secondary"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Scientific slider control
interface PrecisionSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  precision?: number;
  onChange: (value: number) => void;
  color?: string;
}

export const PrecisionSlider: React.FC<PrecisionSliderProps> = ({
  label,
  value,
  min,
  max,
  step = 0.1,
  unit = '',
  precision = 1,
  onChange,
  color = '#3b82f6'
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  const percentage = ((value - min) / (max - min)) * 100;

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    handleMouseMove(e);
  };

  const handleMouseMove = (e: React.MouseEvent | MouseEvent) => {
    if (!sliderRef.current) return;
    
    const rect = sliderRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    const newValue = min + (percentage / 100) * (max - min);
    const steppedValue = Math.round(newValue / step) * step;
    onChange(Math.max(min, Math.min(max, steppedValue)));
  };

  useEffect(() => {
    const handleMouseUp = () => setIsDragging(false);
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging) handleMouseMove(e);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="enterprise-data-label">{label}</label>
        <div className="flex items-baseline gap-1">
          <span className="enterprise-data-value text-sm" style={{ color }}>
            {value.toFixed(precision)}
          </span>
          {unit && <span className="enterprise-data-unit text-sm">{unit}</span>}
        </div>
      </div>
      
      <div className="relative">
        <div
          ref={sliderRef}
          className="h-2 bg-gray-200 rounded-full cursor-pointer"
          onMouseDown={handleMouseDown}
        >
          <div
            className="h-full rounded-full transition-all duration-150"
            style={{ 
              width: `${percentage}%`,
              background: `linear-gradient(90deg, ${color}40, ${color})`
            }}
          />
          <div
            className="absolute w-4 h-4 rounded-full border-2 border-white shadow-lg transform -translate-y-1 -translate-x-2 transition-all duration-150 cursor-grab"
            style={{
              left: `${percentage}%`,
              backgroundColor: color,
              transform: `translate(-50%, -25%) scale(${isDragging ? 1.2 : 1})`
            }}
          />
        </div>
        
        <div className="flex justify-between mt-1">
          <span className="enterprise-caption">{min}</span>
          <span className="enterprise-caption">{max}</span>
        </div>
      </div>
    </div>
  );
};

// Professional form component
interface FormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'textarea' | 'checkbox';
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
  validation?: (value: any) => string | null;
  unit?: string;
}

interface EnterpriseFormProps {
  title: string;
  fields: FormField[];
  onSubmit: (data: Record<string, any>) => void;
  onCancel?: () => void;
}

export const EnterpriseForm: React.FC<EnterpriseFormProps> = ({
  title,
  fields,
  onSubmit,
  onCancel
}) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
    
    // Clear error when field is modified
    if (errors[fieldName]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    fields.forEach(field => {
      const value = formData[field.name];
      
      if (field.required && (!value || value === '')) {
        newErrors[field.name] = `${field.label} is required`;
      }
      
      if (field.validation && value) {
        const error = field.validation(value);
        if (error) {
          newErrors[field.name] = error;
        }
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const renderField = (field: FormField) => {
    const value = formData[field.name] || '';
    const hasError = !!errors[field.name];

    switch (field.type) {
      case 'select':
        return (
          <select
            className={`enterprise-input enterprise-select ${hasError ? 'border-red-500' : ''}`}
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
          >
            <option value="">Select {field.label}</option>
            {field.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      
      case 'textarea':
        return (
          <textarea
            className={`enterprise-input min-h-[100px] ${hasError ? 'border-red-500' : ''}`}
            placeholder={field.placeholder}
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
          />
        );
      
      case 'checkbox':
        return (
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => handleFieldChange(field.name, e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="enterprise-body">{field.label}</span>
          </label>
        );
      
      default:
        return (
          <div className="relative">
            <input
              type={field.type}
              className={`enterprise-input ${field.unit ? 'pr-12' : ''} ${hasError ? 'border-red-500' : ''}`}
              placeholder={field.placeholder}
              value={value}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
            />
            {field.unit && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 enterprise-data-unit">
                {field.unit}
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="enterprise-card">
      <div className="p-6 border-b border-gray-200">
        <h3 className="enterprise-h3">{title}</h3>
      </div>
      
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {fields.map(field => (
          <div key={field.name} className="space-y-2">
            {field.type !== 'checkbox' && (
              <label className="enterprise-data-label">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
            )}
            
            {renderField(field)}
            
            {errors[field.name] && (
              <div className="text-red-500 text-sm">{errors[field.name]}</div>
            )}
          </div>
        ))}
        
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
          {onCancel && (
            <button
              type="button"
              className="enterprise-btn enterprise-btn-secondary"
              onClick={onCancel}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="enterprise-btn enterprise-btn-primary"
          >
            Submit Analysis
          </button>
        </div>
      </form>
    </div>
  );
};