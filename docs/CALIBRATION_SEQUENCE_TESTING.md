# Enhanced Calibration, Quantitation & Sequence Testing Guide

This document provides comprehensive testing steps for the enhanced Calibration, Quantitation, and Sequence Runner features in IntelliLab GC with Internal Standards support, outlier detection, and versioning.

## Overview

The enhanced features include:
- **Enhanced Calibration Manager**: Build and fit calibration curves with IS support, outlier detection, and versioning
- **Internal Standards Support**: Response factor calculations and IS-specific quantitation
- **Outlier Detection**: Grubbs test and IQR-based outlier removal
- **Calibration Versioning**: Track and manage multiple calibration versions
- **Enhanced Quantify Run**: Display IS fields and response factors
- **Robust LOD/LOQ**: Enhanced calculation methods from blanks or baseline noise
- **Report Generation**: Export calibrations as CSV, PDF, XLSX, or JSON

## Prerequisites

1. Backend server running on `http://localhost:8000`
2. Frontend application running on `http://localhost:3000`
3. Sample data initialized (run `python backend/init_sample_data.py`)
4. Optional: Install additional dependencies for full functionality:
   - `pip install reportlab pandas matplotlib openpyxl` (for enhanced reporting)

## Manual Test Steps

### 1. Enhanced Calibration Testing

#### 1.1 Access Enhanced Calibration Manager
1. Navigate to `/chromatography/calibration`
2. Verify the page loads with enhanced interface including:
   - Method ID and Instrument ID fields
   - Calibration Mode selector (External/Internal Standard)
   - Outlier Policy selector (None/Grubbs/IQR)
   - Model Type selector with weighted options
   - Version management panel

#### 1.2 Build External Standard Calibration
1. Enter Method ID: `1`
2. Enter Instrument ID: `1` (optional)
3. Enter Target Name: `Benzene`
4. Select Calibration Mode: `External Standard`
5. Select Model Type: `Linear`
6. Select Outlier Policy: `Grubbs Test`
7. Click "Add Level" to add calibration levels
8. Fill in the following levels:
   - Level 1: Amount: `1.0`, Unit: `ppm`, Peak Name: `Benzene`, Area: `150.5`, RT: `8.5`
   - Level 2: Amount: `5.0`, Unit: `ppm`, Peak Name: `Benzene`, Area: `750.2`, RT: `8.5`
   - Level 3: Amount: `10.0`, Unit: `ppm`, Peak Name: `Benzene`, Area: `1500.8`, RT: `8.5`
   - Level 4: Amount: `20.0`, Unit: `ppm`, Peak Name: `Benzene`, Area: `2950.0`, RT: `8.5` (Outlier)
   - Level 5: Amount: `50.0`, Unit: `ppm`, Peak Name: `Benzene`, Area: `7450.0`, RT: `8.5`
9. Click "Fit Calibration"
10. Verify the fit results dialog appears with:
    - Slope and intercept values
    - R² value (should be near 0.99)
    - LOD and LOQ values with calculation method
    - Number of excluded outliers
    - Calibration curve chart
    - Residuals plot with outliers highlighted
11. Click "Activate Calibration"

#### 1.3 Build Internal Standard Calibration
1. Reset the form or start a new calibration
2. Enter Target Name: `Toluene`
3. Select Calibration Mode: `Internal Standard`
4. Configure Internal Standard:
   - IS Peak Name: `Toluene-d8`
   - IS Amount: `10.0`
   - IS Unit: `ppm`
5. Select Model Type: `Linear`
6. Select Outlier Policy: `IQR Method`
7. Add calibration levels with IS areas:
   - Level 1: Amount: `1.0`, Unit: `ppm`, Area: `200.0`, IS Area: `1000.0`
   - Level 2: Amount: `5.0`, Unit: `ppm`, Area: `1000.0`, IS Area: `1050.0`
   - Level 3: Amount: `10.0`, Unit: `ppm`, Area: `2100.0`, IS Area: `980.0`
   - Level 4: Amount: `20.0`, Unit: `ppm`, Area: `4050.0`, IS Area: `1020.0`
8. Click "Fit Calibration"
9. Verify IS-specific results:
    - Response factors are calculated and displayed
    - Chart shows RF vs concentration (not raw areas)
    - Internal standard configuration is shown in results

#### 1.4 Test Outlier Detection
1. Create a calibration with intentional outliers
2. Test different outlier policies:
   - None: No points excluded
   - Grubbs: Statistical outlier detection
   - IQR: Interquartile range method
