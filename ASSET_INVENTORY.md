# IntelliLab GC Complete Asset Inventory

## Overview
This document catalogs all assets found in the IntelliLab GC project, categorized by type and importance for deployment.

## Core Project Assets (Essential for Deployment)

### 1. Project Branding
**Location**: `frontend/public/` and `frontend/build/`
- `IntelliLab_GC_logo.png` - Main PNG logo (2 copies)
- `IntelliLab_GC_logo.jpg` - Main JPG logo (2 copies)
- `logo192.png` - 192x192 app icon (2 copies)
- `logo512.png` - 512x512 app icon (2 copies)

### 2. Progressive Web App (PWA) Configuration
**Location**: `frontend/public/` and `frontend/build/`
- `manifest.json` - Web app manifest
- `manifest.webmanifest` - Alternative manifest format
- `sw.js` - Service worker for offline functionality

### 3. HTML Templates
**Location**: `frontend/public/` and `frontend/build/`
- `index.html` - Main application entry point

### 4. Build Artifacts
**Location**: `frontend/build/static/`
- `asset-manifest.json` - Build asset mapping
- `main.add285ec.js` - Compiled JavaScript bundle
- `main.add285ec.js.LICENSE.txt` - License information
- `main.add285ec.js.map` - Source map for debugging

## Development/Testing Assets

### 5. Test Results
**Location**: `frontend/test-results/`
- Playwright test screenshots (PNG files)
- Test execution videos (WebM files)

## Third-Party Assets (Not Essential for Deployment)

### 6. Node.js Dependencies
**Location**: `frontend/node_modules/`
- Playwright assets (logos, CSS, fonts)
- Material-UI icons and components
- Tailwind CSS framework files
- Various development tool assets

### 7. Python Environment Assets
**Location**: `venv/Lib/site-packages/`
- Matplotlib fonts and images
- Scipy test data files
- Scikit-learn sample images

## Asset Usage Analysis

### Critical Assets (Must Move)
1. **IntelliLab_GC_logo.png/jpg** - Referenced in:
   - React components
   - HTML templates
   - Web app manifest
   
2. **logo192.png/logo512.png** - Referenced in:
   - Web app manifest
   - PWA configuration
   
3. **manifest.json/webmanifest** - Required for:
   - PWA functionality
   - App installation
   - Mobile experience

4. **sw.js** - Required for:
   - Offline functionality
   - Caching strategy
   - PWA features

### Build-Specific Assets
5. **Build artifacts** - Generated during build process:
   - Can be regenerated
   - Environment-specific
   - Should be rebuilt in new location

### Development Assets (Optional)
6. **Test results** - Development artifacts:
   - Not needed for production
   - Useful for debugging
   - Can be regenerated

## Recommended Packing Strategy

### Essential Package (Minimum Required)
```
assets_essential/
├── logos/
│   ├── IntelliLab_GC_logo.png
│   ├── IntelliLab_GC_logo.jpg
│   ├── logo192.png
│   └── logo512.png
├── config/
│   ├── manifest.json
│   ├── manifest.webmanifest
│   └── sw.js
└── templates/
    └── index.html
```

### Complete Package (All Project Assets)
```
assets_complete/
├── ProjectLogos/
├── AppIcons/
├── WebManifests/
├── ServiceWorkers/
├── HTMLTemplates/
├── BuildAssets/
└── TestResults/
```

## Migration Instructions

### For New Environment Setup:
1. Copy essential assets to new project structure
2. Update file paths in configuration files
3. Rebuild application to generate new build artifacts
4. Test PWA functionality
5. Verify all logos and icons display correctly

### Asset Dependencies to Check:
- React component imports referencing logo files
- Manifest file icon paths
- Service worker cache configurations
- HTML template asset references

## File Size Summary
- **Project logos**: ~4 files, estimated 100-500KB total
- **App icons**: ~4 files, estimated 50-200KB total  
- **Config files**: ~6 files, estimated <50KB total
- **Build artifacts**: ~4 files, estimated 1-5MB total
- **Test results**: ~4 files, estimated 1-10MB total

**Total Essential Assets**: ~20 files, estimated 2-6MB
**Total All Assets**: Hundreds of files (including dependencies), 100MB+

## Notes
- Third-party assets (node_modules, venv) should be reinstalled rather than moved
- Build artifacts should be regenerated in the new environment
- Test results are optional and can be excluded from production moves
- Always verify asset paths after moving to ensure proper loading

