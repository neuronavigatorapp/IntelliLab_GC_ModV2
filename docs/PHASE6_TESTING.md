# Phase 6 Testing Guide - Mobile & Offline Lab Companion

## Overview

This document provides comprehensive testing procedures for Phase 6 features including offline functionality, mobile companion, photo capture, and sync capabilities.

## Prerequisites

- IntelliLab GC application running
- Modern browser with PWA support (Chrome, Firefox, Safari)
- Mobile device or browser dev tools for mobile testing
- Network connectivity for sync testing

## 1. PWA & Offline Functionality Testing

### 1.1 Service Worker Registration

**Test Steps:**
1. Open browser dev tools → Application tab
2. Navigate to Service Workers section
3. Verify service worker is registered
4. Check console for "Service Worker registered" message

**Expected Results:**
- Service worker appears in list
- Status shows as "activated"
- No errors in console

### 1.2 Offline Mode Testing

**Test Steps:**
1. Load the application
2. Open dev tools → Network tab
3. Check "Offline" checkbox
4. Navigate to different pages
5. Try to perform actions (QC, inventory updates)

**Expected Results:**
- App loads from cache when offline
- Connectivity badge shows "Offline"
- Actions are queued for later sync
- No network errors displayed to user

### 1.3 Cache Management

**Test Steps:**
1. Open dev tools → Application tab → Storage
2. Check Cache Storage for static and dynamic caches
3. Verify cached resources include:
   - App shell (HTML, CSS, JS)
   - API responses
   - Images and assets

**Expected Results:**
- Static cache contains app shell files
- Dynamic cache contains API responses
- Cache sizes are reasonable

## 2. Sync Engine Testing

### 2.1 Pull Changes

**Test Steps:**
1. Make changes on another device/browser
2. On test device, trigger sync (Force Sync button)
3. Check if changes appear locally

**Expected Results:**
- Changes from other device appear
- Sync status shows "Synced"
- No conflicts for simple changes

### 2.2 Push Changes

**Test Steps:**
1. Make local changes while offline
2. Go back online
3. Check if changes sync to server
4. Verify on other device

**Expected Results:**
- Offline changes sync when online
- Changes appear on other devices
- Sync status updates correctly

### 2.3 Conflict Resolution

**Test Steps:**
1. Make conflicting changes on two devices
2. Sync both devices
3. Check conflict resolution behavior

**Expected Results:**
- Conflicts are detected and reported
- Default resolution (server wins) is applied
- Conflict UI shows both versions

## 3. Mobile Companion Testing

### 3.1 Mobile Home Page

**Test Steps:**
1. Navigate to `/m`
2. Test all quick action buttons
3. Check responsive design
4. Test navigation footer

**Expected Results:**
- Page loads with mobile-optimized layout
- Quick actions work correctly
- Navigation is touch-friendly
- Status indicators show correctly

### 3.2 Quick QC Form

**Test Steps:**
1. Navigate to `/m/qc`
2. Fill out QC form
3. Test photo capture
4. Submit form (online and offline)

**Expected Results:**
- Form is mobile-optimized
- Photo capture works
- Submission works online and offline
- Validation works correctly

### 3.3 Quick Inventory

**Test Steps:**
1. Navigate to `/m/inventory`
2. Select inventory item
3. Test stock adjustments
4. Test photo capture
5. Submit changes

**Expected Results:**
- Item selection works
- Stock adjustments calculate correctly
- Photo capture works
- Changes sync properly

## 4. Photo Capture Testing

### 4.1 Camera Access

**Test Steps:**
1. Open photo capture component
2. Click "Take Photo" button
3. Grant camera permissions
4. Capture photo

**Expected Results:**
- Camera permission request appears
- Camera view shows correctly
- Photo capture works
- Preview shows captured image

### 4.2 File Upload Fallback

**Test Steps:**
1. Deny camera permissions
2. Use "Choose File" option
3. Select image file
4. Upload photo

**Expected Results:**
- File picker opens
- Selected image shows preview
- Upload works correctly

### 4.3 Photo Upload

**Test Steps:**
1. Capture or select photo
2. Click upload button
3. Check server response
4. Verify photo appears in app

**Expected Results:**
- Upload progress shows
- Success notification appears
- Photo is linked to entity
- Photo can be viewed/downloaded

## 5. Notifications Testing

### 5.1 Push Notifications

**Test Steps:**
1. Grant notification permissions
2. Trigger notification-worthy events
3. Check if notifications appear

**Expected Results:**
- Permission request appears
- Notifications show correctly
- Clicking notification opens app
- Notifications have proper content

### 5.2 In-App Notifications

**Test Steps:**
1. Perform actions that trigger notifications
2. Check toast notifications
3. Test notification dismissal

