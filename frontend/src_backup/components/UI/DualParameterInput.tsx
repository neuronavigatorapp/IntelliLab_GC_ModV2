import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Slider,
  TextField,
  Grid,
  InputAdornment
} from '@mui/material';

interface DualParameterInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  marks?: Array<{value: number; label: string}>;
  disabled?: boolean;
}

export const DualParameterInput: React.FC<DualParameterInputProps> = ({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit = '',
  marks,
  disabled = false
}) => {
  const [inputValue, setInputValue] = useState(value.toString());

  useEffect(() => {
    setInputValue(value.toString());
  }, [value]);

  const handleSliderChange = (_: Event, newValue: number | number[]) => {
    const val = Array.isArray(newValue) ? newValue[0] : newValue;
    onChange(val);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  const handleInputBlur = () => {
    const numValue = parseFloat(inputValue);
    if (!isNaN(numValue)) {
      const clampedValue = Math.max(min, Math.min(max, numValue));
      onChange(clampedValue);
    } else {
      setInputValue(value.toString());
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleInputBlur();
    }
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
        {label}
      </Typography>
      
      <Grid container spacing={3} alignItems="center">
        <Grid item xs={8}>
          <Slider
            value={value}
            onChange={handleSliderChange}
            min={min}
            max={max}
            step={step}
            marks={marks}
            disabled={disabled}
            sx={{
              '& .MuiSlider-thumb': {
                width: 24,
                height: 24,
                '&:hover': {
                  boxShadow: '0 0 0 8px rgba(29, 78, 216, 0.16)'
                }
              },
              '& .MuiSlider-track': {
                height: 6
              },
              '& .MuiSlider-rail': {
                height: 6,
                opacity: 0.3
              }
            }}
          />
        </Grid>
        
        <Grid item xs={4}>
          <TextField
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyPress={handleKeyPress}
            disabled={disabled}
            size="small"
            type="number"
            InputProps={{
              endAdornment: unit && (
                <InputAdornment position="end">
                  <Typography variant="body2" color="text.secondary">
                    {unit}
                  </Typography>
                </InputAdornment>
              ),
              sx: {
                fontSize: '1.1rem',
                fontWeight: 500
              }
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                '& fieldset': {
                  borderWidth: 2
                }
              }
            }}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default DualParameterInput;
