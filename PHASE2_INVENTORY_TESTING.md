# Phase 2 - Consumable Inventory Testing Guide

## Overview
This guide provides manual testing instructions for the new Phase 2 consumable inventory features including reorder thresholds, predictive usage modeling, and alerting.

## Prerequisites
1. **Start the application**: Run `start_simple.bat` to launch both backend and frontend
2. **Verify backend is running**: Check `http://localhost:8000/docs` for API documentation
3. **Verify frontend is running**: Check `http://localhost:3000` for the web interface

## Test 1: Inventory Status Overview

### Steps:
1. **Navigate to Inventory**: 
   - Open the web interface at `http://localhost:3000`
   - Look for "Consumable Inventory" in the navigation menu
   - Click to access the inventory management page

### Expected Results:
- ✅ **Header displays correctly**: Shows "Consumable Inventory" with inventory summary
- ✅ **Summary cards show**: Total items, low stock count, out of stock count, total value
- ✅ **Alert banner appears**: If any items need reordering (should show DB-624 Column as out of stock)
- ✅ **Inventory table loads**: Shows all consumable items with current stock levels

### Sample Data Verification:
- **DB-624 Column**: Should show as "Out of Stock" (0 units)
- **DB-5 Column**: Should show as "Low Stock" (1 unit)
- **Helium Gas**: Should show as "Adequate Stock" (5000L)
- **Vials**: Should show as "Adequate Stock" (200 units)

## Test 2: Threshold Management

### Steps:
1. **Set Reorder Thresholds**:
   - Find any consumable item in the table
   - Click the "Edit" (pencil) icon in the Actions column
   - Set reorder threshold to 10, critical threshold to 5
   - Set reorder quantity to 50
   - Click "Save Thresholds"

### Expected Results:
- ✅ **Dialog opens**: Shows current thresholds for the selected item
- ✅ **Form validation**: Ensures thresholds are valid numbers
- ✅ **Save success**: Shows "Thresholds updated successfully" toast message
- ✅ **Table updates**: Item status changes based on new thresholds
- ✅ **Alert generation**: If item now needs reordering, alert appears

## Test 3: Usage Recording

### Steps:
1. **Record Usage**:
   - Find a consumable item (preferably one with good stock)
   - Click the "Add" (plus) icon in the Actions column
   - Enter quantity used (e.g., 5)
   - Enter analysis count (e.g., 10)
   - Add optional notes
   - Click "Record Usage"

### Expected Results:
- ✅ **Dialog opens**: Shows usage recording form
- ✅ **Current stock displayed**: Shows available stock in helper text
- ✅ **Usage recorded**: Shows "Usage recorded successfully" toast
- ✅ **Stock updated**: Item's current stock decreases
- ✅ **Predictions update**: Days to empty calculation updates
- ✅ **Alerts check**: If stock drops below threshold, alert appears

## Test 4: Predictive Usage Analysis

### Steps:
1. **View Predictions**:
   - Look at the "Days Left" column in the inventory table
   - Note the predictions for different items
   - Check confidence scores (should be higher for items with more usage history)

### Expected Results:
- ✅ **Realistic predictions**: Items with usage history show days to empty
- ✅ **Infinite for no usage**: Items without usage history show "∞"
- ✅ **Confidence scores**: Higher for items with more data points
- ✅ **Usage trends**: Items with recent usage show updated predictions

## Test 5: Alert System

### Steps:
1. **Trigger Alerts**:
   - Record usage for items near their reorder thresholds
   - Set low thresholds for items with good stock
   - Watch for alert generation

### Expected Results:
- ✅ **Critical alerts**: Out of stock items show red alerts
- ✅ **Low stock alerts**: Items below reorder threshold show warnings
- ✅ **Alert details**: Click alerts to see specific information
- ✅ **Alert persistence**: Alerts remain until stock is replenished

## Test 6: Usage Trends Analysis

### Steps:
1. **View Trends**:
   - Click "Show Usage Trends" button in the summary card
   - Review the trends section that appears

### Expected Results:
- ✅ **Trends section appears**: Shows usage patterns and recommendations
- ✅ **High usage items**: Lists items with highest weekly costs
- ✅ **Recommendations**: Shows cost-saving suggestions
- ✅ **Weekly cost analysis**: Displays total weekly consumables cost

## Test 7: API Endpoint Testing

### Steps:
1. **Test API directly**:
   - Open `http://localhost:8000/docs`
   - Navigate to `/inventory/` endpoints
   - Test the following endpoints:

### API Tests:

#### GET `/inventory/status`
- ✅ **Returns inventory status**: Complete inventory overview
- ✅ **Includes predictions**: Usage predictions for all items
- ✅ **Includes alerts**: Current inventory alerts

