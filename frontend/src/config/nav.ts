/**
 * Navigation Configuration for Blue Lab UI
 * Complete mapping of all tools and calculators to their exact endpoints
 */

export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: string;
  endpoint?: string;
  method?: 'GET' | 'POST';
  description?: string;
}

export interface NavSection {
  id: string;
  title: string;
  items: NavItem[];
}

export const navigationConfig: NavSection[] = [
  {
    id: 'main',
    title: 'Main',
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        path: '/',
        icon: 'home',
        description: 'Main dashboard and overview'
      },
      {
        id: 'sandbox',
        label: 'Sandbox',
        path: '/sandbox',
        icon: 'test-tube',
        description: 'Interactive GC simulation environment'
      },
      {
        id: 'troubleshooter',
        label: 'Troubleshooter',
        path: '/troubleshooter',
        icon: 'bot',
        description: 'AI-powered diagnostic assistant'
      }
    ]
  },
  {
    id: 'simulators',
    title: 'Simulators',
    items: [
      {
        id: 'detection-limit',
        label: 'Detection Limit',
        path: '/simulators/detection-limit',
        icon: 'target',
        endpoint: '/api/detection-limits/calculate',
        method: 'POST',
        description: 'Calculate method detection limits with statistical validation'
      },
      {
        id: 'oven-ramp',
        label: 'Oven Ramp',
        path: '/simulators/oven-ramp',
        icon: 'thermometer',
        description: 'Design optimal temperature programming'
      },
      {
        id: 'inlet-simulator',
        label: 'Inlet Simulator',
        path: '/simulators/inlet',
        icon: 'flask',
        description: 'Model injection parameters and sample introduction'
      }
    ]
  },
  {
    id: 'core-calculations',
    title: 'Core Calculation Tools',
    items: [
      {
        id: 'split-ratio',
        label: 'Split Ratio Calculator',
        path: '/tools/split-ratio',
        icon: 'calculator',
        endpoint: '/api/split-ratio/calculate',
        method: 'POST',
        description: 'Calculate GC inlet split ratio parameters'
      },
      {
        id: 'chromatogram-simulator',
        label: 'Chromatogram Simulator',
        path: '/tools/chromatogram',
        icon: 'line-chart',
        endpoint: '/api/chromatogram/simulate',
        method: 'POST',
        description: 'Generate synthetic chromatograms for method development'
      }
    ]
  },
  {
    id: 'advanced-analysis',
    title: 'Advanced Analysis',
    items: [
      {
        id: 'chromatogram-vision',
        label: 'Chromatogram Vision AI',
        path: '/analysis/vision',
        icon: 'eye',
        endpoint: '/api/chromatogram/analyze',
        method: 'POST',
        description: 'AI-powered chromatogram image analysis'
      },
      {
        id: 'gc-sandbox',
        label: 'GC Instrument Sandbox',
        path: '/analysis/gc-sandbox',
        icon: 'microscope',
        endpoint: '/api/gc-sandbox/simulate',
        method: 'POST',
        description: 'Complete instrument simulation with realistic detector response'
      }
    ]
  },
  {
    id: 'professional-suite',
    title: 'Professional Suite',
    items: [
      {
        id: 'void-volume',
        label: 'Void Volume',
        path: '/calc/void-volume',
        icon: 'circle',
        endpoint: '/api/calculations/void-volume',
        method: 'GET',
        description: 'Dead volume calculations for column characterization'
      },
      {
        id: 'peak-capacity',
        label: 'Peak Capacity',
        path: '/calc/peak-capacity',
        icon: 'bar-chart',
        endpoint: '/api/calculations/peak-capacity',
        method: 'GET',
        description: 'Theoretical and practical peak capacity determination'
      },
      {
        id: 'backflush-timing',
        label: 'Backflush Timing',
        path: '/calc/backflush-timing',
        icon: 'timer',
        endpoint: '/api/calculations/backflush-timing',
        method: 'POST',
        description: 'Optimize backflush timing for method efficiency'
      }
    ]
  },
  {
    id: 'intelligent-troubleshooting',
    title: 'Intelligent Troubleshooting',
    items: [
      {
        id: 'ai-troubleshooter',
        label: 'AI Troubleshooter System',
        path: '/troubleshooter',
        icon: 'brain',
        description: 'Expert rule engine and interactive chat'
      },
      {
        id: 'inlet-discrimination',
        label: 'Inlet Discrimination',
        path: '/troubleshoot/inlet-discrimination',
        icon: 'filter',
        endpoint: '/api/troubleshooting/inlet/discrimination',
        method: 'POST',
        description: 'Analyze inlet discrimination issues'
      },
      {
        id: 'flashback-detection',
        label: 'Flashback Detection',
        path: '/troubleshoot/flashback',
        icon: 'flame',
        endpoint: '/api/troubleshooting/inlet/flashback',
        method: 'POST',
        description: 'Detect and prevent inlet flashback'
      },
      {
        id: 'column-activity',
        label: 'Column Activity Test',
        path: '/troubleshoot/column-activity',
        icon: 'activity',
        endpoint: '/api/troubleshooting/column/activity-test',
        method: 'POST',
        description: 'Test column activity and performance'
      },
      {
        id: 'fid-sensitivity',
        label: 'FID Sensitivity',
        path: '/troubleshoot/fid-sensitivity',
        icon: 'zap',
        endpoint: '/api/troubleshooting/fid/sensitivity-check',
        method: 'POST',
        description: 'Check FID detector sensitivity'
      },
      {
        id: 'ms-tune',
        label: 'MS Tune Evaluation',
        path: '/troubleshoot/ms-tune',
        icon: 'settings',
        endpoint: '/api/troubleshooting/ms/tune-evaluation',
        method: 'POST',
        description: 'Evaluate mass spectrometer tuning'
      },
      {
        id: 'ecd-standing',
        label: 'ECD Standing Current',
        path: '/troubleshoot/ecd-standing',
        icon: 'radio',
        endpoint: '/api/troubleshooting/ecd/standing-current',
        method: 'POST',
        description: 'Monitor ECD standing current'
      }
    ]
  },
  {
    id: 'data-system',
    title: 'Data & System',
    items: [
      {
        id: 'instruments',
        label: 'Instruments',
        path: '/instruments',
        icon: 'server',
        endpoint: '/api/instruments/list',
        method: 'GET',
        description: 'Instrument registration and fleet management'
      },
      {
        id: 'run-history',
        label: 'Run History',
        path: '/runs',
        icon: 'history',
        endpoint: '/api/runs/history',
        method: 'GET',
        description: 'Analysis run history and tracking'
      },
      {
        id: 'analytics',
        label: 'Analytics',
        path: '/analytics',
        icon: 'trending-up',
        description: 'Compound trends, ghost peaks, and maintenance analytics'
      },
      {
        id: 'ocr-vision',
        label: 'OCR Vision',
        path: '/ocr',
        icon: 'scan',
        endpoint: '/api/ocr/process',
        method: 'POST',
        description: 'Extract data from chromatogram images'
      },
      {
        id: 'validity',
        label: 'Validity',
        path: '/validity',
        icon: 'shield-check',
        description: 'System validation and quality control'
      },
      {
        id: 'settings',
        label: 'Settings',
        path: '/settings',
        icon: 'cog',
        description: 'Application settings and preferences'
      }
    ]
  }
];

// Helper functions
export const findNavItem = (path: string): NavItem | undefined => {
  for (const section of navigationConfig) {
    const item = section.items.find(item => item.path === path);
    if (item) return item;
  }
  return undefined;
};

export const getNavSection = (sectionId: string): NavSection | undefined => {
  return navigationConfig.find(section => section.id === sectionId);
};

export const getAllEndpoints = (): Array<{path: string, endpoint: string, method: string}> => {
  const endpoints: Array<{path: string, endpoint: string, method: string}> = [];
  
  navigationConfig.forEach(section => {
    section.items.forEach(item => {
      if (item.endpoint && item.method) {
        endpoints.push({
          path: item.path,
          endpoint: item.endpoint,
          method: item.method
        });
      }
    });
  });
  
  return endpoints;
};