# Phase 4 Testing Guide - Advanced Analytics & AI Tools

## Overview

This document provides comprehensive testing procedures for Phase 4 analytics features including diagnostics, method optimization, predictive maintenance, and cost optimization.

## Prerequisites

- Backend server running on `http://localhost:8000`
- Frontend development server running on `http://localhost:3000`
- Database with sample data loaded
- Feature flags enabled for analytics

## Test Environment Setup

1. **Start Backend Server**
   ```bash
   cd backend
   python main.py
   ```

2. **Start Frontend Server**
   ```bash
   cd frontend
   npm start
   ```

3. **Verify Feature Flags**
   - Check `frontend/src/config/featureFlags.ts`
   - Ensure `enableAnalytics: true`
   - Ensure all analytics sub-features are enabled

## Test Cases

### 1. Analytics Page Navigation

**Objective**: Verify analytics page loads correctly with all tabs

**Steps**:
1. Navigate to `http://localhost:3000`
2. Click on "Analytics & AI Tools" card in MasterLauncher
3. Verify page loads with header "Analytics & AI Tools"
4. Verify four tabs are present:
   - Run Diagnostics
   - Method Optimizer
   - Predictive Maintenance
   - Cost Optimizer
5. Verify summary statistics are displayed in header

**Expected Results**:
- Page loads without errors
- All tabs are visible and clickable
- Header shows analytics summary with mock data
- No console errors

### 2. Diagnostics Panel Testing

**Objective**: Test comprehensive diagnostics analysis

**Steps**:
1. Navigate to Analytics page
2. Click "Run Diagnostics" tab
3. Configure filters:
   - Select instrument: "GC-2030"
   - Select method: "BTEX-2024-01"
   - Enable all analysis types
4. Click "Run Diagnostics" button
5. Wait for analysis to complete
6. Review results in accordion format

**Expected Results**:
- Analysis completes successfully
- Results show retention drift, ghost peaks, and sensitivity analysis
- Each recommendation has confidence score and severity
- "Apply Recommendation" buttons are present for actionable items

**Test Cases**:
- **Retention Drift Detection**: Verify drift analysis shows increasing/decreasing trends
- **Ghost Peak Detection**: Verify unexpected peaks are flagged
- **Sensitivity Analysis**: Verify sensitivity drops are detected
- **Filter Functionality**: Test different instrument/method combinations

### 3. Method Optimizer Testing

**Objective**: Test method optimization suggestions

**Steps**:
1. Navigate to Analytics page
2. Click "Method Optimizer" tab
3. Select a method from dropdown (e.g., "BTEX-2024-01")
4. Click "Suggest Optimization" button
5. Wait for optimization analysis
6. Review optimization results

**Expected Results**:
- Optimization analysis completes
- Results show oven and inlet optimization suggestions
- Confidence scores are displayed
- Expected effects are listed
- "Apply to Draft Method" button is available

**Test Cases**:
- **Oven Optimization**: Verify ramp rate suggestions
- **Inlet Optimization**: Verify split ratio adjustments
- **Confidence Scoring**: Verify confidence levels are reasonable
- **Multiple Methods**: Test with different method types

### 4. Predictive Maintenance Testing

**Objective**: Test maintenance prediction functionality

**Steps**:
1. Navigate to Analytics page
2. Click "Predictive Maintenance" tab
3. Wait for maintenance predictions to load
4. Review different priority levels:
   - Critical alerts (red border)
   - High priority (orange border)
   - Normal status (green border)

**Expected Results**:
- Maintenance predictions load automatically
- Summary cards show correct counts
- Health scores are displayed as circular progress
- Days remaining are formatted correctly
- "Create Alert" button appears for critical items

**Test Cases**:
- **Critical Alerts**: Verify overdue items are highlighted
- **Health Scores**: Verify circular progress indicators
- **Priority Levels**: Verify correct color coding
- **Refresh Functionality**: Test refresh button

### 5. Cost Optimizer Testing

**Objective**: Test cost optimization analysis

**Steps**:
1. Navigate to Analytics page
2. Click "Cost Optimizer" tab
3. Select method and instrument
4. Click "Run Cost Analysis" button
5. Wait for analysis to complete
6. Review cost breakdown and suggestions

**Expected Results**:
- Cost analysis completes successfully
- Summary shows current vs proposed costs
- Savings percentage is calculated
- Cost breakdown table is populated
- Export functionality works

**Test Cases**:
- **Cost Calculation**: Verify current vs proposed cost comparison
- **Savings Percentage**: Verify percentage calculations
- **Export Functionality**: Test CSV export
- **Multiple Configurations**: Test different method/instrument combinations

### 6. Feature Flag Testing

**Objective**: Test feature flag functionality

**Steps**:
1. Modify `frontend/src/config/featureFlags.ts`
2. Set `enableAnalytics: false`
3. Refresh page
4. Navigate to Analytics page

**Expected Results**:
- Warning message appears when analytics is disabled
- No analytics features are accessible
- Graceful degradation of functionality

### 7. Mobile Responsiveness Testing

**Objective**: Test analytics features on mobile devices

**Steps**:
1. Open browser developer tools
2. Set device to mobile viewport
3. Navigate through all analytics tabs
4. Test all interactive elements

