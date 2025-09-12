# Phase 7 Testing Guide - Training & Education Mode

## Overview

Phase 7 introduces a comprehensive training and education system with white-label branding support. This guide covers testing procedures for all new features.

## Feature Flags

### Training Module
- `enableTraining`: Controls visibility of training features
- `enableInstructor`: Controls instructor tools
- `enableWhiteLabel`: Controls white-label branding

## Backend Testing

### 1. Training Service Tests

#### Test Training Service Initialization
```bash
# Start backend
cd backend
python -m uvicorn main:app --reload

# Test training endpoints
curl http://localhost:8000/api/v1/training/lessons
curl http://localhost:8000/api/v1/training/exercises/types
curl http://localhost:8000/api/v1/training/difficulties
```

#### Test Exercise Creation and Scoring
```bash
# Create a method setup exercise
curl -X POST http://localhost:8000/api/v1/training/exercises \
  -H "Content-Type: application/json" \
  -d '{
    "lesson_id": 1,
    "type": "method_setup",
    "difficulty": "intermediate",
    "prompt": "Configure GC method for BTEX analysis",
    "initial_state": {"oven": {"initial_temp": 40}},
    "expected_outcome": {"oven": {"initial_temp": 40}},
    "scoring_rubric": {"tolerance": {"temperature": 5.0}}
  }'

# Start attempt
curl -X POST http://localhost:8000/api/v1/training/attempts/start \
  -H "Content-Type: application/json" \
  -d '{"exercise_id": 1, "user_id": 1}'

# Submit attempt
curl -X POST http://localhost:8000/api/v1/training/attempts/submit \
  -H "Content-Type: application/json" \
  -d '{
    "exercise_id": 1,
    "answers": {"oven": {"initial_temp": 42}},
    "time_taken_sec": 300
  }'
```

### 2. Instructor Service Tests

#### Test Course Management
```bash
# Create course
curl -X POST http://localhost:8000/api/v1/instructor/courses \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Advanced GC Methods",
    "description": "Advanced techniques",
    "lessons_ordered_ids": [1, 2],
    "difficulty": "advanced",
    "tags": ["advanced", "methods"],
    "est_total_hours": 3.0
  }'

# Assign course to users
curl -X POST http://localhost:8000/api/v1/instructor/courses/1/assign \
  -H "Content-Type: application/json" \
  -d '{"course_id": 1, "user_ids": [1, 2]}'

# Get course analytics
curl http://localhost:8000/api/v1/instructor/courses/1/analytics
```

#### Test Grade Overrides
```bash
# Override grade
curl -X POST http://localhost:8000/api/v1/instructor/attempts/1/override \
  -H "Content-Type: application/json" \
  -d '{
    "score": 85.0,
    "manual_notes": "Good effort, minor improvements needed",
    "reason": "Instructor review"
  }'
```

### 3. Branding Service Tests

#### Test Theme Management
```bash
# Get current theme
curl http://localhost:8000/api/v1/branding/theme

# Update theme
curl -X PUT http://localhost:8000/api/v1/branding/theme \
  -H "Content-Type: application/json" \
  -d '{
    "primary_color": "#1e40af",
    "accent_color": "#3b82f6",
    "company_name": "Test Lab",
    "logo_url": "/static/images/test-logo.png"
  }' \
  -G -d "org_id=1"

# Get CSS variables
curl http://localhost:8000/api/v1/branding/theme/css-vars

# Validate theme data
curl -X GET "http://localhost:8000/api/v1/branding/theme/validate" \
  -G -d "primary_color=%23invalid"
```

## Frontend Testing

### 1. Training Module Tests

#### Test Training Home Page
1. Navigate to `/training`
2. Verify training cards are displayed
3. Check progress indicators work
4. Test course filtering by difficulty
5. Verify responsive design on mobile

#### Test Exercise Runner
1. Navigate to `/training/exercise/1`
2. Test all exercise types:
   - **Method Setup**: Configure oven, inlet, detector parameters
   - **Fault Diagnosis**: Select causes and solutions
   - **Chromatogram QC**: Use simulator and analyze peaks
   - **Quiz**: Answer multiple choice and text questions
3. Test timer functionality
4. Test hints system
5. Test submission process

#### Test Offline Functionality
1. Disconnect network
2. Start exercise
3. Submit answers
4. Reconnect network
5. Verify sync occurs

### 2. Instructor Module Tests

#### Test Course Builder
1. Navigate to instructor tools (if enabled)
2. Create new course
3. Add lessons to course
4. Reorder lessons
5. Publish course

#### Test Enrollment Management
1. Assign course to users
2. View enrollment status
3. Track user progress
4. Apply grade overrides

#### Test Analytics
1. View course analytics
2. Export course data
3. Generate progress reports

### 3. White-Label Branding Tests

#### Test Theme Application
1. Update theme colors
2. Verify CSS variables update
3. Check logo changes
4. Test typography changes
5. Verify footer links update

#### Test Branding Provider
1. Check theme loading
2. Test fallback to default theme
3. Verify error handling
4. Test theme switching

## Integration Tests

### 1. End-to-End Training Flow
1. User enrolls in course
2. Completes lesson content
3. Takes exercise
4. Receives score and feedback
5. Instructor reviews and overrides if needed
6. User receives certificate

