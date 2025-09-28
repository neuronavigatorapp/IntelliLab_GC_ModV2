# Frontend Environment Variables

## Demo Mode Configuration

The frontend supports a demo mode that can be enabled using environment variables. When demo mode is active, the application uses mock data instead of making real API calls, allowing for demonstration and testing purposes.

### Environment Variables

#### VITE_DEMO
Controls whether the application runs in demo mode.

**Values:**
- `"true"` or `"1"` - Enable demo mode (shows demo badge, uses mock data)
- `"false"` or `""` or unset - Disable demo mode (uses real API)

**Example:**
```bash
VITE_DEMO=true npm run dev
```

#### VITE_FORCE_MOCKS
Force mock data even when not in demo mode (for testing).

**Values:**
- `"true"` or `"1"` - Force mock responses
- `"false"` or `""` or unset - Use normal API behavior

### Demo Mode Features

When `VITE_DEMO=true`:

1. **Visual Indicator**: A "Demo Mode" badge appears in the header
2. **Mock API Responses**: All API calls return predefined mock data
3. **Faster Response Times**: No network delays, immediate responses
4. **Consistent Data**: Always returns the same demo data for predictable testing

### Demo Mode Behavior by Feature

#### Split Ratio Calculator
- Returns mock calculation with demo explanation text
- Uses input values in calculation formulas
- Shows realistic engineering results

#### OCR Analysis
- Returns 3 demo peaks with realistic retention times and areas
- Includes baseline quality metrics
- Provides troubleshooting suggestions

#### Professional Calculators
- **Void Volume**: Calculates using provided dimensions, shows equation
- **Peak Capacity**: Uses gradient time and peak width, displays formula
- **Backflush Timing**: Applies safety factor to retention time

#### Health Check
- Returns healthy status with demo version info
- Shows all services as operational
- Includes mock uptime and connection status

### Development Usage

```bash
# Enable demo mode for development
VITE_DEMO=true npm run dev

# Build with demo mode enabled
VITE_DEMO=true npm run build

# Run tests with demo mode
VITE_DEMO=true npm run test
```

### Production Considerations

- Demo mode should typically be disabled in production
- The demo badge provides clear visual indication when active
- Mock data includes "demo" identifiers for transparency
- All demo responses include realistic scientific values

### Testing

The demo mode functionality is covered by E2E tests in `tests/demo-mode.spec.ts` that verify:
- Badge visibility based on environment variable
- Mock data responses when enabled
- Real API attempts when disabled
- Utility function behavior

### Implementation Details

- **Demo Detection**: `src/utils/demo.ts` - Utility functions for demo mode detection
- **API Client**: `src/lib/demoApiClient.ts` - Demo-aware API client wrapper
- **Mock Data**: Realistic GC analysis data for consistent testing
- **Console Logging**: Demo mode actions are logged with 🧪 emoji for visibility