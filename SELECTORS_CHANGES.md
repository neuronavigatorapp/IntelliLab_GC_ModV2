# Selector Changes for Test Infrastructure

## Problem Analysis

After running the existing test suite, I've identified critical issues that need to be resolved before implementing new tests:

### Testing Infrastructure Issues Found:

1. **ResizeObserver Error** - Dashboard charts fail due to JSDOM not having ResizeObserver API
2. **Playwright Configuration** - Test files calling test.describe() in wrong context
3. **Axios Interceptor Issues** - API tests failing due to undefined interceptors

## Required Selector Additions (Minimal Changes)

Based on the accessibility audit and testing needs, here are the **exact 5 elements** that need stable selectors:

### 1. Sidebar Toggle Button
**File**: `frontend/src/components/layout/Layout.tsx`  
**Line**: ~101  
**Current**: No accessible label  
**Change**: Add `aria-label="Toggle sidebar"`

```tsx
// BEFORE
<EnhancedSidebar
  currentPath={currentPath}
  onNavigate={onNavigate}
  collapsed={sidebarCollapsed}
  onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
/>

// AFTER  
<EnhancedSidebar
  currentPath={currentPath}
  onNavigate={onNavigate}
  collapsed={sidebarCollapsed}
  onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
  aria-label="Toggle sidebar"
/>
```

**Why needed**: Sidebar toggle has no accessible way to select it for testing. This is the primary navigation control.

### 2. Navigation Section Headers
**File**: `frontend/src/components/EnhancedSidebar.tsx`  
**Line**: ~171  
**Current**: Button with no section context  
**Change**: Add section-specific aria-label

```tsx
// BEFORE
<Button
  onClick={() => toggleSection(section.id)}
  className="w-full flex items-center justify-between p-3"
>

// AFTER
<Button
  aria-label={`Toggle ${section.label} section`}
  onClick={() => toggleSection(section.id)}
  className="w-full flex items-center justify-between p-3"
>
```

**Why needed**: Section headers are critical for navigation testing but lack distinguishable labels (Core, AI Assistant, etc).

### 3. Mobile Menu Button
**File**: `frontend/src/components/layout/Topbar.tsx`  
**Line**: ~42  
**Current**: Generic button with Menu icon  
**Change**: Add `aria-label="Open mobile menu"`

```tsx
// BEFORE
<Button
  variant="ghost"
  size="sm"
  onClick={onMobileMenuClick}
  className="lg:hidden p-3 hover:bg-slate-100/70 text-slate-700 rounded-xl"
>

// AFTER
<Button
  variant="ghost" 
  size="sm"
  onClick={onMobileMenuClick}
  aria-label="Open mobile menu"
  className="lg:hidden p-3 hover:bg-slate-100/70 text-slate-700 rounded-xl"
>
```

**Why needed**: Mobile responsiveness testing requires stable selector for hamburger menu.

### 4. Settings Button
**File**: `frontend/src/components/layout/Topbar.tsx`  
**Line**: ~82  
**Current**: Generic button with Settings icon  
**Change**: Add `aria-label="Open settings"`

```tsx
// BEFORE  
<Button
  variant="ghost"
  size="sm"
  onClick={onSettingsClick}
  className="p-3 hover:bg-white/70 text-slate-600 hover:text-slate-800 rounded-xl"
>

// AFTER
<Button
  variant="ghost"
  size="sm"
  onClick={onSettingsClick}
  aria-label="Open settings"
  className="p-3 hover:bg-white/70 text-slate-600 hover:text-slate-800 rounded-xl"
>
```

**Why needed**: Settings modal is key functionality but button has no accessible label.

### 5. Connection Status Indicator  
**File**: `frontend/src/components/layout/Topbar.tsx`  
**Line**: ~58  
**Current**: Status badge with no semantic meaning  
**Change**: Add `aria-label` with dynamic status

```tsx
// BEFORE
<div className="flex items-center space-x-3 bg-white/60 backdrop-blur-sm rounded-xl px-4 py-2.5">
  <div className={cn(
    "w-3 h-3 rounded-full relative",
    isOnline ? "bg-emerald-500 shadow-lg shadow-emerald-500/50" : "bg-red-500 shadow-lg shadow-red-500/50"
  )}>

// AFTER  
<div 
  className="flex items-center space-x-3 bg-white/60 backdrop-blur-sm rounded-xl px-4 py-2.5"
  aria-label={`Backend connection status: ${isOnline ? 'Connected' : 'Disconnected'}`}
  role="status"
>
  <div className={cn(
    "w-3 h-3 rounded-full relative",
    isOnline ? "bg-emerald-500 shadow-lg shadow-emerald-500/50" : "bg-red-500 shadow-lg shadow-red-500/50"
  )}>
```

**Why needed**: Connection testing requires reliable way to check backend connectivity status.

## Infrastructure Fixes Required (Before Selector Changes)

### 1. ResizeObserver Polyfill
**File**: `frontend/src/setupTests.ts`  
**Add**: ResizeObserver mock for JSDOM

```typescript
// Add to setupTests.ts
global.ResizeObserver = class ResizeObserver {
  constructor(callback: ResizeObserverCallback) {}
  observe(target: Element, options?: ResizeObserverOptions) {}
  unobserve(target: Element) {}
  disconnect() {}
};
```

### 2. Playwright Configuration Fix
**Issue**: Test files in wrong directory calling test.describe()  
**Solution**: Move E2E tests to proper structure or fix imports

### 3. Axios Mock Setup  
**Issue**: API interceptors undefined in test environment  
**Solution**: Proper axios mocking in test setup

## Implementation Order

1. **Fix infrastructure issues** (ResizeObserver, Playwright config)
2. **Add 5 accessibility labels** (minimal surface changes)  
3. **Verify existing tests pass** with new infrastructure
4. **Implement new test suites** using stable selectors

## Validation Approach

After changes:
- `getByRole('button', { name: 'Toggle sidebar' })` ✅
- `getByRole('button', { name: 'Toggle Core section' })` ✅  
- `getByRole('button', { name: 'Open mobile menu' })` ✅
- `getByRole('button', { name: 'Open settings' })` ✅
- `getByRole('status', { name: /Backend connection status/ })` ✅

**Total Changes**: 5 minimal aria-label additions + 3 infrastructure fixes  
**No refactoring**: Existing component structure preserved  
**Accessibility improvement**: Better screen reader support as side benefit