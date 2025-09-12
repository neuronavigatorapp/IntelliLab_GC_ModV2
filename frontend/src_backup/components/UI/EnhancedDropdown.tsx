import React from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Box,
  Typography
} from '@mui/material';

interface EnhancedDropdownProps {
  label: string;
  value: string | number;
  onChange: (value: string | number) => void;
  options: Array<{
    value: string | number;
    label: string;
    description?: string;
  }>;
  disabled?: boolean;
  fullWidth?: boolean;
}

export const EnhancedDropdown: React.FC<EnhancedDropdownProps> = ({
  label,
  value,
  onChange,
  options,
  disabled = false,
  fullWidth = true
}) => {
  const handleChange = (event: SelectChangeEvent<string | number>) => {
    onChange(event.target.value);
  };

  return (
    <FormControl 
      fullWidth={fullWidth} 
      sx={{ mb: 3 }}
    >
      <InputLabel 
        sx={{ 
          fontSize: '1.1rem',
          fontWeight: 500 
        }}
      >
        {label}
      </InputLabel>
      <Select
        value={value}
        onChange={handleChange}
        disabled={disabled}
        label={label}
        sx={{
          '& .MuiSelect-select': {
            fontSize: '1.1rem',
            py: 2
          },
          '& .MuiOutlinedInput-notchedOutline': {
            borderWidth: 2
          }
        }}
        MenuProps={{
          PaperProps: {
            sx: {
              maxHeight: 400,
              mt: 1,
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
            }
          },
          MenuListProps: {
            sx: { py: 0 }
          }
        }}
      >
        {options.map((option) => (
          <MenuItem 
            key={option.value} 
            value={option.value}
            sx={{ 
              py: 2,
              borderBottom: '1px solid #f1f5f9',
              '&:hover': {
                bgcolor: 'primary.light',
                color: 'white'
              }
            }}
          >
            <Box>
              <Typography variant="body1" fontWeight={500}>
                {option.label}
              </Typography>
              {option.description && (
                <Typography variant="body2" color="text.secondary">
                  {option.description}
                </Typography>
              )}
            </Box>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default EnhancedDropdown;
