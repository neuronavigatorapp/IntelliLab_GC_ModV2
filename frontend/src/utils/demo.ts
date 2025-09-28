/**
 * Demo Mode Utilities
 * 
 * Handles demo mode detection and functionality, including environment variable
 * checking and mock forcing when in demo mode.
 */

/**
 * Check if the application is running in demo mode
 * Demo mode is enabled when VITE_DEMO environment variable is set to 'true'
 */
export function isDemoMode(): boolean {
    return import.meta.env.VITE_DEMO === 'true';
}

/**
 * Check if we should force mocks in the current environment
 * Returns true in demo mode or when explicitly requested
 */
export function shouldForceMocks(): boolean {
    return isDemoMode() || import.meta.env.VITE_FORCE_MOCKS === 'true';
}

/**
 * Get the demo mode configuration
 * Returns an object with demo mode settings and flags
 */
export function getDemoConfig() {
    return {
        isDemoMode: isDemoMode(),
        forceMocks: shouldForceMocks(),
        demoLabel: isDemoMode() ? 'Demo Mode' : null,
        environment: import.meta.env.MODE || 'development'
    };
}

/**
 * Demo mode feature flags
 * Can be extended to control specific demo features
 */
export const demoFeatures = {
    showDemoBadge: isDemoMode(),
    forceMockAPI: shouldForceMocks(),
    disableRealAPI: isDemoMode(),
    showDemoContent: isDemoMode()
};

/**
 * Log demo mode status to console for debugging
 */
export function logDemoStatus(): void {
    if (isDemoMode()) {
        console.log('🧪 Demo Mode is ENABLED');
        console.log('Demo Config:', getDemoConfig());
    }
}