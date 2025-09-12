import React, { createContext, useContext, useEffect, useState } from 'react';
import { brandingAPI } from '../../services/apiService';
import { isWhiteLabelEnabled } from '../../config/featureFlags';

interface ThemeConfig {
  logo_url?: string;
  primary_color?: string;
  accent_color?: string;
  secondary_color?: string;
  typography?: {
    font_family?: string;
    font_size_base?: string;
    font_weight_normal?: string;
    font_weight_bold?: string;
  };
  footer_links?: Array<{ text: string; url: string }>;
  company_name?: string;
  contact_email?: string;
}

interface BrandingContextType {
  theme: ThemeConfig;
  cssVars: Record<string, string>;
  isLoading: boolean;
  error: string | null;
  logoPath: string;
  logoPathPng: string;
  logoPathJpg: string;
  updateTheme: (orgId: number, themeData: Partial<ThemeConfig>) => Promise<void>;
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

export const useBranding = () => {
  const context = useContext(BrandingContext);
  if (!context) {
    throw new Error('useBranding must be used within a BrandingProvider');
  }
  return context;
};

interface BrandingProviderProps {
  children: React.ReactNode;
  orgId?: number;
}

export const BrandingProvider: React.FC<BrandingProviderProps> = ({ 
  children, 
  orgId 
}) => {
  const [theme, setTheme] = useState<ThemeConfig>({});
  const [cssVars, setCssVars] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logoPath, setLogoPath] = useState('/IntelliLab_GC_logo.png');
  const [logoPathPng, setLogoPathPng] = useState('/IntelliLab_GC_logo.png');
  const [logoPathJpg, setLogoPathJpg] = useState('/IntelliLab_GC_logo.jpg');

  // Function to get logo path with fallback
  const getLogoPath = (customLogoUrl?: string) => {
    if (customLogoUrl) {
      return customLogoUrl;
    }
    return '/IntelliLab_GC_logo.png';
  };

