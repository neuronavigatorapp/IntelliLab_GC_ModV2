# QC Rules Testing Guide

## Overview

This guide provides comprehensive testing procedures for the QC Auto-Flagging system with Westgard rules implementation, control charts, and QC-aware sequence execution.

## Features Tested

- [x] **Westgard Rules Engine**: 1-2s, 1-3s, 2-2s, R-4s, 4-1s, 10-x rule evaluation
- [x] **QC Targets Management**: Create, edit, delete QC targets with mean/SD
- [x] **Control Charts**: Levey-Jennings charts with mean/σ bands and rule hits
- [x] **QC-Aware Sequencing**: Automatic QC evaluation during sequence runs
- [x] **Policy Management**: Configure stop-on-fail and rule strictness
- [x] **Audit Trail**: QC records, rule hits, and decision logging

## Manual Testing Steps

### 1. QC Targets Setup

1. **Navigate to QC Target Editor**
   ```
   URL: /chromatography/qc/targets
   ```

2. **Create Test QC Target**
   - Click "Add New QC Target"
   - Set parameters:
     - Method ID: 1
     - Instrument ID: 1 (or leave blank for all)
     - Analyte: "Benzene"
     - Mean: 5.000 ppm
     - Standard Deviation: 0.250 ppm
     - Unit: ppm
     - N Required: 20
   - Click "Create Target"
   - Verify target appears in table

3. **Verify Target Parameters**
   - Confirm mean/SD values are correct
   - Check z-score preview calculation
   - Test edit functionality
   - Test delete functionality (create a test target first)

### 2. QC Dashboard Functionality

1. **Navigate to QC Dashboard**
   ```
   URL: /chromatography/qc
   ```

2. **Verify Dashboard Components**
   - Status cards display correctly
   - Method/Instrument filters work
   - Date range selector functions
   - Analyte dropdown populated from targets

3. **Test Levey-Jennings Chart**
   - Select an analyte with QC data
   - Verify chart shows:
     - Mean line (blue, dashed)
     - ±1σ lines (green)
     - ±2σ lines (yellow)
     - ±3σ lines (red)
     - Data points colored by status
   - Check tooltips show:
     - Value and unit
     - Z-score
     - Status (PASS/WARN/FAIL)
     - Rule violations (if any)

### 3. Westgard Rules Testing

#### Test Setup
Create QC records to trigger each rule by running sequences with specific QC values:

#### 3.1 Test 1-2s Rule (Warning)
**Objective**: Single point beyond ±2σ should trigger WARNING

**Test Data**: For Benzene target (mean=5.000, sd=0.250):
- QC Value: 5.500 ppm (Z-score = +2.0)
- Expected: Status = WARN, Flag = "1-2s"

**Steps**:
1. Run sequence with QC item having Benzene at 5.500 ppm
2. Check QC Dashboard shows orange warning point
3. Verify rule hit in "Recent Rule Violations"
4. Confirm sequence continues (not stopped)

#### 3.2 Test 1-3s Rule (Critical)
**Objective**: Single point beyond ±3σ should trigger FAIL

**Test Data**:
- QC Value: 4.250 ppm (Z-score = -3.0)
- Expected: Status = FAIL, Flag = "1-3s"

**Steps**:
1. Set QC policy: stopOnFail = true
2. Run sequence with QC item having Benzene at 4.250 ppm
3. Check sequence stops with error
4. Verify QC record shows FAIL status
5. Check red critical point on chart

#### 3.3 Test 2-2s Rule (Critical)
**Objective**: Two consecutive points beyond ±2σ on same side

**Test Data** (requires 20+ points for strict rules):
- First run: 5.500 ppm (Z-score = +2.0)
- Second run: 5.600 ppm (Z-score = +2.4)
- Expected: Status = FAIL, Flag = "2-2s"

**Steps**:
1. Ensure 20+ historical QC points exist
2. Run two consecutive QC samples with values above +2σ
3. Verify second run triggers 2-2s rule
4. Check both points flagged in chart

#### 3.4 Test R-4s Rule (Critical)
**Objective**: Two consecutive points differing by ≥4σ (opposite sides)

**Test Data**:
- First run: 4.000 ppm (Z-score = -4.0)
- Second run: 6.000 ppm (Z-score = +4.0)
- Difference: 8σ
- Expected: Status = FAIL, Flag = "R-4s"

