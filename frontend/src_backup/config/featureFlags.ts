/**
 * Feature flags for IntelliLab GC Platform
 * Controls visibility and functionality of various features
 */

export interface FeatureFlags {
  // Phase 7 - Training & Education Mode
  enableTraining: boolean;
  enableInstructor: boolean;
  enableWhiteLabel: boolean;
  
  // Phase 6 - Mobile & Offline Lab Companion
  enableOffline: boolean;
  enableMobileCompanion: boolean;
  enablePushNotifications: boolean;
  enableAttachments: boolean;
  
  // Phase 5 - QC, Compliance & LIMS
  enableQCCompliance: boolean;
  enableLIMS: boolean;
  
  // Phase 4 - Analytics & AI Tools
  enableAnalytics: boolean;
  enableDiagnostics: boolean;
  enableMethodOptimization: boolean;
  enablePredictiveMaintenance: boolean;
  enableCostOptimization: boolean;
  
  // Phase 3 - Summary & Reports
  enableReports: boolean;
  enableSummary: boolean;
  
  // Phase 2 - Inventory
  enableInventory: boolean;
  enablePredictiveInventory: boolean;
  
  // Core Features
  enableInstruments: boolean;
  enableMethods: boolean;
  enableCalculations: boolean;
  enableAIFeatures: boolean;
  
  // UI Features
  enableDarkMode: boolean;
  enablePWA: boolean;
  enableMobileOptimization: boolean;
}

// Default feature flags
export const defaultFeatureFlags: FeatureFlags = {
  // Phase 7 - Training & Education Mode
  enableTraining: true,
  enableInstructor: true,
  enableWhiteLabel: true,
  
  // Phase 6 - Mobile & Offline Lab Companion
  enableOffline: true,
  enableMobileCompanion: true,
  enablePushNotifications: true,
  enableAttachments: true,
  
  // Phase 5 - QC, Compliance & LIMS
  enableQCCompliance: true,
  enableLIMS: true,
  
  // Phase 4 - Analytics & AI Tools
  enableAnalytics: true,
  enableDiagnostics: true,
  enableMethodOptimization: true,
  enablePredictiveMaintenance: true,
  enableCostOptimization: true,
  
  // Phase 3 - Summary & Reports
  enableReports: true,
  enableSummary: true,
  
  // Phase 2 - Inventory
  enableInventory: true,
  enablePredictiveInventory: true,
  
  // Core Features
  enableInstruments: true,
  enableMethods: true,
  enableCalculations: true,
  enableAIFeatures: true,
  
  // UI Features
  enableDarkMode: true,
  enablePWA: true,
  enableMobileOptimization: true,
};

// Development feature flags (all enabled)
export const devFeatureFlags: FeatureFlags = {
  ...defaultFeatureFlags,
  enableTraining: true,
  enableInstructor: true,
  enableWhiteLabel: true,
  enableOffline: true,
  enableMobileCompanion: true,
  enablePushNotifications: true,
  enableAttachments: true,
  enableQCCompliance: true,
  enableLIMS: true,
  enableAnalytics: true,
  enableDiagnostics: true,
  enableMethodOptimization: true,
  enablePredictiveMaintenance: true,
  enableCostOptimization: true,
};

// Production feature flags (selective enablement)
export const prodFeatureFlags: FeatureFlags = {
  ...defaultFeatureFlags,
  enableTraining: true,
  enableInstructor: true,
  enableWhiteLabel: true,
  enableOffline: true,
  enableMobileCompanion: true,
  enablePushNotifications: true,
  enableAttachments: true,
  enableQCCompliance: true,
  enableLIMS: true,
  enableAnalytics: true,
  enableDiagnostics: true,
  enableMethodOptimization: true,
  enablePredictiveMaintenance: true,
  enableCostOptimization: true,
};

// Get current feature flags based on environment
export const getFeatureFlags = (): FeatureFlags => {
  const env = process.env.NODE_ENV || 'development';
  
  switch (env) {
    case 'production':
      return prodFeatureFlags;
    case 'development':
      return devFeatureFlags;
    default:
      return defaultFeatureFlags;
  }
};

// Feature flag utility functions
export const isFeatureEnabled = (feature: keyof FeatureFlags): boolean => {
  const flags = getFeatureFlags();
  return flags[feature] || false;
};

// Phase 7 - Training & Education checks
export const isTrainingEnabled = (): boolean => {
  return isFeatureEnabled('enableTraining');
};

export const isInstructorEnabled = (): boolean => {
  return isFeatureEnabled('enableInstructor');
};

export const isWhiteLabelEnabled = (): boolean => {
  return isFeatureEnabled('enableWhiteLabel');
};

// Phase 6 - Mobile & Offline checks
export const isOfflineEnabled = (): boolean => {
  return isFeatureEnabled('enableOffline');
};

export const isMobileCompanionEnabled = (): boolean => {
  return isFeatureEnabled('enableMobileCompanion');
};

export const isPushNotificationsEnabled = (): boolean => {
  return isFeatureEnabled('enablePushNotifications');
};

export const isAttachmentsEnabled = (): boolean => {
  return isFeatureEnabled('enableAttachments');
};

// Phase 5 - QC & Compliance checks
export const isQCComplianceEnabled = (): boolean => {
  return isFeatureEnabled('enableQCCompliance');
};

export const isLIMSEnabled = (): boolean => {
  return isFeatureEnabled('enableLIMS');
};

// Phase 4 - Analytics checks
export const isAnalyticsEnabled = (): boolean => {
  return isFeatureEnabled('enableAnalytics');
};

export const isDiagnosticsEnabled = (): boolean => {
  return isFeatureEnabled('enableDiagnostics');
};

export const isMethodOptimizationEnabled = (): boolean => {
  return isFeatureEnabled('enableMethodOptimization');
};

export const isPredictiveMaintenanceEnabled = (): boolean => {
  return isFeatureEnabled('enablePredictiveMaintenance');
};

export const isCostOptimizationEnabled = (): boolean => {
  return isFeatureEnabled('enableCostOptimization');
};

// Analytics-specific feature checks
export const getAnalyticsFeatures = () => {
  const flags = getFeatureFlags();
  return {
    diagnostics: flags.enableDiagnostics,
    methodOptimization: flags.enableMethodOptimization,
    predictiveMaintenance: flags.enablePredictiveMaintenance,
    costOptimization: flags.enableCostOptimization,
  };
};

// Check if any analytics features are enabled
export const hasAnalyticsFeatures = (): boolean => {
  const analyticsFeatures = getAnalyticsFeatures();
  return Object.values(analyticsFeatures).some(enabled => enabled);
};

// Training-specific feature checks
export const getTrainingFeatures = () => {
  const flags = getFeatureFlags();
  return {
    training: flags.enableTraining,
    instructor: flags.enableInstructor,
    whiteLabel: flags.enableWhiteLabel,
  };
};

// Check if any training features are enabled
export const hasTrainingFeatures = (): boolean => {
  const trainingFeatures = getTrainingFeatures();
  return Object.values(trainingFeatures).some(enabled => enabled);
};

// Mobile & Offline feature checks
export const getMobileFeatures = () => {
  const flags = getFeatureFlags();
  return {
    offline: flags.enableOffline,
    mobileCompanion: flags.enableMobileCompanion,
    pushNotifications: flags.enablePushNotifications,
    attachments: flags.enableAttachments,
  };
};

// Check if any mobile features are enabled
export const hasMobileFeatures = (): boolean => {
  const mobileFeatures = getMobileFeatures();
  return Object.values(mobileFeatures).some(enabled => enabled);
};
