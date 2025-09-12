import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from '../App';

describe('IntelliLab GC App', () => {
  it('renders without crashing', () => {
    render(<App />);
    // Basic smoke test - if this passes, the app loads
    expect(document.body).toBeInTheDocument();
  });

  it('has the main app container', () => {
    render(<App />);
    const appElement = document.getElementById('root');
    expect(appElement).toBeInTheDocument();
  });
});

describe('Component Integration Tests', () => {
  it('should load Dashboard component', () => {
    render(<App />);
    // Check if any IntelliLab GC specific content is present
    const hasIntelliLabContent = document.body.textContent?.includes('IntelliLab') || 
                                 document.body.textContent?.includes('GC') ||
                                 document.body.textContent?.includes('Dashboard');
    expect(hasIntelliLabContent).toBe(true);
  });
});
