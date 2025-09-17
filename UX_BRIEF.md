# UX Brief & Information Architecture

## Vision Statement
Transform IntelliLab GC into a **portfolio-grade analytical laboratory management system** that rivals enterprise solutions from major instrument manufacturers. The interface should feel fast, intuitive, and visually striking while maintaining scientific precision and professional credibility.

## Design Principles

### 1. **Professional Scientific Aesthetic**
- Dark-first design using canonical logo palette
- Clean, minimal interfaces that prioritize data visibility
- Enterprise-grade polish with subtle animations and micro-interactions
- Typography hierarchy that enhances readability of scientific data

### 2. **Workflow-Centric Information Architecture** 
- Task-oriented navigation matching real laboratory workflows
- Contextual information delivery through right panel system
- Progressive disclosure - show complexity only when needed
- Quick actions accessible from any screen

### 3. **Performance & Accessibility**
- Sub-200ms interaction responses for all UI actions
- Full keyboard navigation with visible focus indicators
- Screen reader compatible with proper ARIA labeling
- Reduced motion respected throughout

### 4. **Data-Dense Interface Optimization**
- Charts and visualizations as first-class citizens
- Multi-layered information hierarchy with clear visual separation
- Efficient use of screen real estate on all device sizes
- Export capabilities built into every data view

---

## Global Layout Architecture

### **Three-Panel Layout System**

```
┌─────────────────────────────────────────────────────────────┐
│ Top Bar (Navigation + Status + User)                       │
├──────────┬────────────────────────────────┬─────────────────┤
│          │                                │                 │
│   Left   │         Main Content           │   Right Panel   │
│   Nav    │         (Primary Focus)        │   (Contextual)  │
│   240px  │                                │   320px         │
│          │                                │   (Collapsible) │
│          │                                │                 │
│          │                                │                 │
│          │                                │                 │
├──────────┴────────────────────────────────┴─────────────────┤
│ Status Bar (Optional - for process monitoring)              │
└─────────────────────────────────────────────────────────────┘
```

### **Responsive Breakpoints**
- **Desktop (≥1200px)**: Full three-panel layout
- **Tablet (768-1199px)**: Collapsible left nav, overlay right panel  
- **Mobile (≤767px)**: Bottom nav, full-screen modals, swipe gestures

---

## Component Hierarchy

### **Top Bar (64px height)**
```tsx
<TopBar>
  <Logo />
  <GlobalNavigation />
  <SearchCommand />          // Ctrl/⌘K trigger
  <StatusIndicators />       // API, queue, alerts
  <UserProfile />
</TopBar>
```

### **Left Navigation (240px width)**
**Primary Sections** (Always visible):
- 🏠 **Home/Overview** - Dashboard and quick actions
- 🧪 **Analysis** - Chromatography tools and AI features  
- ⚗️ **Simulation** - Calculators and modeling tools
- 📊 **Data** - Results, reports, and historical data
- ⚙️ **Settings** - Configuration and preferences

**Nested Structure**:
```
🏠 Home
   └─ Dashboard
   └─ Quick Actions

🧪 Analysis  
   ├─ Chromatography Analysis
   │  ├─ Raw Chromatogram Processing
   │  ├─ Peak Detection  
   │  └─ Method Development
   ├─ AI & Analytics
   │  ├─ Intelligent Troubleshooting
   │  ├─ Method Optimization
   │  ├─ Predictive Maintenance
   │  └─ Cost Optimization
   └─ OCR Import (if enabled)

⚗️ Simulation
   ├─ Detection Limit Calculator
   ├─ Oven Ramp Simulator  
   ├─ Inlet Simulator
   └─ Live Chromatogram Demo

📊 Data
   ├─ Recent Results
   ├─ Batch Reports
   └─ Knowledge Base (if enabled)

⚙️ Settings
   ├─ API Connection
   ├─ Feature Flags
   ├─ Theme & Display
   └─ Data Retention
```

### **Right Panel (320px width, collapsible)**
**Context-sensitive content**:
- **Default**: System status, recent activity
- **Analysis Pages**: Citations, method details, troubleshooting steps
- **Simulation**: Parameter history, presets, export options
- **Results**: Metadata, quality metrics, sharing options

**Panel States**:
- **Expanded** (default): Full 320px width
- **Collapsed**: 48px icon-only strip
- **Hidden**: Mobile/narrow screens - access via overlay

---

## Page-Level Flows & Features

### **1. Home/Overview Page**
**Hero Section** (Above the fold):
- Animated instrument diagram showing system flow
- Live status tiles: API connection, last analysis, queue depth
- Quick action buttons to common workflows

**Secondary Sections**:
- Recent activity timeline
- Performance metrics dashboard  
- Shortcut grid to frequently used tools

