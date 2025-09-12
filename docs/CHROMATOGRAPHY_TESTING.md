# Chromatography System Testing Guide

## Overview

This document provides comprehensive testing procedures for the IntelliLab GC Chromatography Viewer and Method Runner system. The system includes peak detection, chromatogram simulation, data import/export, and run record management.

## System Components

### Backend Components
- **Schemas**: `RunRecord`, `Peak`, `PeakDetectionRequest`, `ChromatogramSimulationRequest`
- **Service**: `ChromatographyService` with peak detection and simulation algorithms
- **Endpoints**: `/chromatography/*` and `/runs/*` API endpoints

### Frontend Components
- **ChromatogramViewer**: Interactive plot with pan/zoom, peak markers, export
- **PeakTable**: Sortable table with inline editing
- **MethodRunner**: Main page integrating all functionality
- **Utilities**: CSV and JCAMP-DX parsers

## Manual Testing Steps

### 1. Basic Navigation and Setup

**Objective**: Verify the chromatography system is accessible and functional

**Steps**:
1. Open the application
2. Navigate to **Chromatography → Method Runner** from the MasterLauncher
3. Verify the page loads with:
   - Method controls panel on the left
   - Empty chromatogram viewer on the right
   - No error messages

**Expected Result**: Page loads successfully with empty state

### 2. Chromatogram Simulation

**Objective**: Test the chromatogram simulation functionality

**Steps**:
1. In the Method Controls panel:
   - Enter sample name: "Test_Sample_001"
   - Leave Method ID and Instrument ID empty (optional)
2. Click **"Run Simulation"** button
3. Wait for simulation to complete (should take 1-2 seconds)
4. Verify the chromatogram viewer displays:
   - A realistic chromatogram trace
   - Sample name in the title
   - Interactive plot with zoom/pan controls

**Expected Result**: 
- Simulation completes without errors
- Chromatogram displays with realistic peaks
- Plot is interactive and responsive

### 3. Peak Detection

**Objective**: Test automatic peak detection on simulated data

**Steps**:
1. After running simulation (from step 2)
2. Click **"Detect Peaks"** button
3. Wait for peak detection to complete
4. Verify:
   - Peak markers appear on the chromatogram
   - Peak table appears below the viewer
   - Peak statistics are displayed

**Expected Result**:
- Peaks are detected and marked on the plot
- Peak table shows RT, Area, Height, Width, SNR
- Peak count matches the number of visible peaks

### 4. Peak Table Interaction

**Objective**: Test peak table functionality and editing

**Steps**:
1. With peaks detected (from step 3):
   - Click on a peak in the table
   - Verify the peak is highlighted on the plot
   - Click on a peak marker on the plot
   - Verify the corresponding row is selected in the table
2. Test inline editing:
   - Click the edit icon on a peak row
   - Modify the compound name
   - Click save icon
   - Verify the change persists

**Expected Result**:
- Peak selection works bidirectionally
- Inline editing saves changes
- Peak data updates in real-time

### 5. Plot Controls and Export

**Objective**: Test chromatogram viewer controls and export functionality

**Steps**:
1. With a chromatogram loaded:
   - Toggle **"Baseline"** switch - verify baseline line appears/disappears
   - Toggle **"Peaks"** switch - verify peak markers appear/disappear
   - Use zoom controls to zoom in/out
   - Click **"Reset View"** to restore original view
2. Test export:
   - Click **"Export CSV"** button
   - Verify file downloads with chromatogram data
   - Check file contains time and signal columns

**Expected Result**:
- All toggle controls work correctly
- Zoom and pan functionality is smooth
- Export generates valid CSV file

### 6. Data Import (CSV)

**Objective**: Test importing chromatogram data from CSV files

**Steps**:
1. Create a test CSV file with format:
   ```
   time,signal
   0.0,0.1
   0.1,0.2
   0.2,0.5
   ...
   ```
2. Click **"Import"** button
3. Select **"CSV"** file type
4. Choose the test file
5. Click **"Import"**
6. Verify:
   - Chromatogram displays imported data
   - Sample name is set to filename
   - Data points match the CSV

**Expected Result**:
- Import completes successfully
- Chromatogram displays imported data correctly
- No validation errors for valid CSV

### 7. Data Import (JCAMP-DX)

**Objective**: Test importing chromatogram data from JCAMP-DX files