3. Verify excluded points are:
   - Marked as excluded in the levels table
   - Highlighted in residuals plot
   - Reported in fit results summary
   - Not used in final calibration curve

#### 1.5 Test Calibration Versioning
1. Create multiple calibrations for the same target
2. Verify version list shows all created calibrations
3. Test activation of different versions
4. Check that only one calibration can be active at a time
5. Verify version metadata (creation date, version ID)

#### 1.6 Test Calibration Validation
1. Click "Validate" on an existing calibration
2. Verify validation dialog shows:
   - Overall status (pass/warning/fail)
   - R² acceptance criteria
   - Point count validation
   - Quality warnings and errors
   - Recommendations for improvement

#### 1.7 Test Enhanced Export Features
1. Test CSV export:
   - Click "Export CSV" on a calibration
   - Verify file contains all calibration metadata
   - Check IS configuration is included (if applicable)
   - Verify outlier information is present
2. Test PDF export:
   - Click "Export PDF" on a calibration
   - Verify formatted report with plots
   - Check metadata table is complete
   - Verify residuals plot is included
3. Test other formats (XLSX, JSON) if available

### 2. Enhanced Quantitation Testing

#### 2.1 Access Enhanced Quantify Run
1. Navigate to `/chromatography/quantify`
2. Verify the enhanced interface shows mode-specific columns

#### 2.2 Test External Standard Quantitation
1. Select a run and external standard calibration
2. Click "Quantitate Run"
3. Verify results table shows:
   - Mode indicator (Ext)
   - Standard area and response columns
   - Concentration calculations
   - Appropriate flags (<LOD, <LOQ, OOR, NoPeak)

#### 2.3 Test Internal Standard Quantitation
1. Select a run and internal standard calibration
2. Click "Quantitate Run"
3. Verify results table shows:
   - Mode indicator (IS)
   - Target area and IS area columns
   - Response factor calculations
   - IS-specific flags (NoISPeak in addition to standard flags)
4. Check that missing IS peaks are properly flagged

#### 2.4 Test Enhanced Flags
Verify new flag types appear correctly:
- `NoISPeak`: When internal standard peak is not found
- Enhanced `<LOD`/`<LOQ`: Based on improved calculation methods
- Proper flag colors and icons

### 3. Performance Testing

#### 3.1 Large Calibration Sets
1. Create calibration with 15+ levels
2. Test outlier detection performance
3. Verify UI remains responsive
4. Check export functionality with large datasets

#### 3.2 Multiple Version Management
1. Create 10+ calibration versions
2. Test version switching performance
3. Verify memory usage remains stable

### 4. API Testing

#### 4.1 Enhanced Calibration Endpoints
Test the enhanced API endpoints:

```bash
# Enhanced fit calibration with IS support
POST /api/v1/calibration/fit
{
  "method_id": 1,
  "instrument_id": 1,
  "target_name": "Benzene",
  "model_type": "linear",
  "mode": "internal_standard",
  "internal_standard": {
    "peak_name": "Toluene-d8",
    "amount": 10.0,
    "unit": "ppm"
  },
  "outlier_policy": "grubbs",
  "levels": [...]
}

# List calibration versions
GET /api/v1/calibration/versions?method_id=1&target_name=Benzene

# Activate specific calibration
POST /api/v1/calibration/activate
{
  "calibration_id": "calibration_uuid"
}

# Get residuals data
GET /api/v1/calibration/{calibration_id}/residuals

# Validate calibration
GET /api/v1/calibration/{calibration_id}/validation

# Export calibration
GET /api/v1/calibration/{calibration_id}/export?format=pdf
```

#### 4.2 Enhanced Quantitation API
```bash
# Quantitate with IS support (automatic mode detection)
POST /api/v1/quant/
{
  "run_id": 1,
  "calibration_id": "calibration_uuid"
}
```

### 5. Backend Unit Tests

#### 5.1 Run Quantification Service Tests
```bash
cd backend
python -m pytest tests/test_quant_service.py -v
```

Expected test coverage:
- ✅ External standard linear calibration
- ✅ Internal standard calibration with response factors
- ✅ Grubbs outlier detection
- ✅ IQR outlier detection
- ✅ LOD/LOQ calculation from blanks
- ✅ LOD/LOQ calculation from baseline
- ✅ Weighted calibration fitting
- ✅ Quantitation with external standard
- ✅ Quantitation with internal standard
- ✅ Calibration versioning
- ✅ Activation and retrieval
- ✅ Linear through zero model
- ✅ Error handling for insufficient data

