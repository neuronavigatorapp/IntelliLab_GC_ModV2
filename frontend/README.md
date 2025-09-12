# IntelliLab GC - Professional GC Analysis Platform

A professional, enterprise-grade UI for gas chromatography analysis, simulation, and optimization tools.

## Features

- **Interactive Dashboard** - Clean, modern interface with feature overview
- **Detection Limit Calculator** - Professional 3σ method calculations
- **Oven Ramp Visualizer** - Temperature program design and visualization
- **Inlet Simulator** - Flow rate calculations and inlet configuration
- **Virtual Instruments** - GC instrument fleet management
- **Live Chromatogram Demo** - Interactive simulation with real-time visualization

## Tech Stack

- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **shadcn/ui** components
- **Framer Motion** for animations
- **Lucide React** for icons
- **React Router** for navigation

## Getting Started

### Prerequisites

- Node.js 16+ 
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Open [http://localhost:3000](http://localhost:3000) to view the application

### Building for Production

```bash
npm run build
```

### Generating Demo GIF

1. Start the development server:
```bash
npm start
```

2. In a new terminal, run the demo script:
```bash
npm run demo:gif
```

This will capture screenshots and provide instructions for creating an animated GIF.

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui base components
│   ├── Badge.tsx       # Feature badges
│   ├── TipCard.tsx     # Tip display component
│   ├── StatCard.tsx    # Statistics display
│   ├── ResultCard.tsx  # Calculation results
│   ├── LineChart.tsx   # SVG-based chart component
│   ├── RampEditor.tsx  # Oven ramp configuration
│   ├── Sidebar.tsx     # Navigation sidebar
│   ├── Topbar.tsx      # Top navigation bar
│   └── Toasts.tsx      # Toast notifications
├── pages/              # Main application pages
│   ├── Dashboard.tsx   # Landing page
│   ├── DetectionLimit.tsx
│   ├── OvenRamp.tsx
│   ├── InletSimulator.tsx
│   ├── Instruments.tsx
│   └── LiveChromatogramDemo.tsx
├── layouts/            # Layout components
│   └── AppLayout.tsx   # Main app layout
├── lib/                # Utilities and configuration
│   ├── utils.ts        # Utility functions
│   ├── theme.ts        # Design tokens
│   ├── routes.ts       # Route configuration
│   └── validators.ts   # Form validation
└── hooks/              # Custom React hooks
    └── use-toast.ts    # Toast notification hook
```

## Design System

### Colors
- **Primary**: Deep laboratory blue (`#1e40af`)
- **Accent**: Gold (`#fbbf24`)
- **Secondary**: Darker blue (`#1e293b`)

### Typography
- **Headings**: Inter font family
- **Body**: System font stack
- **Hierarchy**: xl/2xl for headlines, base for body, sm for footers

### Components
- **Cards**: Rounded corners (`rounded-2xl`), subtle shadows
- **Buttons**: Primary (solid), Secondary (outline), Ghost (minimal)
- **Forms**: Clean inputs with validation states
- **Navigation**: Persistent sidebar with collapsible states

## Key Features

### Professional Calculations
- Detection limit using 3σ method
- Flow rate calculations with temperature/pressure corrections
- Oven ramp timing and temperature profiles

### Interactive Visualizations
- Real-time chromatogram simulation
- Temperature profile charts
- Flow rate diagrams

### Enterprise UX
- Responsive design (desktop, tablet, mobile)
- Accessibility features (keyboard navigation, ARIA labels)
- Professional animations and transitions
- Toast notifications for user feedback

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Development

### Adding New Components

1. Create component in `src/components/`
2. Export from appropriate index file
3. Add to storybook if needed
4. Write tests in `src/__tests__/`

### Styling Guidelines

- Use Tailwind CSS classes
- Follow the design system tokens
- Use `cn()` utility for conditional classes
- Prefer composition over custom CSS

### Animation Guidelines

- Use Framer Motion for complex animations
- Keep animations subtle and professional
- Respect user's motion preferences
- Use `transition` prop for simple animations

## License

This project is for demonstration purposes as part of a LinkedIn showcase.