**Right Panel**: System health, upcoming maintenance, notifications

### **2. Chromatography Analysis Hub**
**Raw Chromatogram Processing**:
- Drag-and-drop file upload with preview
- Interactive plot with zoom, pan, baseline adjustment
- Peak detection controls with real-time preview
- Export options (PNG, PDF, CSV, method parameters)

**Method Development Tracker**:
- Parameter optimization workflow
- A/B comparison views  
- Automated suggestions based on compound library
- Progress tracking with milestone checkpoints

**Right Panel**: Method history, compound database, calculation details

### **3. AI & Analytics Suite**  
**Intelligent Troubleshooting**:
- **Left**: Step-by-step diagnostic workflow with progress indicator
- **Center**: Current step details with user input forms
- **Right**: Related insights, citations (if Knowledge enabled), calculator outputs

**Method Optimization**:
- Current vs. optimized parameter comparison
- Confidence scores and rationale for suggestions  
- Interactive parameter tuning with live predictions
- Success probability indicators

**Right Panel**: Historical optimization data, related methods, performance trends

### **4. Simulation Laboratory**
**Calculator Grid Layout**:
- Card-based interface for different simulation tools
- Each tool opens in modal or dedicated sub-page
- Consistent input/output patterns across all calculators

**Live Chromatogram Demo**:
- Real-time visualization with parameter controls
- Multiple compound overlays with individual controls
- Animation speed control with pause/play
- Export animated GIF capability

**Right Panel**: Saved configurations, calculation history, preset library

### **5. OCR Import Feature** (Feature flag: `OCR_ENABLED`)
**Upload Interface**:
- Camera capture OR file drop zone
- Multiple file support with batch processing
- Progress indicators for each file

**Field Extraction Review**:
- Side-by-side: Original image + extracted fields
- Confidence scores with color coding (green/yellow/red)
- Inline editing for corrections
- Accept/Reject workflow with bulk operations

**Right Panel**: Processing queue, extraction settings, field mappings

### **6. Knowledge System** (Feature flag: `RAG_ENABLED`)
**Search Interface**:
- Prominent search bar with autocomplete
- Filter chips: document type, date range, confidence
- Results with document + page number chips
- Snippet preview with highlighting

**Detail View**:
- Full document viewer with search highlighting  
- Citation copy button with proper formatting
- Related documents suggestions
- Usage analytics (view count, bookmark status)

**Right Panel**: Search history, bookmarks, document metadata

---

## Signature "Wow" Interactions

### **1. Animated Instrument Map**
**Implementation**:
- SVG-based flow diagram showing sample path
- Smooth animations respecting `prefers-reduced-motion`
- Hover states reveal component details and live values
- Click interactions open relevant calculation tools

**Technical Details**:
- Framer Motion for orchestrated animations
- D3.js for data-driven visualizations  
- Canvas fallback for complex animations on lower-end devices

### **2. Chromatogram Studio**
**Multi-Trace Overlays**:
- Drag-and-drop to add/remove traces
- Individual color/style controls per trace
- Crosshair with real-time RT/intensity readouts
- Synchronized zoom/pan across all traces

**Parameter Sweep Visualization**:
- Animated transitions between parameter sets
- Ghost traces showing optimization path
- Interactive legend with show/hide toggles

### **3. Command Palette** (Ctrl/⌘K)
**Global Actions**:
- Navigate to any page/tool
- Quick calculations ("calculate split ratio 1:20")
- Recent files and saved configurations
- Settings toggles

**Smart Search**:
- Fuzzy matching with relevance scoring
- Recent/frequent actions prioritized
- Keyboard-only navigation with arrow keys

### **4. Keyboard Shortcuts System**
**Global Shortcuts**:
- `Ctrl/⌘K`: Command palette
- `Ctrl/⌘Shift+T`: Toggle troubleshooter
- `Ctrl/⌘Shift+S`: Open simulation lab
- `Ctrl/⌘Shift+R`: Toggle right panel
- `Esc`: Close overlays/modals

**Page-Specific**: 
- Analysis pages: `Space` = play/pause, `R` = reset view
- Calculator pages: `Enter` = calculate, `Ctrl/⌘E` = export
- Data pages: `Ctrl/⌘F` = search, `Ctrl/⌘D` = download

---

## Functional Requirements

### **API Integration**
- **Environment Variable**: `API_URL` for all backend communication
- **Error Handling**: Inline errors + toast notifications for critical failures
- **Loading States**: Skeleton screens for data-heavy pages, spinners for quick actions
- **Offline Support**: Cache recent data, queue actions when offline

### **Feature Flags** 
- `RAG_ENABLED`: Shows/hides Knowledge system entirely
- `OCR_ENABLED`: Shows/hides OCR import functionality  
- `DEMO_MODE`: Populates with sample data, disables destructive actions