**Steps**:
1. Create a test JCAMP-DX file with XY data
2. Click **"Import"** button
3. Select **"JCAMP-DX"** file type
4. Choose the test file
5. Click **"Import"**
6. Verify chromatogram displays imported data

**Expected Result**:
- Import completes successfully
- JCAMP-DX data is parsed correctly
- Chromatogram displays imported data

### 8. Run Record Management

**Objective**: Test saving and loading run records

**Steps**:
1. With a chromatogram loaded and peaks detected:
   - Click **"Save Run"** button
   - Verify success message or no error
2. Test loading recent runs:
   - Check "Recent Runs" section in controls panel
   - Click on a recent run
   - Verify chromatogram loads with saved data

**Expected Result**:
- Run saves successfully
- Recent runs list updates
- Loading a run restores all data (peaks, baseline, etc.)

### 9. Error Handling

**Objective**: Test error handling for invalid inputs

**Steps**:
1. Try to run simulation without sample name
2. Try to import invalid CSV file
3. Try to import file with insufficient data points
4. Verify appropriate error messages appear

**Expected Result**:
- Clear error messages for invalid inputs
- System remains stable after errors
- Error messages are user-friendly

### 10. Mobile Responsiveness

**Objective**: Test functionality on mobile devices

**Steps**:
1. Open the application on a mobile device or resize browser
2. Navigate to Method Runner
3. Test all functionality:
   - Simulation
   - Peak detection
   - Plot interaction
   - Table scrolling
   - Import/export

**Expected Result**:
- All functionality works on mobile
- UI is properly responsive
- Touch interactions work correctly

## API Testing

### Backend Endpoints

Test the following endpoints using a tool like Postman or curl:

#### Peak Detection
```bash
POST /api/v1/chromatography/detect
Content-Type: application/json

{
  "time": [0.0, 0.1, 0.2, ...],
  "signal": [0.1, 0.2, 0.5, ...],
  "prominence_threshold": 3.0,
  "min_distance": 0.1,
  "noise_window": 50,
  "baseline_method": "rolling_min"
}
```

#### Chromatogram Simulation
```bash
POST /api/v1/chromatography/simulate
Content-Type: application/json

{
  "sample_name": "Test_Sample",
  "include_noise": true,
  "include_drift": false,
  "seed": 12345
}
```

#### Run Records
```bash
# Create run
POST /api/v1/runs/
Content-Type: application/json

{
  "sample_name": "Test_Sample",
  "time": [0.0, 0.1, 0.2, ...],
  "signal": [0.1, 0.2, 0.5, ...],
  "peaks": [...],
  "baseline": [...]
}

# List runs
GET /api/v1/runs/

# Get specific run
GET /api/v1/runs/1
```

## Performance Testing

### Load Testing
1. Test with large datasets (10,000+ data points)
2. Test peak detection on complex chromatograms
3. Test multiple concurrent users

### Memory Testing
1. Monitor memory usage during peak detection
2. Test with very large chromatogram files
3. Verify no memory leaks during repeated operations

## Browser Compatibility

Test on the following browsers:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Accessibility Testing

1. Test keyboard navigation
2. Test with screen readers
3. Verify color contrast meets WCAG guidelines
4. Test with high contrast mode

## Security Testing

1. Test file upload validation
2. Test API endpoint security
3. Verify no sensitive data exposure
4. Test input sanitization

## Regression Testing

After any changes, re-run all manual tests to ensure no functionality is broken.

## Troubleshooting

### Common Issues

1. **Simulation fails**: Check backend logs for errors
2. **Peak detection slow**: Verify data size and algorithm parameters
3. **Import fails**: Check file format and validation
4. **Plot not responsive**: Check browser console for JavaScript errors

### Debug Information

- Check browser console for frontend errors
- Check backend logs for API errors
- Verify network connectivity for API calls
- Check file permissions for import/export

## Success Criteria

The chromatography system is considered fully functional when:

1. ✅ All manual test steps pass
2. ✅ API endpoints return correct responses
3. ✅ Error handling works appropriately
4. ✅ Performance is acceptable (< 2s for peak detection)
5. ✅ Mobile responsiveness is confirmed
6. ✅ Accessibility requirements are met
7. ✅ Security requirements are satisfied

## Future Enhancements

- Real-time chromatogram streaming
- Advanced peak fitting algorithms
- Integration with external databases
- Batch processing capabilities
- Advanced export formats (PDF reports)
- Method template integration