**Expected Results**:
- All components render correctly on mobile
- Touch interactions work properly
- Text is readable on small screens
- Navigation is accessible

### 8. API Integration Testing

**Objective**: Test backend API endpoints

**Steps**:
1. Use API testing tool (Postman/curl)
2. Test each analytics endpoint:

**Diagnostics Endpoint**:
```bash
curl -X POST http://localhost:8000/v1/analytics/diagnostics \
  -H "Content-Type: application/json" \
  -d '{
    "instrument_id": 1,
    "method_id": 1,
    "include_drift_analysis": true,
    "include_ghost_peaks": true,
    "include_sensitivity_analysis": true
  }'
```

**Method Optimization Endpoint**:
```bash
curl -X POST http://localhost:8000/v1/analytics/optimize-method \
  -H "Content-Type: application/json" \
  -d '{
    "method_id": 1,
    "instrument_id": 1
  }'
```

**Maintenance Predictions Endpoint**:
```bash
curl -X GET http://localhost:8000/v1/analytics/maintenance
```

**Cost Optimization Endpoint**:
```bash
curl -X POST http://localhost:8000/v1/analytics/cost-optimizer \
  -H "Content-Type: application/json" \
  -d '{
    "method_id": 1,
    "instrument_id": 1,
    "target_savings_percentage": 15.0
  }'
```

**Expected Results**:
- All endpoints return valid JSON responses
- No 500 errors
- Mock data is returned as expected
- Response times are reasonable (< 2 seconds)

### 9. Error Handling Testing

**Objective**: Test error handling and edge cases

**Steps**:
1. Disconnect backend server
2. Try to run analytics features
3. Check error messages and fallback behavior
4. Reconnect server and verify recovery

**Expected Results**:
- Graceful error handling
- User-friendly error messages
- Fallback to mock data when appropriate
- Recovery when connection is restored

### 10. Performance Testing

**Objective**: Test performance under load

**Steps**:
1. Open multiple browser tabs
2. Run analytics features simultaneously
3. Monitor response times
4. Check memory usage

**Expected Results**:
- Response times remain under 3 seconds
- No memory leaks
- UI remains responsive
- No crashes or errors

## Test Data Validation

### Mock Data Verification

Verify that mock data is realistic and consistent:

1. **Run History Data**:
   - Retention times show realistic drift patterns
   - Peak areas show sensitivity trends
   - Baseline noise is reasonable

2. **Maintenance Predictions**:
   - Health scores range from 0-1
   - Days remaining are positive integers
   - Asset types are valid (column, liner, septa)

3. **Cost Optimization**:
   - Costs are realistic for GC analysis
   - Savings percentages are reasonable
   - Line items are appropriate

## Regression Testing

### Existing Features

Ensure Phase 4 doesn't break existing functionality:

1. **MasterLauncher**: Verify all cards still work
2. **Navigation**: Test all existing routes
3. **Global Data Store**: Verify existing data still loads
4. **Responsive Design**: Test on all screen sizes

### Integration Points

Test integration with existing systems:

1. **Reports System**: Verify analytics can export to reports
2. **Inventory System**: Test maintenance predictions integration
3. **Methods System**: Test optimization suggestions
4. **Instruments System**: Test diagnostics integration

## Browser Compatibility

Test on multiple browsers:

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Accessibility Testing

1. **Keyboard Navigation**: Test all features with keyboard only
2. **Screen Reader**: Verify screen reader compatibility
3. **Color Contrast**: Check color contrast ratios
4. **Focus Management**: Verify proper focus indicators

## Security Testing

1. **Input Validation**: Test with malformed input
2. **XSS Prevention**: Test with script injection attempts
3. **CSRF Protection**: Verify CSRF tokens are used
4. **Authentication**: Test with unauthorized access

## Performance Benchmarks

### Target Metrics

- **Page Load Time**: < 3 seconds
- **API Response Time**: < 2 seconds
- **Memory Usage**: < 100MB additional
- **Bundle Size**: < 500KB additional

### Monitoring

Use browser dev tools to monitor:

- Network requests
- Memory usage
- CPU usage
- Bundle size

## Test Completion Checklist

- [ ] All test cases executed
- [ ] All expected results achieved
- [ ] No critical bugs found
- [ ] Performance benchmarks met
- [ ] Accessibility requirements satisfied
- [ ] Security tests passed
- [ ] Browser compatibility verified
- [ ] Mobile responsiveness confirmed
- [ ] Error handling tested
- [ ] Integration points verified

## Bug Reporting

When bugs are found, include:

1. **Steps to Reproduce**: Detailed step-by-step instructions
2. **Expected vs Actual**: Clear description of expected vs actual behavior
3. **Environment**: Browser, OS, device details
4. **Console Logs**: Any error messages or warnings
5. **Screenshots**: Visual evidence of the issue
6. **Severity**: Critical, High, Medium, Low classification

## Test Data Reset

After testing, reset to clean state:

1. Clear browser cache and local storage
2. Restart backend server
3. Verify clean state by running basic functionality tests

## Documentation Updates

After testing, update:

1. **README.md**: Add analytics features documentation
2. **API Documentation**: Update with new endpoints
3. **User Guide**: Add analytics usage instructions
4. **Developer Guide**: Add analytics development notes