### **Data Export**
**Universal Export Menu** (Available on all data views):
- PNG (charts/visualizations)
- PDF (formatted reports)  
- CSV (raw data)
- JSON (structured data + metadata)

### **Empty States**
**Professional messaging** for all empty states:
- **No Data**: Clear calls-to-action with guided next steps
- **Loading**: Informative progress with time estimates
- **Errors**: Specific error messages with resolution steps
- **Feature Disabled**: Explanation + instructions to enable

---

## Accessibility Standards

### **WCAG 2.1 AA Compliance**
- **Color**: 4.5:1 contrast ratio minimum, no color-only information
- **Focus**: Visible focus indicators using canonical primary color
- **Navigation**: Full keyboard support, logical tab order
- **Content**: Screen reader friendly with proper heading hierarchy

### **Keyboard Navigation**
- **Tab Order**: Logical flow matching visual layout
- **Focus Traps**: Modal dialogs and overlays contain focus  
- **Skip Links**: Jump to main content, skip repetitive navigation
- **Escape Routes**: ESC key closes overlays consistently

### **Screen Reader Support**
- **ARIA Labels**: All interactive elements properly labeled
- **Live Regions**: Status updates announced automatically
- **Landmarks**: Proper semantic HTML structure
- **Alt Text**: Descriptive text for all images and icons

---

## Performance Requirements

### **Core Web Vitals Targets**
- **LCP (Largest Contentful Paint)**: <2.5s
- **FID (First Input Delay)**: <100ms  
- **CLS (Cumulative Layout Shift)**: <0.1

### **Runtime Performance**
- **Interaction Response**: <200ms for all UI interactions
- **Chart Rendering**: <500ms for complex visualizations
- **Page Navigation**: <100ms route transitions
- **Data Loading**: Streaming updates for large datasets

### **Bundle Optimization**
- **Code Splitting**: Route-based + feature-based chunks
- **Tree Shaking**: Remove unused chart libraries and utilities
- **Image Optimization**: WebP with fallbacks, proper sizing
- **Font Loading**: Swap strategy with system fallbacks

---

## Content Strategy

### **Tone & Voice**
- **Professional**: Scientific precision without jargon
- **Helpful**: Contextual guidance and clear explanations
- **Confident**: Authoritative but not overwhelming
- **Efficient**: Concise copy that respects user time

### **Microcopy Standards**
- **Button Labels**: Action-oriented ("Calculate Detection Limit" not "Calculate")
- **Error Messages**: Specific problem + clear resolution step  
- **Help Text**: Context-sensitive tooltips, not generic descriptions
- **Loading Messages**: Progress indication with meaningful status

### **Empty State Messaging**
- **No Results**: "No chromatograms match your filters" + suggestions
- **No Data**: "Start by uploading a chromatogram or running a simulation"
- **Feature Disabled**: "Enable RAG in Settings to access the Knowledge Base"

---

## Technical Implementation Notes

### **State Management**
- **Local State**: React useState/useReducer for component state
- **Global State**: Context API for user preferences, feature flags
- **Server State**: React Query for API data caching and synchronization
- **URL State**: React Router for shareable page states

### **Styling Architecture**  
- **CSS Custom Properties**: Canonical theme tokens drive all styling
- **Tailwind Utilities**: Layout and spacing with custom theme integration
- **Component Styles**: Co-located CSS modules for component-specific styles
- **Animation**: Framer Motion for complex animations, CSS transitions for simple ones

### **Component Strategy**
- **Design System**: Reusable components following canonical color palette
- **Composition**: Compound components for complex interfaces (Chart, Modal, etc.)
- **Accessibility**: Built-in a11y features, not added as afterthought
- **Testing**: Component testing with React Testing Library, visual regression tests

---

## Success Metrics

### **User Experience**
- **Task Completion Rate**: >95% for primary workflows
- **Error Recovery**: <2 clicks to resolve common errors
- **Learning Curve**: New users productive within 5 minutes
- **Satisfaction**: Professional impression that builds confidence

### **Technical Performance**
- **Lighthouse Scores**: Performance ≥90, Accessibility ≥95, Best Practices ≥95
- **Bundle Size**: <2MB initial load, <500KB per route chunk
- **Memory Usage**: <100MB sustained, no memory leaks
- **Battery Impact**: Minimal impact on mobile devices

### **Business Impact**
- **Portfolio Quality**: Suitable for LinkedIn showcases and client demos
- **Competitive Edge**: Feature parity with major instrument software
- **Extensibility**: Easy to add new calculators and analysis tools
- **Maintainability**: Clear architecture that supports rapid development

---

*Last Updated: 2025-01-16*  
*Status: Ready for Implementation*