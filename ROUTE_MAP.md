# Route Map - IntelliLab GC Professional Edition

## Navigation Structure

### Primary Routes (AppShell Navigation)
```
/ (Home)
├── Studio (/chromatogram-analyzer)
├── Troubleshooter (/ai-assistant)
├── Simulators
│   ├── Detection Limit (/detection-limit)
│   ├── Oven Ramp (/oven-ramp)
│   └── Inlet (/inlet-simulator)
├── OCR (/batch-analyzer)
├── Knowledge (/ai-dashboard)
├── Settings (/settings)
└── About / Validity (/about-validity)
```

### Complete Route Mapping

| Page | Route | Status | Description |
|------|-------|--------|-------------|
| **Home** | `/` | ✅ **New** | Professional dashboard with KPI cards, instrument map, feature grid |
| **Studio** | `/chromatogram-analyzer` | 🔄 Legacy | Overlay traces, crosshair readout, export functionality |
| **Troubleshooter** | `/ai-assistant` | 🔄 Legacy | AI-powered diagnostic assistant |
| **Detection Limit** | `/detection-limit` | 🔄 Legacy | Detection limit calculator with presets |
| **Oven Ramp** | `/oven-ramp` | 🔄 Legacy | Oven ramp optimization tool |
| **Inlet Simulator** | `/inlet-simulator` | 🔄 Legacy | Inlet condition simulator |
| **OCR** | `/batch-analyzer` | 🔄 Legacy | Batch chromatogram analysis |
| **Knowledge** | `/ai-dashboard` | 🔄 Legacy | AI analytics dashboard |
| **Settings** | `/settings` | ✅ **New** | API configuration, feature flags, preferences |
| **About/Validity** | `/about-validity` | ✅ **New** | Scorecard, formulas, system health |

### Legacy Routes (Still Available)
```
Core System:
├── /instruments (Instruments management)
├── /methods (Method management)  
├── /runs (Run tracking)
├── /qc-calibration (QC & Calibration)
└── /inventory (Inventory management)

Analysis Tools:
├── /batch-analyzer (Batch ChromaVision)
└── /comparison-tool (Chromatogram comparison)

Additional Calculators:
├── /split-ratio (Split ratio calculator)
├── /splitless-timing (Splitless timing)
├── /pressure-drop (Pressure drop calculator)
├── /column-calculator (Column calculator)
└── /mdl-calculator (MDL calculator)

Simulation:
├── /chromatogram-simulator (Chromatogram simulation)
└── /gc-sandbox (GC instrument sandbox)

Management:
├── /method-development (Method development tracker)
├── /field-reports (Field report generator)
└── /fleet-manager (Fleet management)

Utilities:
├── /swiss-army-knife (Multi-tool utilities)
├── /veteran-tools (Advanced tools)
└── /portfolio (Personal portfolio)

AI Features:
├── /ai-method-optimization (AI method optimization)
├── /predictive-maintenance (Predictive maintenance)
└── /cost-optimization (Cost optimization)

Demo:
└── /demo (Live demonstration)
```

## Navigation Behavior

### Desktop (≥1024px)
- **Left Sidebar:** Always visible, collapsible to icons only
- **Width:** 256px expanded, 64px collapsed
- **Submenu:** Simulators expand/collapse in sidebar

### Tablet (768px - 1023px)  
- **Left Sidebar:** Auto-collapsed to icons
- **Behavior:** Hover to expand temporarily

### Mobile (<768px)
- **Left Sidebar:** Hidden by default
- **Trigger:** Hamburger menu in top bar
- **Behavior:** Overlay with backdrop blur

## Key Features

### Keyboard Navigation
- **⌘/Ctrl + K:** Open command palette
- **Alt + I:** Toggle insights drawer
- **ESC:** Close all panels/modals
- **Tab/Shift+Tab:** Navigate focus
- **Enter/Space:** Activate buttons/links

### Accessibility
- **Focus Management:** Visible focus indicators using `--focus: #93C5FD`
- **ARIA Labels:** Proper labeling throughout
- **Screen Readers:** Semantic HTML structure
- **Color Contrast:** Professional theme meets WCAG guidelines

### Responsive Design
- **Mobile First:** Core functionality on all screen sizes
- **Touch Friendly:** Adequate touch targets (44px minimum)
- **Adaptive Layout:** Content reflows appropriately

## Theme Integration

All routes use the unified professional theme:
- **Background:** `--bg: #101114`
- **Cards:** `--surface: #16181D` with 12px radius
- **Primary:** `--primary-500: #6366F1` (Indigo)
- **Focus:** `--focus: #93C5FD` (Light blue)
- **Shadows:** Subtle elevation using `rgba(0,0,0,0.25)`

## Status Legend
- ✅ **New:** Completely rebuilt with professional design
- 🔄 **Legacy:** Existing functionality, accessible via new navigation
- 📋 **Planned:** Future implementation

## Notes
- All legacy routes remain functional
- New navigation provides cleaner entry points
- Professional theme applied across all pages
- Mobile-responsive throughout
- Zero breaking changes to existing functionality