# Phase 5 Testing Guide - QC, Compliance & LIMS Integration

## Overview

This document provides comprehensive testing procedures for Phase 5 features: Quality Control (QC) management, audit trails, and LIMS integration.

## Prerequisites

- Backend server running on `http://localhost:8000`
- Frontend development server running on `http://localhost:3000`
- Database initialized with sample data
- Feature flags enabled for QC and LIMS modules

## Test Categories

### 1. QC Management Testing

#### 1.1 QC Record Creation
**Objective**: Test creation of QC records with proper validation

**Steps**:
1. Navigate to `/qc-compliance`
2. Click on "QC Charts" tab
3. Verify the QC Charts component loads with sample data
4. Test creating a new QC record via API:
   ```bash
   curl -X POST http://localhost:8000/qc/records \
     -H "Content-Type: application/json" \
     -d '{
       "instrument_id": 1,
       "analyte": "Benzene",
       "value": 1.5,
       "ucl": 2.0,
       "lcl": 1.0,
       "warn_high": 1.8,
       "warn_low": 1.2,
       "analyst": "test_user"
     }'
   ```

**Expected Results**:
- QC record created successfully
- Status automatically determined (in_control/warning/out_of_control)
- Audit log entry created

#### 1.2 QC Control Charts
**Objective**: Test control chart visualization and SPC rules

**Steps**:
1. Navigate to QC Charts tab
2. Verify chart displays with:
   - QC values as blue line with markers
   - UCL/LCL as red dashed lines
   - Warning limits as yellow dotted lines
   - Mean line as green solid line
   - Out-of-control points highlighted with red X markers
   - Warning points highlighted with yellow triangles

**Expected Results**:
- Chart renders correctly with all control lines
- Out-of-control and warning points properly highlighted
- Summary statistics displayed (mean, std dev, record count, status)

#### 1.3 SPC Rule Violations
**Objective**: Test Western Electric Rules implementation

**Steps**:
1. Create multiple QC records to trigger SPC violations
2. Test Rule 1: One point beyond 3σ
3. Test Rule 2: Nine points in a row on same side
4. Test Rule 3: Six points steadily increasing/decreasing

**Expected Results**:
- SPC violations detected automatically
- QC alerts created for violations
- Violations highlighted on control chart

#### 1.4 QC Alerts
**Objective**: Test QC alert system

**Steps**:
1. Create QC records that trigger alerts
2. Navigate to QC Alerts section
3. Test acknowledging alerts
4. Verify alert status updates

**Expected Results**:
- Alerts created for SPC violations
- Alerts can be acknowledged
- Alert status properly tracked

### 2. Audit Trail Testing

#### 2.1 Audit Log Creation
**Objective**: Test automatic audit log creation

**Steps**:
1. Perform various actions (create/update/delete records)
2. Navigate to "Audit Log" tab
3. Verify audit entries created for each action

**Expected Results**:
- Audit entries created for all system actions
- Proper user, action, entity_type, and entity_id recorded
- Timestamps accurate
- Details properly stored

#### 2.2 Audit Log Filtering
**Objective**: Test audit log filtering capabilities

**Steps**:
1. Navigate to Audit Log tab
2. Test date range filters
3. Test user filters
4. Test action filters
5. Test entity type filters

**Expected Results**:
- Filters work correctly
- Results update in real-time
- Clear filters button resets all filters

#### 2.3 Audit Log Export
**Objective**: Test audit log export functionality

**Steps**:
1. Navigate to Audit Log
2. Apply filters
3. Test export in JSON format
4. Test export in CSV format

**Expected Results**:
- Export generates correct format
- All filtered data included
- File downloads properly

#### 2.4 Audit Summary
**Objective**: Test audit summary statistics

**Steps**:
1. Navigate to Audit Log
2. Verify summary cards display:
   - Total entries
   - Unique users
   - Action counts
   - Entity type counts