#### 5.2 Run Frontend Component Tests
```bash
cd frontend
npm test -- CalibrationManager.test.tsx
```

Expected test coverage:
- ✅ Component rendering
- ✅ Mode switching (external/IS)
- ✅ Outlier policy selection
- ✅ Level management
- ✅ Fit button state management
- ✅ API integration
- ✅ Validation dialog
- ✅ Export functionality
- ✅ Form reset

### 6. Integration Testing

#### 6.1 End-to-End Workflow with IS
1. Create IS calibration using CalibrationManager
2. Verify IS configuration is saved correctly
3. Quantitate samples using IS calibration
4. Verify response factors are calculated correctly
5. Export complete workflow results

#### 6.2 Outlier Handling Workflow
1. Create calibration with known outliers
2. Test different outlier detection methods
3. Verify excluded points don't affect quantitation
4. Export calibration with outlier information

#### 6.3 Version Management Workflow
1. Create multiple calibration versions
2. Switch between versions
3. Verify quantitation uses correct active version
4. Test version export and metadata

## Expected Results

### Enhanced Calibration
- ✅ Both external and internal standard modes work correctly
- ✅ Outlier detection identifies and excludes problematic points
- ✅ R² improves after outlier removal
- ✅ Calibration versioning tracks all changes
- ✅ Validation provides meaningful quality assessment
- ✅ Export formats include comprehensive metadata
- ✅ LOD/LOQ calculation methods are documented

### Internal Standard Support
- ✅ Response factors are calculated correctly
- ✅ IS peak areas are tracked and displayed
- ✅ Missing IS peaks are properly flagged
- ✅ Quantitation accounts for IS variations

### Outlier Detection
- ✅ Grubbs test identifies statistical outliers
- ✅ IQR method flags extreme values
- ✅ Excluded points are clearly marked
- ✅ Calibration quality improves after exclusion

### Enhanced Quantitation
- ✅ Mode-specific columns display correctly
- ✅ IS quantitation shows response factors
- ✅ Enhanced flags provide better diagnostics
- ✅ Results export includes all mode-specific data

## Acceptance Checklist

- [ ] **External calibration**: Linear fit with R² > 0.99
- [ ] **Internal standard calibration**: Response factors calculated correctly
- [ ] **Outlier detection**: Problematic points identified and excluded
- [ ] **Calibration versioning**: Multiple versions managed correctly
- [ ] **LOD/LOQ calculation**: Enhanced methods provide accurate limits
- [ ] **Quantitation modes**: Both external and IS modes work correctly
- [ ] **Enhanced UI**: Mode-specific fields display appropriately
- [ ] **Export functionality**: All formats include comprehensive data
- [ ] **Validation**: Quality metrics provide meaningful feedback
- [ ] **API integration**: Backend and frontend communicate correctly
- [ ] **Unit tests**: All backend tests pass
- [ ] **Component tests**: Frontend tests pass
- [ ] **Performance**: Large datasets handled efficiently
- [ ] **Error handling**: Edge cases handled gracefully

## Troubleshooting

### Common Issues

1. **IS calibration fails**
   - Check that IS areas are provided for all levels
   - Verify IS peak name is configured
   - Ensure IS areas are non-zero

2. **Outlier detection too aggressive**
   - Try different outlier policies
   - Check if data quality is poor
   - Verify sufficient calibration points remain

3. **Version confusion**
   - Check which calibration is currently active
   - Verify version timestamps and metadata
   - Use validation to assess calibration quality

4. **Export fails**
   - Check backend dependencies are installed
   - Verify calibration data is complete
   - Try different export formats

### Debug Steps

1. Check enhanced API endpoints are accessible
2. Verify backend unit tests pass
3. Check calibration validation results
4. Review outlier detection summaries
5. Test with known good calibration data

## Success Criteria

All enhanced features should work with:
- ✅ No errors in console or backend logs
- ✅ Both calibration modes function correctly
- ✅ Outlier detection improves calibration quality
- ✅ Version management works seamlessly
- ✅ Enhanced quantitation displays correct information
- ✅ Export functionality provides comprehensive reports
- ✅ Performance remains acceptable with large datasets
- ✅ All unit and component tests pass