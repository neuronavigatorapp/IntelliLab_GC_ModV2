import React from 'react';
import { Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useBranding } from '../Shell/BrandingProvider';

interface IntelliLabLogoProps {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
  variant?: 'full' | 'icon-only';
  useImage?: boolean;
}

export const IntelliLabLogo: React.FC<IntelliLabLogoProps> = ({ 
  size = 'medium', 
  showText = true,
  variant = 'full',
  useImage = true
}) => {
  const theme = useTheme();
  const { logoPath } = useBranding();
  
  const sizes = {
    small: { width: 40, height: 40, fontSize: '1.2rem' },
    medium: { width: 60, height: 60, fontSize: '1.8rem' },
    large: { width: 120, height: 120, fontSize: '2.5rem' }
  };

  const currentSize = sizes[size];

  const LogoIcon = () => {
    if (useImage) {
      return (
        <img
          src={logoPath}
          alt="IntelliLab GC Logo"
          style={{
            width: currentSize.width,
            height: currentSize.height,
            objectFit: 'contain'
          }}
          onError={(event) => {
            const img = event.currentTarget;
            if (img.src.endsWith('.png')) {
              img.src = img.src.replace('.png', '.jpg');
            }
          }}
        />
      );
    }

    return (
      <Box
        sx={{
          width: currentSize.width,
          height: currentSize.height,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <svg
          width={currentSize.width}
          height={currentSize.height}
          viewBox="0 0 120 120"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Column Coil */}
          <g transform="translate(10, 40)">
            <ellipse cx="20" cy="0" rx="15" ry="8" fill="none" stroke="#34495e" strokeWidth="3" opacity="0.8"/>
            <ellipse cx="20" cy="8" rx="15" ry="8" fill="none" stroke="#3498db" strokeWidth="3" opacity="0.9"/>
            <ellipse cx="20" cy="16" rx="15" ry="8" fill="none" stroke="#5dade2" strokeWidth="3"/>
            <ellipse cx="20" cy="24" rx="15" ry="8" fill="none" stroke="#3498db" strokeWidth="3" opacity="0.9"/>
            
            {/* Base line */}
            <line x1="0" y1="32" x2="35" y2="32" stroke="#34495e" strokeWidth="3"/>
            
            {/* Sample dots */}
            <circle cx="45" cy="32" r="2" fill="#3498db"/>
            <circle cx="52" cy="32" r="2.5" fill="#5dade2"/>
            <circle cx="59" cy="32" r="2" fill="#48c9b0"/>
            <circle cx="66" cy="32" r="3" fill="#f39c12"/>
          </g>

          {/* Chromatogram Peaks */}
          <g transform="translate(40, 20)">
            {/* Peak 1 - Blue */}
            <path d="M 20 40 Q 25 10 30 40" fill="none" stroke="#3498db" strokeWidth="4" strokeLinecap="round"/>
            
            {/* Peak 2 - Teal */}
            <path d="M 35 40 Q 42 5 49 40" fill="none" stroke="#48c9b0" strokeWidth="4" strokeLinecap="round"/>
            
            {/* Peak 3 - Orange (tallest) */}
            <path d="M 54 40 Q 64 0 74 40" fill="none" stroke="#f39c12" strokeWidth="5" strokeLinecap="round"/>
          </g>
        </svg>
      </Box>
    );
  };

  if (variant === 'icon-only') {
    return <LogoIcon />;
  }

  return (
    <Box display="flex" alignItems="center" gap={2}>
      <LogoIcon />
      {showText && (
        <Typography
          variant="h4"
          sx={{
            fontSize: currentSize.fontSize,
            fontWeight: 600,
            background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 50%, ${theme.palette.secondary.main} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            letterSpacing: '-0.02em'
          }}
        >
          IntelliLab GC
        </Typography>
      )}
    </Box>
  );
};

export default IntelliLabLogo;