  // Function to handle logo load error and fallback to JPG
  const handleLogoError = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const img = event.currentTarget;
    if (img.src.endsWith('.png')) {
      img.src = img.src.replace('.png', '.jpg');
    }
  };

  useEffect(() => {
    if (!isWhiteLabelEnabled()) {
      setIsLoading(false);
      // Set default logo paths for non-white-label mode
      setLogoPath('/IntelliLab_GC_logo.png');
      setLogoPathPng('/IntelliLab_GC_logo.png');
      setLogoPathJpg('/IntelliLab_GC_logo.jpg');
      return;
    }

    const loadTheme = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Load theme configuration
        const themeResponse = await brandingAPI.getTheme(orgId);
        setTheme(themeResponse.data);

        // Set logo paths with fallback
        const newLogoPath = getLogoPath(themeResponse.data.logo_url);
        setLogoPath(newLogoPath);
        setLogoPathPng(newLogoPath.endsWith('.png') ? newLogoPath : newLogoPath.replace('.jpg', '.png'));
        setLogoPathJpg(newLogoPath.endsWith('.jpg') ? newLogoPath : newLogoPath.replace('.png', '.jpg'));

        // Load CSS variables
        const cssResponse = await brandingAPI.getThemeCssVars(orgId);
        setCssVars(cssResponse.data);

        // Apply CSS variables to document root
        const root = document.documentElement;
        Object.entries(cssResponse.data).forEach(([key, value]) => {
          root.style.setProperty(key, value as string);
        });

      } catch (error) {
        console.error('Error loading theme:', error);
        setError('Failed to load theme configuration');
        
        // Apply default theme
        const defaultTheme = {
          logo_url: '/IntelliLab_GC_logo.png',
          primary_color: '#1d4ed8',
          accent_color: '#3b82f6',
          secondary_color: '#64748b',
          typography: {
            font_family: 'Inter, system-ui, sans-serif',
            font_size_base: '16px',
            font_weight_normal: '400',
            font_weight_bold: '600'
          },
          company_name: 'IntelliLab GC',
          contact_email: 'support@intellilab.com'
        };
        
        setTheme(defaultTheme);
        setLogoPath('/IntelliLab_GC_logo.png');
        setLogoPathPng('/IntelliLab_GC_logo.png');
        setLogoPathJpg('/IntelliLab_GC_logo.jpg');
        setCssVars({
          '--primary-color': defaultTheme.primary_color!,
          '--accent-color': defaultTheme.accent_color!,
          '--secondary-color': defaultTheme.secondary_color!,
          '--font-family': defaultTheme.typography!.font_family!,
          '--font-size-base': defaultTheme.typography!.font_size_base!,
          '--font-weight-normal': defaultTheme.typography!.font_weight_normal!,
          '--font-weight-bold': defaultTheme.typography!.font_weight_bold!
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadTheme();
  }, [orgId]);

  const updateTheme = async (orgId: number, themeData: Partial<ThemeConfig>) => {
    if (!isWhiteLabelEnabled()) {
      throw new Error('White-label branding is not enabled');
    }

    try {
      const response = await brandingAPI.updateTheme(orgId, themeData);
      setTheme(response.data);
      
      // Update logo paths if logo_url changed
      if (themeData.logo_url !== undefined) {
        const newLogoPath = getLogoPath(themeData.logo_url);
        setLogoPath(newLogoPath);
        setLogoPathPng(newLogoPath.endsWith('.png') ? newLogoPath : newLogoPath.replace('.jpg', '.png'));
        setLogoPathJpg(newLogoPath.endsWith('.jpg') ? newLogoPath : newLogoPath.replace('.png', '.jpg'));
      }
      
      // Reload CSS variables
      const cssResponse = await brandingAPI.getThemeCssVars(orgId);
      setCssVars(cssResponse.data);
      
      // Apply updated CSS variables
      const root = document.documentElement;
      Object.entries(cssResponse.data).forEach(([key, value]) => {
        root.style.setProperty(key, value as string);
      });
      
    } catch (error) {
      console.error('Error updating theme:', error);
      throw new Error('Failed to update theme');
    }
  };

  const contextValue: BrandingContextType = {
    theme,
    cssVars,
    isLoading,
    error,
    logoPath,
    logoPathPng,
    logoPathJpg,
    updateTheme
  };

  return (
    <BrandingContext.Provider value={contextValue}>
      {children}
    </BrandingContext.Provider>
  );
};

// CSS Variables Component
export const BrandingCSS: React.FC = () => {
  const { cssVars } = useBranding();

  return (
    <style>
      {`
        :root {
          ${Object.entries(cssVars).map(([key, value]) => `${key}: ${value};`).join('\n          ')}
        }
        
        body {
          font-family: var(--font-family, 'Inter, system-ui, sans-serif');
          font-size: var(--font-size-base, 16px);
          font-weight: var(--font-weight-normal, 400);
        }
        
        h1, h2, h3, h4, h5, h6 {
          font-weight: var(--font-weight-bold, 600);
        }
        
        .MuiButton-contained {
          background-color: var(--primary-color, #1d4ed8) !important;
        }
        
        .MuiButton-contained:hover {
          background-color: var(--accent-color, #3b82f6) !important;
        }
        
        .MuiChip-colorPrimary {
          background-color: var(--primary-color, #1d4ed8) !important;
        }
        
        .MuiLinearProgress-colorPrimary {
          background-color: var(--primary-color, #1d4ed8) !important;
        }
        
        .MuiCircularProgress-colorPrimary {
          color: var(--primary-color, #1d4ed8) !important;
        }

        .brand-logo {
          max-height: 48px;
          width: auto;
          object-fit: contain;
        }

        .brand-logo.nav-size {
          max-height: 32px;
        }

        .brand-logo.launcher-size {
          max-height: 64px;
        }
      `}
    </style>
  );
};

// Logo Component
export const BrandedLogo: React.FC<{ 
  size?: 'small' | 'medium' | 'large';
  className?: string;
  onError?: (event: React.SyntheticEvent<HTMLImageElement, Event>) => void;
}> = ({ 
  size = 'medium',
  className = '',
  onError
}) => {
  const { logoPath, theme, isLoading } = useBranding();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const sizeMap = {
    small: { width: 32, height: 32 },
    medium: { width: 48, height: 48 },
    large: { width: 64, height: 64 }
  };

  const dimensions = sizeMap[size];

  const handleError = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const img = event.currentTarget;
    if (img.src.endsWith('.png')) {
      img.src = img.src.replace('.png', '.jpg');
    }
    if (onError) {
      onError(event);
    }
  };

  return (
    <img
      src={logoPath}
      alt={theme.company_name || 'IntelliLab GC'}
      className={`brand-logo ${className}`}
      style={{
        width: dimensions.width,
        height: dimensions.height,
        objectFit: 'contain'
      }}
      onError={handleError}
    />
  );
};

// Company Name Component
export const CompanyName: React.FC = () => {
  const { theme } = useBranding();

  return (
    <span style={{ color: 'var(--primary-color, #1d4ed8)' }}>
      {theme.company_name || 'IntelliLab GC'}
    </span>
  );
};

// Footer Links Component
export const FooterLinks: React.FC = () => {
  const { theme } = useBranding();

  if (!theme.footer_links || theme.footer_links.length === 0) {
    return null;
  }

  return (
    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
      {theme.footer_links.map((link, index) => (
        <a
          key={index}
          href={link.url}
          style={{
            color: 'var(--secondary-color, #64748b)',
            textDecoration: 'none',
            fontSize: '0.875rem'
          }}
        >
          {link.text}
        </a>
      ))}
    </div>
  );
};