**Expected Results**:
- Summary statistics accurate
- Real-time updates when filters applied

### 3. LIMS Integration Testing

#### 3.1 LIMS Configuration Management
**Objective**: Test LIMS configuration CRUD operations

**Steps**:
1. Navigate to "LIMS Settings" tab
2. Click "Add Configuration"
3. Fill in configuration details:
   - Connection Name: "Test LIMS"
   - Base URL: "https://test-lims.example.com/api"
   - API Key: "test-api-key"
   - Format: "json"
4. Save configuration
5. Test editing configuration
6. Test deleting configuration

**Expected Results**:
- Configuration created successfully
- API key encrypted in database
- Edit functionality works
- Delete with confirmation

#### 3.2 LIMS Connection Testing
**Objective**: Test LIMS connection functionality

**Steps**:
1. Create a LIMS configuration
2. Click "Test" button
3. Verify connection test results

**Expected Results**:
- Connection test executes
- Results displayed (success/failure)
- Response time shown
- Error details displayed if failed

#### 3.3 Data Export to LIMS
**Objective**: Test data export functionality

**Steps**:
1. Configure LIMS connection
2. Test export with different data types:
   - Methods
   - Runs
   - QC data
   - Audit logs
3. Test different formats (JSON, XML, CSV)

**Expected Results**:
- Export requests processed
- Data formatted correctly
- Success/failure status reported
- Audit trail created for exports

#### 3.4 Data Import from LIMS
**Objective**: Test data import functionality

**Steps**:
1. Prepare test files in different formats
2. Test import with validation only
3. Test import with actual data import
4. Verify imported data

**Expected Results**:
- File upload works
- Validation reports accurate
- Data imported correctly
- Error handling for invalid files

### 4. Feature Flag Testing

#### 4.1 QC Compliance Feature Flag
**Objective**: Test QC compliance feature flag

**Steps**:
1. Disable QC compliance feature flag
2. Navigate to `/qc-compliance`
3. Verify features disabled message
4. Re-enable feature flag
5. Verify features available

**Expected Results**:
- Features properly disabled when flag off
- Features available when flag on
- No errors when disabled

#### 4.2 LIMS Feature Flag
**Objective**: Test LIMS feature flag

**Steps**:
1. Disable LIMS feature flag
2. Navigate to QC & Compliance page
3. Verify LIMS Settings tab not visible
4. Re-enable feature flag
5. Verify LIMS Settings tab visible

**Expected Results**:
- LIMS features properly controlled by flag
- UI updates correctly when flag changes

### 5. API Testing

#### 5.1 QC API Endpoints
**Test the following endpoints**:

```bash
# Get QC records
curl http://localhost:8000/qc/records

# Create QC record
curl -X POST http://localhost:8000/qc/records \
  -H "Content-Type: application/json" \
  -d '{...}'

# Get QC summary
curl http://localhost:8000/qc/summary/Benzene

# Get QC chart data
curl http://localhost:8000/qc/charts/Benzene

# Get QC alerts
curl http://localhost:8000/qc/alerts
```

#### 5.2 Audit API Endpoints
**Test the following endpoints**:

```bash
# Get audit log
curl http://localhost:8000/audit/

# Get audit summary
curl http://localhost:8000/audit/summary/

# Export audit log
curl http://localhost:8000/audit/export/?format=json
```

#### 5.3 LIMS API Endpoints
**Test the following endpoints**:

```bash
# Get LIMS configs
curl http://localhost:8000/lims/configs

# Create LIMS config
curl -X POST http://localhost:8000/lims/configs \
  -H "Content-Type: application/json" \
  -d '{...}'

# Test LIMS connection
curl -X POST http://localhost:8000/lims/configs/1/test

# Export data to LIMS
curl -X POST http://localhost:8000/lims/export \
  -H "Content-Type: application/json" \
  -d '{...}'
```

### 6. Database Testing