#### 3.5 Test 4-1s Rule (Critical)
**Objective**: Four consecutive points beyond ±1σ on same side

**Test Data** (all above mean + 1σ = 5.250):
- Run 1: 5.300 ppm
- Run 2: 5.350 ppm  
- Run 3: 5.280 ppm
- Run 4: 5.320 ppm
- Expected: Status = FAIL, Flag = "4-1s"

#### 3.6 Test 10-x Rule (Critical)
**Objective**: Ten consecutive points on same side of mean

**Test Data** (all slightly above mean = 5.000):
- 10 runs with values: 5.010, 5.020, 5.015, 5.025, 5.030, 5.012, 5.018, 5.022, 5.016, 5.028
- Expected: Status = FAIL, Flag = "10-x"

### 4. QC Policy Testing

#### 4.1 Test Stop-on-Fail Policy
1. **Enable Stop-on-Fail**
   - Go to QC Dashboard
   - Check "Stop sequence on failure" in policy panel
   - Verify policy saved

2. **Test Sequence Stopping**
   - Create sequence: Blank → Standard → QC (failing) → Sample
   - Run sequence
   - Verify sequence stops at QC failure
   - Check sequence status = "error"
   - Verify message: "QC failure at item X. Sequence stopped per policy."

3. **Test Continue-on-Fail**
   - Uncheck "Stop sequence on failure"
   - Run same failing sequence
   - Verify sequence completes all items
   - Check QC failure recorded but sequence continues

#### 4.2 Test N-Required for Strict Rules
1. **Set N-Required = 5**
   - Update QC target: n_required = 5
   - Run QC with < 5 historical points
   - Verify only 1-3s rule evaluated (others degraded to WARN)

2. **Test with Sufficient Points**
   - Add 5+ QC records
   - Run QC triggering 2-2s rule
   - Verify rule triggers FAIL (not degraded)

### 5. Integration Testing

#### 5.1 Sequence Runner Integration
1. **Create QC Sequence**
   - Go to Sequence Builder
   - Add items: Blank → Std(5ppm) → QC → Sample → QC
   - Save as "QC Test Sequence"

2. **Run with QC Evaluation**
   - Execute sequence
   - Verify QC items show inline evaluation results
   - Check status indicators: ✅ PASS, ⚠️ WARN, ❌ FAIL
   - Verify quantitation performed before QC evaluation

3. **Test Override Functionality**
   - Trigger QC failure that stops sequence
   - Verify "Override & Continue" button appears
   - Click override (stub functionality)
   - Check console log shows override attempt

#### 5.2 API Integration Testing

Test all QC API endpoints:

```bash
# Get QC targets
GET /api/v1/qc/targets?methodId=1

# Create QC target
POST /api/v1/qc/targets
{
  "methodId": "1",
  "analyte": "TestCompound",
  "mean": 10.0,
  "sd": 0.5,
  "unit": "ppm",
  "n_required": 20
}

# Get QC series data
GET /api/v1/qc/series?analyte=Benzene&methodId=1&days=30

# Get QC records
GET /api/v1/qc/records?limit=50

# Get/Set QC policy
GET /api/v1/qc/policy
POST /api/v1/qc/policy
{
  "stopOnFail": true,
  "warnOn1_2s": true,
  "requireNBeforeStrict": 20
}

# Get QC status
GET /api/v1/qc/status
```

### 6. Data Persistence Testing

1. **QC Records Persistence**
   - Run multiple QC samples
   - Refresh browser
   - Verify QC records still present
   - Check timestamps accurate

2. **Rule Hits Persistence**
   - Trigger various rule violations
   - Verify rule hits stored with:
     - Correct rule name
     - Analyte
     - Value and z-score
     - Run ID and timestamp

3. **Policy Persistence**
   - Change QC policy settings
   - Restart application
   - Verify policy settings maintained

### 7. Chart Visualization Testing

#### 7.1 Chart Rendering
1. **Verify Chart Elements**
   - Mean line visible and labeled
   - Control limit lines (±1σ, ±2σ, ±3σ)
   - Data points properly positioned
   - Time axis formatted correctly
   - Y-axis shows concentration units

