# Brand/Trademark Scrub Report

## Overview
This document tracks the systematic removal of all third-party brand names, logos, and product references from the IntelliLab GC ModV2 repository to ensure compliance and professional presentation.

## Brand References Found

### Instrument Manufacturers
- **Agilent Technologies**: 200+ occurrences across codebase
- **Shimadzu**: 30+ occurrences 
- **Thermo Fisher**: 15+ occurrences
- **Waters**: 5+ occurrences
- **PerkinElmer**: 3+ occurrences

### Column Brands & Models
- **DB-series**: DB-1, DB-5, DB-17, DB-35, DB-624, DB-WAX, DB-Sulfur SCD
- **HP-series**: HP-1, HP-5ms, HP-Innowax, HP-PLOT variants
- **RXi-series**: RXi-5ms
- **Phenomenex**: ZB-WAX
- **Restek**: Stabilwax, RXi-5ms
- **Supelco**: Supelcowax-10

### Detector Models
- Agilent 355/8355 SCD
- Agilent 7890A/B/8890 series
- Model-specific references throughout

## Replacement Strategy

### Neutral Terminology Mapping
```yaml
Brand Names → Neutral Terms:
- "Agilent" → "Instrument Vendor A" / "System A"
- "Shimadzu" → "Instrument Vendor B" / "System B" 
- "Thermo Fisher" → "Instrument Vendor C" / "System C"
- "Waters" → "Instrument Vendor D" / "System D"

Column Names → Generic Terms:
- "DB-1" → "NonPolar-1 (100% Dimethylpolysiloxane)"
- "DB-5" → "MidPolar-5 (5% Phenyl)"
- "DB-17" → "MidPolar-17 (50% Phenyl)"
- "DB-624" → "PolarVOC-624 (6% Cyanopropyl)"
- "HP-5ms" → "MidPolar-5MS"
- "DB-WAX" → "PolarWAX (Polyethylene Glycol)"

Detector Models → Generic Terms:
- "355 SCD" → "SCD-355 Module"
- "8355 SCD" → "SCD-8355 Module"
- "7890A/B" → "GC-7890 Series"
- "8890" → "GC-8890 System"
```

## Files Modified

### Phase 1: Core Backend Files
- [ ] `backend/init_sample_data.py` - Sample data with neutral terms
- [ ] `backend/app/services/stationary_phases.py` - Column database
- [ ] `backend/database.py` - Database schema references
- [ ] `backend/seed_sandbox_data.py` - Test data cleanup

### Phase 2: Frontend Components  
- [ ] `frontend/src/pages/Instruments.tsx` - Instrument selection dropdowns
- [ ] `frontend/src/theme/professionalTheme.ts` - Theme comments
- [ ] Frontend component files with brand references

### Phase 3: Simulation & Analysis Tools
- [ ] `tools/agilent_scd_simulator/` → `tools/scd_simulator/`
- [ ] All SCD simulator files - class names and references
- [ ] Backflush calculator column references
- [ ] Oven ramp visualizer column options

### Phase 4: Documentation & Tests
- [ ] README files and documentation
- [ ] Test files with brand-specific assertions
- [ ] Demo scripts and examples

### Phase 5: Configuration & Scripts
- [ ] Configuration files
- [ ] CI/Build scripts
- [ ] Environment setup scripts

## Brand Guard Implementation

### CI Guard Script: `scripts/brand-guard.js`
```javascript
// Scans for forbidden brand terms
const FORBIDDEN_TERMS = [
  'Agilent', 'Shimadzu', 'Thermo', 'Waters', 'PerkinElmer',
  'DB-[0-9]', 'HP-[0-9]', 'RXi-', // Column patterns
  // Exception patterns for allowed technical terms
];

// Exits with error code if any forbidden terms found
```

### Package.json Integration
```json
{
  "scripts": {
    "brand-guard": "node scripts/brand-guard.js",
    "pre-commit": "npm run brand-guard && npm run lint"
  }
}
```

## Status Tracking

### Completion Metrics
- **Total Files Scanned**: 150+
- **Files with Brand References**: 85+
- **Files Cleaned**: 0/85
- **Guard Implementation**: ✅ Complete

### Priority Order
1. 🔥 **HIGH**: Frontend user-facing components
2. 🔥 **HIGH**: Backend API responses  
3. 🟡 **MEDIUM**: Simulation tools and calculators
4. 🟡 **MEDIUM**: Documentation and examples
5. 🔵 **LOW**: Test files and internal references

## Next Steps
1. Implement brand guard script
2. Start with high-priority frontend components
3. Update backend sample data
4. Refactor simulation tools
5. Clean documentation
6. Validate all references removed

## Notes
- Preserve technical accuracy while using neutral terms
- Maintain column chemistry descriptions for functionality
- Update variable names and class names systematically
- Test all functionality after each phase

## Implementation Update

### ✅ Brand Guard System Complete
- **Created**: `scripts/brand-guard.js` - CI script scanning for forbidden terms
- **Integrated**: npm scripts for automated checking (`npm run brand-guard`)
- **Protected**: Pre-commit hooks prevent brand term reintroduction
- **Tested**: Guards against Agilent, Shimadzu, DB-, HP- patterns

### ✅ Canonical Theme System  
- **Implemented**: Complete visual rebrand using logo color palette
- **Colors**: #181F24 (background), #5B8C92 (primary), #96B59D (accent-mint), #E6933C (accent-orange)
- **Scope**: Layout, sidebar, topbar, home page, component styling
- **Result**: Professional, portfolio-grade visual identity independent of third-party brands

### Next Phase: Content Replacement
Ready to begin systematic replacement of brand references in:
1. Frontend component text and dropdowns
2. Backend sample data and responses  
3. Simulation tools and calculators
4. Documentation and examples

---
*Report generated: ${new Date().toLocaleDateString()}*
*Status: Guard System Complete - Ready for Content Phase*