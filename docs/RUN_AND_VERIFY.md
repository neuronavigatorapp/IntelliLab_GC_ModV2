# IntelliLab GC - Run and Verify Guide

This guide provides cross-platform instructions for running the IntelliLab GC application and verifying the logo integration and brand preview functionality.

## Prerequisites

- Node.js 16+ installed
- npm or yarn package manager
- Modern web browser (Chrome, Firefox, Safari, Edge)

## Running the Application

### Windows PowerShell

```powershell
cd frontend
npm run dev
```

### Windows Command Prompt (cmd.exe)

```cmd
cd frontend
npm run dev
```

### macOS/Linux Terminal

```bash
cd frontend
npm run dev
```

## Accessing the Application

Once the development server starts, open your browser and navigate to:

- **Main Application**: `http://localhost:5173` (or the port shown in terminal)
- **Brand Preview**: `http://localhost:5173/brand-preview` (development only)

## Verification Checklist

### 1. Logo Display Verification

- [ ] Logo appears in the top navigation bar
- [ ] Logo appears in the Master Launcher page
- [ ] Logo maintains proper aspect ratio
- [ ] Logo is properly sized (32px in nav, 80px in launcher)
- [ ] Logo has proper alt text for accessibility

### 2. Brand Preview Page (Development Only)

Navigate to `/brand-preview` and verify:

- [ ] Page loads without errors
- [ ] Logo displays at all sizes (32, 48, 96, 192, 512px)
- [ ] Fallback toggle works (switches between PNG and JPG)
- [ ] Logo displays correctly on both background types
- [ ] All images have proper alt text
- [ ] No console errors

### 3. Fallback Functionality

- [ ] PNG loads as primary source
- [ ] JPG loads as fallback when PNG fails
- [ ] Fallback happens automatically on image error
- [ ] No broken image icons appear

### 4. PWA Manifest Icons

- [ ] `logo192.png` is referenced in manifest
- [ ] `logo512.png` is referenced in manifest
- [ ] No references to `IntelliLab_GC_logo.png` in manifest
- [ ] Icons have proper `purpose` attributes

### 5. Development Tools

- [ ] Brand Preview link appears in Master Launcher (dev mode only)
- [ ] Link navigates to `/brand-preview` correctly
- [ ] Link is hidden in production builds

## Troubleshooting

### Logo Not Loading

1. Check browser console for 404 errors
2. Verify logo files exist in `frontend/public/`:
   - `IntelliLab_GC_logo.png`
   - `IntelliLab_GC_logo.jpg`
   - `logo192.png`
   - `logo512.png`

### Brand Preview Not Accessible

1. Ensure you're running in development mode (`NODE_ENV !== 'production'`)
2. Check that the route is properly configured in `App.tsx`
3. Verify `BrandPreview` component is imported correctly

### Fallback Not Working

1. Check browser console for JavaScript errors
2. Verify `useImageWithFallback` hook is properly imported
3. Ensure both PNG and JPG files exist in public directory

### Build Issues

```bash
# Clean and reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Clear build cache
npm run build -- --force
```

## File Structure Verification

Ensure these files exist and are properly configured:

```
frontend/
├── public/
│   ├── IntelliLab_GC_logo.png
│   ├── IntelliLab_GC_logo.jpg
│   ├── logo192.png
│   ├── logo512.png
│   └── manifest.webmanifest
├── src/
│   ├── components/Shell/
│   │   ├── BrandingProvider.tsx
│   │   ├── TopNav.tsx
│   │   └── MasterLauncher.tsx
│   ├── pages/
│   │   └── BrandPreview.tsx
│   ├── utils/
│   │   └── useImageWithFallback.ts
│   └── App.tsx
```

## Performance Notes

- Logo files should be optimized for web (compressed PNG/JPG)
- Consider using WebP format for modern browsers
- Implement lazy loading for large logo variants
- Use appropriate image sizes for different contexts

## Accessibility

- All logo images have descriptive alt text
- Logo maintains contrast ratio requirements
- Fallback text is provided for screen readers
- Keyboard navigation works with logo elements

## Cross-Browser Testing

Test the logo integration in:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile browsers (iOS Safari, Chrome Mobile)

## Production Deployment

Before deploying to production:

1. Verify all logo files are included in the build
2. Test fallback functionality in production environment
3. Ensure PWA manifest icons are properly served
4. Validate accessibility compliance
5. Test on target devices and browsers
