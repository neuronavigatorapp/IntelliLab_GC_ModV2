# IntelliLab GC Test Plan

## Phase 1 — Discovery Results

### Frontend/Backend Stack Detected

**Frontend Stack:**
- **Framework**: React 18.2.0 with TypeScript
- **Build Tool**: React Scripts 5.0.1 (Create React App)
- **UI Libraries**: Radix UI, Material-UI, Framer Motion
- **Charts**: Chart.js, Recharts, Plotly.js
- **Routing**: React Router DOM 6.17.0
- **Testing**: Vitest 3.2.4 (unit), Playwright 1.55.0 (E2E) - already configured
- **Styling**: TailwindCSS 3.4.17

**Backend Stack:**
- **Framework**: FastAPI
- **Server**: Uvicorn running on port 8000
- **API**: Simple backend with health endpoints, calculation services
- **File**: `simple_backend.py` (722 lines)

### Interactive Controls Inventory

**Left Sidebar Panel (EnhancedSidebar):**
- Collapse/expand toggle button
- 8 collapsible navigation sections with 25+ navigation items total
- Section headers: Core (6 items), AI Assistant (5 items), Analysis Tools (3 items), Calculators (8 items), Simulation (2 items), Management (4 items), Utilities (3 items), Demo (1 item)
- Each navigation item is a button with icon + label

**Top Bar (Topbar):**
- Mobile menu toggle (hamburger button)
- Settings button (gear icon with rotation animation)
- Connection status indicator (online/offline badge)
- Last updated timestamp display

**Dashboard Content:**
- Summary cards with navigation buttons (4 cards in grid)
- Chart containers with mock data visualization
- Quick action buttons for calculators and tools
- Status indicators and progress bars

**Right Panel Analysis:**
- **Status**: No right panel found in current implementation
- **Components searched**: No RightPanel, right-panel, or secondary panel components exist
- **Layout structure**: Single sidebar (left) + main content area only

### UI Function Mapping

**Navigation Functions:**
- Sidebar navigation → React Router navigation calls (`onNavigate(path)`)
- All routes map to specific React components (25+ pages)
- Health check API calls every 30 seconds to `/health` endpoint

**Interactive Element Functions:**
- Sidebar toggle → Local state update (`setSidebarCollapsed`)
- Section expand/collapse → Local state update (`setExpandedSections`)
- Settings button → Modal state update (`setSettingsOpen`)
- Navigation items → Route changes via React Router
- Mobile menu → Overlay state toggle (`setSidebarOpen`)

**Backend API Endpoints Identified:**
- `/health` - Connection status check (200 OK responses observed)
- `/ai/maintenance-predictions` - AI maintenance analysis
- `/ai/cost-optimization` - AI cost analysis  
- `/ai/method-optimization` - AI method optimization
- `/calculations/detection-limit` - Detection limit calculations
- `/database/status` - Database connectivity check

### Placeholder Data Analysis

**Mock Data Found:**
- Dashboard.tsx line 45: `// Mock data for charts`
- Hardcoded chart data arrays: `instrumentData`, `runStatusData`, `qcTrendsData`, `consumableData`, `maintenanceData`
- Static status indicators: "All Systems Online", sample counts, percentages
- No dynamic data loading from backend APIs in dashboard

## Test Plan

### Tooling Choice & Rationale

**E2E Testing: Playwright** ✅ Already configured
- Native TypeScript support matches project stack
- Excellent React component interaction capabilities
- Already installed and configured in `playwright.config.ts`
- Works well with React Router for navigation testing

**Component/Unit Testing: Vitest + Testing Library** ✅ Already configured  
- Fast Jest-compatible test runner optimized for Vite projects
- React Testing Library already installed for component testing
- Setup file configured: `src/setupTests.ts`
- Better performance than Jest for this stack

### Selector Strategy

**Priority Order:**
1. **Semantic roles/labels** (preferred): `getByRole('button', { name: 'Settings' })`
2. **ARIA labels**: `getByLabelText('Main navigation')`
3. **Text content**: `getByText('Dashboard')`
4. **Test IDs** (last resort): `data-testid` only for components without semantic alternatives

**Minimal Selector Additions Needed:**
- Sidebar toggle button: Add `aria-label="Toggle sidebar"`
- Navigation sections: Add `aria-label` for each section
- Mobile menu overlay: Add `aria-label="Close mobile menu"`

### Coverage Goals

**1. Smoke Testing:**
- Click every button, link, and interactive element (25+ nav items + UI controls)
- Verify no console errors, unhandled exceptions, or navigation loops
- Test on Desktop Chrome (primary target from config)

**2. Panel Testing:**
- Left sidebar: expand/collapse, section toggles, navigation
- Right panel: Confirmed non-existent - no testing needed
- Mobile responsive behavior

**3. Dashboard Clean State:**
- Verify no placeholder/mock data visible to users
- Check for proper empty states with real backend disconnection
- Validate "no data" messaging is professional and informative

**4. Critical Flow Testing:**
- Navigation between all major sections
- Settings modal open/close
- Responsive layout behavior
- Connection status handling

### Files to Add/Modify

**Test Files to Create:**
```
frontend/tests/e2e/
├── smoke-test.spec.ts          # Click all interactive elements
├── navigation.spec.ts          # Route navigation testing  
├── panels.spec.ts             # Sidebar functionality
└── dashboard.spec.ts          # Dashboard clean state

frontend/src/__tests__/
├── components/
│   ├── Layout.test.tsx        # Layout component unit tests
│   ├── EnhancedSidebar.test.tsx # Sidebar component tests  
│   └── Dashboard.test.tsx     # Dashboard component tests
└── integration/
    └── api-integration.test.ts # Backend connectivity tests
```

**Minimal Code Changes for Testing:**
```typescript
// frontend/src/components/layout/Layout.tsx (line ~101)
// Add aria-label to sidebar toggle
<Button
  aria-label="Toggle sidebar"
  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
  // ... existing props
>

// frontend/src/components/EnhancedSidebar.tsx (line ~171) 
// Add section labels for better accessibility
<Button
  aria-label={`Toggle ${section.label} section`}
  onClick={() => toggleSection(section.id)}
  // ... existing props
>

// frontend/src/components/layout/Topbar.tsx (line ~42)
// Add mobile menu label
<Button
  aria-label="Open mobile menu"
  onClick={onMobileMenuClick}
  // ... existing props
>
```

**No Major Refactoring Required:**
- Existing component structure is test-friendly
- React Router and state management work well with testing libraries
- Current button/navigation patterns are accessible

### Success Criteria

- **Smoke Test**: 100% interactive elements clicked without errors
- **Panel Test**: Left sidebar fully functional, no right panel exists (expected)
- **Dashboard Test**: No mock data visible, proper empty states shown
- **Coverage**: >90% component test coverage for critical paths
- **Performance**: All tests complete in <2 minutes total runtime

## Next Phase Actions

1. **Phase 2**: Add minimal `aria-label` attributes (4-5 small changes)
2. **Phase 3**: Implement comprehensive test suite (4 E2E + 3 component test files)
3. **Phase 4**: Right panel investigation complete - component does not exist
4. **Phase 5**: Dashboard mock data replacement with proper empty states
5. **Phase 6**: Execute all tests and validate acceptance criteria

## Risk Assessment

**Low Risk**: Testing infrastructure already established, minimal code changes required
**Medium Risk**: Mock data replacement may require backend API integration
**No Risk**: Right panel issue non-existent - no debugging needed