#### 6.1 QC Tables
**Verify database tables created**:

```sql
-- Check QC records table
SELECT * FROM qc_records LIMIT 5;

-- Check QC alerts table
SELECT * FROM qc_alerts LIMIT 5;

-- Check audit log table
SELECT * FROM audit_log LIMIT 5;

-- Check LIMS configs table
SELECT * FROM lims_configs LIMIT 5;
```

#### 6.2 Data Integrity
**Test data integrity**:

1. Create QC records and verify they appear in database
2. Update QC records and verify audit trail created
3. Delete QC records and verify audit trail created
4. Test foreign key constraints

### 7. Performance Testing

#### 7.1 Load Testing
**Test with larger datasets**:

1. Create 100+ QC records
2. Test chart rendering performance
3. Test audit log filtering performance
4. Test LIMS connection with timeout

**Expected Results**:
- Charts render within 2 seconds
- Filtering responds within 1 second
- No memory leaks

#### 7.2 Concurrent Access
**Test concurrent operations**:

1. Multiple users creating QC records simultaneously
2. Multiple users accessing audit log simultaneously
3. Multiple users testing LIMS connections

**Expected Results**:
- No data corruption
- Proper locking mechanisms
- Consistent results

### 8. Security Testing

#### 8.1 API Key Encryption
**Test LIMS API key security**:

1. Create LIMS configuration with API key
2. Verify API key encrypted in database
3. Verify API key decrypted when retrieved

#### 8.2 Audit Trail Security
**Test audit trail integrity**:

1. Verify audit entries cannot be modified
2. Verify audit entries include user information
3. Verify audit entries include IP addresses

### 9. Error Handling Testing

#### 9.1 Invalid Data
**Test error handling**:

1. Submit invalid QC record data
2. Submit invalid LIMS configuration
3. Test with malformed audit log filters

**Expected Results**:
- Proper error messages displayed
- No application crashes
- Graceful degradation

#### 9.2 Network Errors
**Test network error handling**:

1. Test LIMS connection with invalid URL
2. Test with network timeout
3. Test with server unavailable

**Expected Results**:
- Proper error messages
- Retry mechanisms
- User-friendly error display

## Test Data Setup

### Sample QC Records
Create the following sample QC records for testing:

```json
[
  {
    "instrument_id": 1,
    "analyte": "Benzene",
    "value": 1.5,
    "ucl": 2.0,
    "lcl": 1.0,
    "warn_high": 1.8,
    "warn_low": 1.2,
    "analyst": "analyst1"
  },
  {
    "instrument_id": 1,
    "analyte": "Benzene",
    "value": 1.7,
    "ucl": 2.0,
    "lcl": 1.0,
    "warn_high": 1.8,
    "warn_low": 1.2,
    "analyst": "analyst1"
  },
  {
    "instrument_id": 1,
    "analyte": "Benzene",
    "value": 2.1,
    "ucl": 2.0,
    "lcl": 1.0,
    "warn_high": 1.8,
    "warn_low": 1.2,
    "analyst": "analyst1"
  }
]
```

### Sample LIMS Configuration
```json
{
  "connection_name": "Test LIMS",
  "base_url": "https://test-lims.example.com/api",
  "api_key": "test-api-key-12345",
  "format": "json",
  "description": "Test LIMS configuration for development"
}
```

## Success Criteria

- All QC features function correctly
- Audit trails capture all system activities
- LIMS integration works with external systems
- Feature flags properly control functionality
- Performance meets requirements
- Security measures implemented correctly
- Error handling graceful and user-friendly

## Reporting

After completing all tests, document:

1. Test results for each category
2. Any bugs or issues found
3. Performance metrics
4. Security findings
5. Recommendations for improvements

## Maintenance

- Regular testing of QC calculations
- Monitoring of audit log size
- Verification of LIMS connection health
- Review of feature flag usage
- Performance monitoring and optimization