2. **Test Point Colors**
   - PASS: Green dots
   - WARN: Orange dots  
   - FAIL: Red dots
   - Rule violations: Larger dots

3. **Test Interactive Features**
   - Hover tooltips show all required info
   - Zoom and pan functionality
   - Legend displays correctly

#### 7.2 Chart Data Accuracy
1. **Verify Calculations**
   - Z-scores calculated correctly: (value - mean) / sd
   - Control limits positioned accurately
   - Data points match QC records

2. **Test Date Filtering**
   - Change date range (7, 30, 90 days)
   - Verify chart updates with correct data
   - Check no data outside range displayed

### 8. Error Handling Testing

#### 8.1 Invalid QC Targets
1. **Test Validation**
   - Try negative standard deviation
   - Try empty analyte name
   - Try n_required < 1
   - Verify appropriate error messages

2. **Test Missing Targets**
   - Run QC sequence without defined targets
   - Verify graceful handling
   - Check warning messages logged

#### 8.2 Network Failures
1. **Simulate API Failures**
   - Test with network disconnected
   - Verify error handling
   - Check user-friendly error messages

### 9. Performance Testing

#### 9.1 Large Dataset Handling
1. **Create Large QC Dataset**
   - Generate 1000+ QC records
   - Test chart rendering performance
   - Verify pagination/limiting works

2. **Rule Evaluation Performance**
   - Test rules with long time series (100+ points)
   - Verify evaluation completes in < 2 seconds
   - Check memory usage reasonable

### 10. Cross-Browser Testing

Test QC functionality in:
- Chrome (latest)
- Firefox (latest)  
- Safari (latest)
- Edge (latest)

Verify:
- Charts render correctly
- Forms work properly
- Navigation functions
- API calls succeed

## Expected Results Summary

| Test Category | Pass Criteria |
|---------------|---------------|
| QC Targets | ✅ CRUD operations work, validation enforced |
| Westgard Rules | ✅ All 6 rules trigger correctly with test data |
| Control Charts | ✅ Levey-Jennings charts display with proper bands |
| Sequence Integration | ✅ QC evaluation during sequences, stop-on-fail works |
| Policy Management | ✅ Policy changes affect rule evaluation |
| Data Persistence | ✅ QC records and rule hits stored correctly |
| Performance | ✅ Rule evaluation < 2s, charts render smoothly |
| Error Handling | ✅ Graceful failures with user-friendly messages |

## Troubleshooting

### Common Issues

1. **QC Rules Not Triggering**
   - Check if sufficient historical data exists (n_required)
   - Verify QC target parameters (mean/sd)
   - Ensure policy settings correct

2. **Charts Not Displaying**
   - Check browser console for errors
   - Verify API endpoints returning data
   - Check QC targets exist for selected analyte

3. **Sequence Not Stopping on QC Failure**
   - Verify stopOnFail policy enabled
   - Check QC targets exist for method/instrument
   - Ensure quantitation completes before QC evaluation

4. **Performance Issues**
   - Limit date range for large datasets
   - Check network latency to API
   - Verify efficient database queries

## Test Data Generation

For comprehensive testing, use this Python script to generate test QC data:

```python
import random
from datetime import datetime, timedelta

def generate_test_qc_data(target_mean=5.0, target_sd=0.25, n_points=50):
    """Generate QC test data with various rule violations"""
    data = []
    base_time = datetime.now() - timedelta(days=30)
    
    for i in range(n_points):
        timestamp = base_time + timedelta(hours=i*12)
        
        # Generate mostly normal data with some rule violations
        if i == 10:  # 1-3s violation
            value = target_mean + 3.2 * target_sd
        elif i in [20, 21]:  # 2-2s violation  
            value = target_mean + 2.1 * target_sd
        elif i in [30, 31, 32, 33]:  # 4-1s violation
            value = target_mean + 1.1 * target_sd
        else:
            # Normal distribution around target
            value = random.normalvariate(target_mean, target_sd)
        
        data.append({
            'timestamp': timestamp.isoformat(),
            'analyte': 'Benzene',
            'value': round(value, 3),
            'mean': target_mean,
            'sd': target_sd
        })
    
    return data
```

This completes the comprehensive QC Rules Testing Guide. Follow these procedures to ensure the QC auto-flagging system functions correctly and meets all requirements.