**Expected Results:**
- Toasts appear in top-right
- Notifications auto-dismiss
- Manual dismissal works
- Different types show correct colors

## 6. Offline Storage Testing

### 6.1 IndexedDB

**Test Steps:**
1. Open dev tools → Application tab
2. Check IndexedDB for IntelliLabGC database
3. Verify data stores exist
4. Check data persistence

**Expected Results:**
- Database exists with correct name
- Stores for instruments, methods, QC, inventory exist
- Data persists across sessions
- No corruption or errors

### 6.2 Local Storage

**Test Steps:**
1. Check localStorage for sync data
2. Verify mutation queue storage
3. Test data persistence

**Expected Results:**
- Sync cursor stored correctly
- Mutation queue persists
- Data survives page refresh

## 7. Network Status Testing

### 7.1 Connectivity Detection

**Test Steps:**
1. Toggle network on/off
2. Check connectivity badge
3. Test automatic sync on reconnect

**Expected Results:**
- Badge shows correct status
- Offline mode activates properly
- Sync triggers on reconnection

### 7.2 Background Sync

**Test Steps:**
1. Make changes while offline
2. Go online
3. Check if background sync processes queue

**Expected Results:**
- Queued mutations process automatically
- Sync status updates
- No manual intervention needed

## 8. Performance Testing

### 8.1 Offline Performance

**Test Steps:**
1. Test app load time offline
2. Check memory usage
3. Test battery impact

**Expected Results:**
- App loads quickly from cache
- Memory usage is reasonable
- Battery impact is minimal

### 8.2 Sync Performance

**Test Steps:**
1. Test sync with large datasets
2. Check sync time
3. Monitor network usage

**Expected Results:**
- Sync completes in reasonable time
- Network usage is efficient
- No memory leaks

## 9. Error Handling Testing

### 9.1 Network Errors

**Test Steps:**
1. Simulate network failures
2. Test error recovery
3. Check error messages

**Expected Results:**
- Graceful error handling
- User-friendly error messages
- Automatic retry mechanisms

### 9.2 Storage Errors

**Test Steps:**
1. Simulate storage quota exceeded
2. Test data corruption scenarios
3. Check recovery mechanisms

**Expected Results:**
- Graceful degradation
- Data integrity maintained
- Recovery options available

## 10. Security Testing

### 10.1 Data Privacy

**Test Steps:**
1. Check local storage security
2. Verify data encryption
3. Test data isolation

**Expected Results:**
- Sensitive data not exposed
- Proper data isolation
- Secure storage practices

### 10.2 Permission Handling

**Test Steps:**
1. Test camera permission flows
2. Test notification permission flows
3. Check permission denial handling

**Expected Results:**
- Permission requests work correctly
- Denied permissions handled gracefully
- Fallback options available

## Test Scenarios

### Scenario 1: Field Technician Workflow

1. Technician goes to lab with mobile device
2. App loads offline from cache
3. Technician records QC measurements
4. Takes photos of samples
5. Updates inventory levels
6. Returns to office with internet
7. All changes sync automatically

**Expected Results:**
- All functionality works offline
- Photos capture and store correctly
- Data syncs when online
- No data loss

### Scenario 2: Network Interruption

1. User is actively using app
2. Network connection drops
3. User continues working
4. Network returns
5. Changes sync automatically

**Expected Results:**
- App continues working offline
- Changes are queued
- Sync happens automatically
- User experience is seamless

### Scenario 3: Multi-Device Sync

1. User makes changes on desktop
2. User makes changes on mobile
3. Both devices sync
4. Check for conflicts

**Expected Results:**
- Changes sync between devices
- Conflicts are detected
- Resolution works correctly
- Data consistency maintained

## Troubleshooting

### Common Issues

1. **Service Worker Not Registering**
   - Check HTTPS requirement
   - Verify file paths
   - Check browser console for errors

2. **Offline Mode Not Working**
   - Check cache configuration
   - Verify service worker scope
   - Test network simulation

3. **Sync Not Working**
   - Check API endpoints
   - Verify authentication
   - Check network connectivity

4. **Photo Capture Issues**
   - Check camera permissions
   - Verify HTTPS requirement
   - Test file upload fallback

### Debug Tools

- Chrome DevTools → Application tab
- Network tab for API monitoring
- Console for error messages
- Lighthouse for PWA audit

## Success Criteria

- [ ] App works offline
- [ ] Service worker registers correctly
- [ ] Sync engine functions properly
- [ ] Mobile pages are responsive
- [ ] Photo capture works
- [ ] Notifications function
- [ ] Offline storage works
- [ ] Error handling is robust
- [ ] Performance is acceptable
- [ ] Security is maintained

## Reporting

Document any issues found during testing:
- Steps to reproduce
- Expected vs actual behavior
- Browser/device information
- Console errors
- Screenshots if applicable
