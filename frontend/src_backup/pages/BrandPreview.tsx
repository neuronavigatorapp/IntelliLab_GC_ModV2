import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  Paper,
  Divider,
  Alert
} from '@mui/material';
import { useBranding } from '../components/Shell/BrandingProvider';
import { useImageWithFallbackHandler } from '../utils/useImageWithFallback';

interface LogoDisplayProps {
  size: number;
  label: string;
  useFallback: boolean;
}

const LogoDisplay: React.FC<LogoDisplayProps> = ({ size, label, useFallback }) => {
  const { logoPathPng, logoPathJpg } = useBranding();
  const { src, onError } = useImageWithFallbackHandler(
    useFallback ? logoPathJpg : logoPathPng,
    logoPathJpg
  );

  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {label} ({size}px)
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: size + 20 }}>
          <img
            src={src}
            alt="IntelliLab GC Logo"
            style={{
              width: size,
              height: size,
              objectFit: 'contain',
              maxWidth: '100%'
            }}
            onError={onError}
          />
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 1 }}>
          {useFallback ? 'JPG Fallback' : 'PNG Primary'}
        </Typography>
      </CardContent>
    </Card>
  );
};

const BrandPreview: React.FC = () => {
  const [useFallback, setUseFallback] = useState(false);
  const { logoPathPng, logoPathJpg } = useBranding();

  const sizes = [
    { size: 32, label: 'Small' },
    { size: 48, label: 'Medium' },
    { size: 96, label: 'Large' },
    { size: 192, label: 'Extra Large' },
    { size: 512, label: 'Huge' }
  ];

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h3" component="h1" gutterBottom>
        Brand Preview
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Visual verification of logo display at various sizes with PNG→JPG fallback testing.
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Primary Logo:</strong> {logoPathPng} | <strong>Fallback Logo:</strong> {logoPathJpg}
        </Typography>
      </Alert>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Fallback Test
        </Typography>
        <FormControlLabel
          control={
            <Switch
              checked={useFallback}
              onChange={(e) => setUseFallback(e.target.checked)}
            />
          }
          label="Simulate PNG→JPG fallback (swaps primary source)"
        />
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
          When enabled, all logos will use JPG as primary source to simulate fallback behavior
        </Typography>
      </Paper>

      <Divider sx={{ my: 3 }} />

      <Typography variant="h5" gutterBottom>
        Logo Sizes
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {sizes.map(({ size, label }) => (
          <Grid item xs={12} sm={6} md={4} key={size}>
            <LogoDisplay
              size={size}
              label={label}
              useFallback={useFallback}
            />
          </Grid>
        ))}
      </Grid>

      <Divider sx={{ my: 3 }} />

      <Typography variant="h5" gutterBottom>
        Background Contrast Test
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, backgroundColor: 'var(--brand-surface, #f8fafc)' }}>
            <Typography variant="h6" gutterBottom>
              Brand Surface Background
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 120 }}>
              <img
                src={useFallback ? logoPathJpg : logoPathPng}
                alt="IntelliLab GC Logo"
                style={{
                  width: 96,
                  height: 96,
                  objectFit: 'contain'
                }}
              />
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, backgroundColor: '#ffffff' }}>
            <Typography variant="h6" gutterBottom>
              White Background
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 120 }}>
              <img
                src={useFallback ? logoPathJpg : logoPathPng}
                alt="IntelliLab GC Logo"
                style={{
                  width: 96,
                  height: 96,
                  objectFit: 'contain'
                }}
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Box sx={{ mt: 4, p: 2, backgroundColor: 'background.default', borderRadius: 1 }}>
        <Typography variant="h6" gutterBottom>
          Testing Instructions
        </Typography>
        <Typography variant="body2" component="div">
          <ul>
            <li>Verify logo displays correctly at all sizes</li>
            <li>Test fallback toggle to ensure JPG loads when PNG fails</li>
            <li>Check contrast on both background types</li>
            <li>Ensure alt text is present for accessibility</li>
            <li>Verify logo maintains aspect ratio and quality</li>
          </ul>
        </Typography>
      </Box>
    </Box>
  );
};

export default BrandPreview;