#### POST `/inventory/thresholds/{consumable_id}`
- ✅ **Updates thresholds**: Successfully sets reorder thresholds
- ✅ **Validation**: Rejects invalid threshold values
- ✅ **Returns confirmation**: Shows updated threshold data

#### POST `/inventory/usage/{consumable_id}`
- ✅ **Records usage**: Successfully records consumable usage
- ✅ **Updates stock**: Reduces current stock appropriately
- ✅ **Generates alerts**: Creates alerts if thresholds breached

#### GET `/inventory/predictions/{consumable_id}`
- ✅ **Returns predictions**: Usage predictions for specific item
- ✅ **Includes confidence**: Confidence scores for predictions
- ✅ **Shows trends**: Usage trend analysis

#### GET `/inventory/trends`
- ✅ **Returns trends**: Overall inventory usage trends
- ✅ **Cost analysis**: Weekly cost breakdown
- ✅ **Recommendations**: Cost-saving suggestions

## Test 8: Mobile Responsiveness

### Steps:
1. **Test on mobile/tablet**:
   - Open the inventory page on a mobile device or tablet
   - Test all functionality on smaller screens

### Expected Results:
- ✅ **Responsive layout**: Interface adapts to smaller screens
- ✅ **Touch-friendly**: Buttons and controls are appropriately sized
- ✅ **Readable text**: All text remains readable on small screens
- ✅ **Functional dialogs**: All dialogs work properly on mobile

## Test 9: Error Handling

### Steps:
1. **Test error scenarios**:
   - Try to record usage for an item that doesn't exist
   - Set invalid threshold values
   - Test with network interruptions

### Expected Results:
- ✅ **Graceful errors**: Clear error messages for invalid operations
- ✅ **Validation**: Form validation prevents invalid data entry
- ✅ **Network handling**: Appropriate handling of connection issues
- ✅ **User feedback**: Toast messages for success/error states

## Test 10: Data Persistence

### Steps:
1. **Verify data persistence**:
   - Record usage for several items
   - Set thresholds for multiple items
   - Refresh the page
   - Verify all changes persist

### Expected Results:
- ✅ **Usage history**: All recorded usage persists after refresh
- ✅ **Threshold settings**: All threshold changes persist
- ✅ **Stock levels**: Current stock levels remain accurate
- ✅ **Predictions**: Usage predictions remain consistent

## Performance Testing

### Steps:
1. **Test with large datasets**:
   - Add many usage records for items
   - Test with many consumable items
   - Monitor response times

### Expected Results:
- ✅ **Fast loading**: Inventory page loads within 2 seconds
- ✅ **Responsive UI**: Interface remains responsive during operations
- ✅ **Efficient queries**: API endpoints respond quickly
- ✅ **Memory usage**: Application doesn't consume excessive memory

## Integration Testing

### Steps:
1. **Test with other features**:
   - Use inventory with cost calculations
   - Test with instrument management
   - Verify data consistency across features

### Expected Results:
- ✅ **Cost integration**: Inventory data affects cost calculations
- ✅ **Instrument linking**: Usage can be linked to specific instruments
- ✅ **Data consistency**: All related data remains consistent
- ✅ **Cross-feature functionality**: Inventory works with other features

## Success Criteria

### Phase 2 Completion Checklist:
- ✅ **Reorder thresholds**: Per-item reorder and critical thresholds
- ✅ **Predictive usage**: EWMA and rolling average consumption modeling
- ✅ **Alert engine**: Threshold breach and depletion alerts
- ✅ **UI components**: Streamlit panels for thresholds, predictions, alerts
- ✅ **API endpoints**: Complete REST API for inventory management
- ✅ **Database integration**: Proper storage and retrieval of inventory data
- ✅ **Mobile optimization**: Touch-friendly interface for field use
- ✅ **Error handling**: Robust error handling and validation
- ✅ **Performance**: Fast loading and responsive interface

## Troubleshooting

### Common Issues:

1. **Inventory not loading**:
   - Check backend is running on port 8000
   - Verify database has sample data
   - Check browser console for errors

2. **API errors**:
   - Verify all required dependencies are installed
   - Check backend logs for detailed error messages
   - Ensure database schema is up to date

3. **UI issues**:
   - Clear browser cache and refresh
   - Check for JavaScript errors in console
   - Verify all frontend dependencies are installed

4. **Data inconsistencies**:
   - Restart the application
   - Re-run the sample data initialization
   - Check database integrity

## Next Steps

After successful testing:
1. **Document any issues** found during testing
2. **Optimize performance** if needed
3. **Add additional features** based on user feedback
4. **Prepare for Phase 3** development (Sandbox GC Simulator enhancements)

---

**Test completed by**: [Your Name]
**Date**: [Date]
**Version**: Phase 2 - Consumable Inventory
**Status**: ✅ Ready for field testing