### 2. White-Label Integration
1. Organization sets custom theme
2. All users see branded interface
3. Logo and colors apply consistently
4. Theme persists across sessions

### 3. Offline Training
1. User downloads course content
2. Completes exercises offline
3. Syncs when back online
4. Progress updates correctly

## Performance Tests

### 1. Training Module Performance
- Load 100+ courses efficiently
- Handle concurrent exercise attempts
- Process real-time scoring
- Manage offline sync queue

### 2. Branding Performance
- Apply theme changes instantly
- Handle large logo files
- Cache theme configurations
- Optimize CSS variable updates

## Security Tests

### 1. Training Security
- Verify user can only access assigned courses
- Test exercise attempt limits
- Validate scoring integrity
- Check instructor permissions

### 2. Branding Security
- Validate theme data input
- Prevent XSS in custom content
- Secure theme file uploads
- Test organization isolation

## Accessibility Tests

### 1. Training Accessibility
- Screen reader compatibility
- Keyboard navigation
- Color contrast compliance
- Alternative text for images

### 2. Branding Accessibility
- Custom themes maintain accessibility
- Logo alt text support
- High contrast mode compatibility
- Font size scaling

## Mobile Testing

### 1. Training Mobile Experience
- Responsive exercise interfaces
- Touch-friendly controls
- Offline functionality
- Mobile-optimized content

### 2. Branding Mobile
- Theme applies on mobile
- Logo scales properly
- Touch-friendly navigation
- Mobile-specific layouts

## Browser Compatibility

### Test in Multiple Browsers
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

### Test Features
- CSS custom properties support
- Service worker functionality
- IndexedDB storage
- WebSocket connections

## Error Handling Tests

### 1. Training Error Scenarios
- Network disconnection during exercise
- Invalid exercise data
- Scoring algorithm errors
- Sync conflicts

### 2. Branding Error Scenarios
- Invalid theme data
- Missing logo files
- CSS parsing errors
- Theme loading failures

## Data Validation Tests

### 1. Training Data Validation
- Exercise schema validation
- Scoring rubric validation
- User progress validation
- Course structure validation

### 2. Branding Data Validation
- Color format validation
- Logo URL validation
- Typography validation
- Company info validation

## Manual Test Checklist

### Training Module
- [ ] Training home page loads correctly
- [ ] Course cards display properly
- [ ] Progress indicators work
- [ ] Exercise runner functions
- [ ] All exercise types work
- [ ] Timer functionality works
- [ ] Hints system works
- [ ] Submission process works
- [ ] Offline functionality works
- [ ] Sync works correctly

### Instructor Module
- [ ] Course builder works
- [ ] Enrollment management works
- [ ] Grade overrides work
- [ ] Analytics display correctly
- [ ] Export functionality works

### White-Label Branding
- [ ] Theme loading works
- [ ] Color changes apply
- [ ] Logo changes work
- [ ] Typography updates
- [ ] CSS variables apply
- [ ] Fallback themes work
- [ ] Error handling works

### Integration
- [ ] End-to-end training flow
- [ ] White-label integration
- [ ] Offline functionality
- [ ] Performance under load
- [ ] Security measures
- [ ] Accessibility compliance
- [ ] Mobile responsiveness
- [ ] Browser compatibility

## Troubleshooting

### Common Issues

1. **Training module not visible**
   - Check `enableTraining` feature flag
   - Verify backend training service is running

2. **Exercise scoring not working**
   - Check exercise schema validation
   - Verify scoring algorithm implementation
   - Check backend logs for errors

3. **Theme not applying**
   - Check `enableWhiteLabel` feature flag
   - Verify CSS variables are set
   - Check browser console for errors

4. **Offline sync not working**
   - Check service worker registration
   - Verify IndexedDB initialization
   - Check network connectivity

### Debug Commands

```bash
# Check backend health
curl http://localhost:8000/health

# Check training service
curl http://localhost:8000/api/v1/training/stats

# Check branding service
curl http://localhost:8000/api/v1/branding/theme

# Check feature flags
curl http://localhost:8000/api/v1/user/preferences
```

## Performance Benchmarks

### Training Module
- Page load: < 2 seconds
- Exercise start: < 1 second
- Scoring calculation: < 500ms
- Sync operation: < 3 seconds

### Branding Module
- Theme load: < 1 second
- CSS update: < 100ms
- Logo load: < 2 seconds
- Theme switch: < 500ms

## Success Criteria

### Training Module
- [ ] Users can enroll in courses
- [ ] Exercises function correctly
- [ ] Scoring works accurately
- [ ] Progress tracking works
- [ ] Offline functionality works
- [ ] Instructor tools work

### White-Label Branding
- [ ] Themes apply correctly
- [ ] Colors update instantly
- [ ] Logos display properly
- [ ] Typography changes work
- [ ] Fallback themes work
- [ ] Error handling works

### Integration
- [ ] End-to-end flows work
- [ ] Performance meets benchmarks
- [ ] Security measures effective
- [ ] Accessibility standards met
- [ ] Mobile experience good
- [ ] Browser compatibility verified
