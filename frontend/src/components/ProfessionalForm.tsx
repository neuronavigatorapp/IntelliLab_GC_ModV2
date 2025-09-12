import React from 'react';
import { 
  Box, 
  Grid, 
  TextField, 
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Typography,
} from '@mui/material';

interface FormField {
  id: string;
  label: string;
  type: 'number' | 'text' | 'select' | 'textarea';
  value: string | number;
  step?: string;
  options?: { value: string; label: string }[];
  rows?: number;
  placeholder?: string;
  unit?: string;
}

interface ProfessionalFormProps {
  fields: FormField[];
  onFieldChange: (id: string, value: string | number) => void;
  onSubmit: () => void;
  submitLabel: string;
  submitIcon: React.ReactElement;
  isLoading?: boolean;
  columns?: number;
}

export const ProfessionalForm: React.FC<ProfessionalFormProps> = ({
  fields,
  onFieldChange,
  onSubmit,
  submitLabel,
  submitIcon,
  isLoading = false,
  columns = 2,
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  const renderField = (field: FormField) => {
    const commonProps = {
      fullWidth: true,
      variant: 'outlined' as const,
      margin: 'normal' as const,
    };

    switch (field.type) {
      case 'select':
        return (
          <FormControl {...commonProps} key={field.id}>
            <InputLabel>{field.label}</InputLabel>
            <Select
              value={field.value}
              label={field.label}
              onChange={(e) => onFieldChange(field.id, e.target.value)}
            >
              {field.options?.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );

      case 'textarea':
        return (
          <TextField
            key={field.id}
            {...commonProps}
            label={field.label}
            value={field.value}
            onChange={(e) => onFieldChange(field.id, e.target.value)}
            multiline
            rows={field.rows || 4}
            placeholder={field.placeholder}
          />
        );

      case 'number':
        return (
          <TextField
            key={field.id}
            {...commonProps}
            label={field.unit ? `${field.label} (${field.unit})` : field.label}
            type="number"
            value={field.value}
            onChange={(e) => onFieldChange(field.id, parseFloat(e.target.value) || 0)}
            inputProps={{ step: field.step || '0.1' }}
          />
        );

      default:
        return (
          <TextField
            key={field.id}
            {...commonProps}
            label={field.label}
            value={field.value}
            onChange={(e) => onFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
          />
        );
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Grid 
        container 
        spacing={3} 
        sx={{ 
          marginBottom: '2rem',
          '& .MuiTextField-root': {
            '& .MuiOutlinedInput-root': {
              borderRadius: '8px',
              backgroundColor: '#ffffff',
              '& fieldset': {
                borderColor: '#e0e0e0',
                borderWidth: '2px',
              },
              '&:hover fieldset': {
                borderColor: '#1976d2',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#1976d2',
                boxShadow: '0 0 0 3px rgba(25, 118, 210, 0.1)',
              },
            },
            '& .MuiInputLabel-root': {
              fontWeight: 500,
              color: '#333333',
            },
          },
        }}
      >
        {fields.map((field) => (
          <Grid 
            item 
            xs={12} 
            md={columns === 1 ? 12 : 6} 
            key={field.id}
          >
            {renderField(field)}
          </Grid>
        ))}
      </Grid>

      <Button
        type="submit"
        variant="contained"
        size="large"
        disabled={isLoading}
        startIcon={isLoading ? undefined : submitIcon}
        sx={{
          borderRadius: '8px',
          padding: '0.75rem 2rem',
          fontSize: '1rem',
          fontWeight: 500,
          minWidth: '200px',
          background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
          boxShadow: '0 2px 8px rgba(25, 118, 210, 0.3)',
          textTransform: 'none',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 16px rgba(25, 118, 210, 0.4)',
          },
          '&:disabled': {
            transform: 'none',
            boxShadow: '0 2px 8px rgba(25, 118, 210, 0.1)',
          },
        }}
      >
        {isLoading ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 20,
                height: 20,
                border: '2px solid #ffffff',
                borderTop: '2px solid transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                '@keyframes spin': {
                  '0%': { transform: 'rotate(0deg)' },
                  '100%': { transform: 'rotate(360deg)' },
                },
              }}
            />
            Calculating...
          </Box>
        ) : (
          submitLabel
        )}
      </Button>
    </Box>
  );
};

export default ProfessionalForm;

