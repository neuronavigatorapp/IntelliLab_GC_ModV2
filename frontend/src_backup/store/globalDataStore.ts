import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/apiService';


// Types
export interface KPIs {
  instrumentsCount: number;
  openAlerts: number;
  lowStockCount: number;
  recentRunsCount: number;
  recentMethodsCount: number;
}

export interface RecentRun {
  id: number;
  method_name: string;
  timestamp: string;
  status: string;
}

export interface RecentMethod {
  id: number;
  name: string;
  type: string;
  created_date: string;
}

export interface Alert {
  id: number;
  severity: string;
  message: string;
  timestamp: string;
}

export interface Recents {
  runs: RecentRun[];
  methods: RecentMethod[];
  alerts: Alert[];
}

export interface UserPreferences {
  darkMode: boolean;
  defaultModule: string;
  refreshInterval: number;
  notifications: boolean;
}

export interface LicenseInfo {
  plan: string;
  status: 'active' | 'invalid' | 'expired';
  expiresAt?: string;
}

// Analytics Types
export interface AIRecommendation {
  id: number;
  category: 'method' | 'diagnostic' | 'maintenance' | 'cost';
  title: string;
  details: string;
  confidence: number;
  created_at: string;
  instrument_id?: number;
  method_id?: number;
  severity: 'info' | 'warning' | 'error' | 'critical';
  actionable: boolean;
}

export interface MaintenancePrediction {
  id: number;
  asset_type: string;
  asset_id: number;
  health_score: number;
  days_remaining: number;
  rationale: string;
  updated_at: string;
  instrument_id: number;
  confidence: number;
  recommended_action?: string;
}

export interface OptimizationSuggestion {
  id: number;
  target: string;
  suggested_changes: Record<string, any>;
  expected_effects: Record<string, string>;
  confidence: number;
  created_at: string;
  method_id?: number;
  instrument_id?: number;
  cost_savings?: number;
  time_savings?: number;
}

export interface CostOptimizationResult {
  current_cost_per_analysis: number;
  proposed_cost_per_analysis: number;
  savings_percentage: number;
  suggestions: OptimizationSuggestion[];
  line_items: Array<{name: string; value: number; unit?: string}>;
  payback_period_days?: number;
}

// Phase 5 - QC, Compliance & LIMS Types
export interface GlobalQCRecord {
  id: number;
  instrument_id: number;
  analyte: string;
  value: number;
  date: string;
  ucl: number;
  lcl: number;
  warn_high: number;
  warn_low: number;
  analyst: string;
  notes?: string;
  status: string;
  created_date: string;
  modified_date: string;
}

export interface QCSummary {
  analyte: string;
  mean: number;
  stdev: number;
  ucl: number;
  lcl: number;
  warn_high: number;
  warn_low: number;
  record_count: number;
  last_updated: string;
  status: string;
}

export interface QCChartData {
  dates: string[];
  values: number[];
  ucl_line: number[];
  lcl_line: number[];
  warn_high_line: number[];
  warn_low_line: number[];
  mean_line: number[];
  out_of_control_points: number[];
  warning_points: number[];
}

export interface QCAlert {
  id: number;
  qc_record_id: number;
  alert_type: string;
  message: string;
  severity: string;
  timestamp: string;
  is_acknowledged: boolean;
  acknowledged_by?: string;
  acknowledged_at?: string;
}

export interface AuditLogEntry {
  id: number;
  timestamp: string;
  user: string;
  action: string;
  entity_type: string;
  entity_id?: number;
  details?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
}

export interface LIMSConfig {
  id: number;
  base_url: string;
  api_key: string;
  format: string;
  is_active: boolean;
  connection_name: string;
  description?: string;
  created_date: string;
  modified_date: string;
}

export interface LIMSConnectionResult {
  success: boolean;
  message: string;
  response_time?: number;
  error_details?: string;
}

export interface AnalyticsSummary {
  total_runs_analyzed: number;
  total_recommendations: number;
  critical_alerts: number;
  maintenance_predictions: number;
  cost_savings_potential: number;
  last_analysis_date?: string;
}

// Context interface
interface GlobalDataContextType {
  kpis: KPIs | null;
  recents: Recents | null;
  userPreferences: UserPreferences;
  licenseInfo: LicenseInfo;
  lastSyncTime: string | null;
  isLoading: boolean;
  refreshData: () => Promise<void>;
  refreshKPIs: () => Promise<void>;
  refreshRecents: () => Promise<void>;
  updatePreferences: (prefs: Partial<UserPreferences>) => Promise<void>;
  validateLicense: (key: string) => Promise<{ status: string; message: string }>;
  
  // Analytics methods
  fetchDiagnostics: (filters: any) => Promise<AIRecommendation[]>;
  fetchOptimization: (methodId: number) => Promise<OptimizationSuggestion>;
  fetchMaintenance: () => Promise<MaintenancePrediction[]>;
  fetchCostOptimizer: (payload: any) => Promise<CostOptimizationResult>;
  analyticsSummary: AnalyticsSummary | null;
  
  // Phase 5 - QC, Compliance & LIMS methods
  fetchQCRecords: (filters: any) => Promise<GlobalQCRecord[]>;
  fetchQCSummary: (analyte: string, instrumentId?: number) => Promise<QCSummary>;
  fetchQCChartData: (analyte: string, instrumentId?: number, days?: number) => Promise<QCChartData>;
  fetchQCAlerts: (filters: any) => Promise<QCAlert[]>;
  acknowledgeQCAlert: (alertId: number, user: string) => Promise<QCAlert>;
  createQCRecord: (record: any) => Promise<GlobalQCRecord>;
  updateQCRecord: (recordId: number, update: any) => Promise<GlobalQCRecord>;
  
  fetchAuditLog: (filters: any) => Promise<AuditLogEntry[]>;
  fetchAuditSummary: (startDate?: string, endDate?: string) => Promise<any>;
  exportAuditLog: (startDate?: string, endDate?: string, format?: string) => Promise<string>;
  
  fetchLIMSConfigs: () => Promise<LIMSConfig[]>;
  createLIMSConfig: (config: any) => Promise<LIMSConfig>;
  updateLIMSConfig: (configId: number, update: any) => Promise<LIMSConfig>;
  deleteLIMSConfig: (configId: number) => Promise<boolean>;
  testLIMSConnection: (configId: number) => Promise<LIMSConnectionResult>;
  exportDataToLIMS: (request: any) => Promise<any>;
  importDataFromLIMS: (request: any) => Promise<any>;
}

// Default values
const defaultPreferences: UserPreferences = {
  darkMode: false,
  defaultModule: 'dashboard',
  refreshInterval: 60,
  notifications: true
};

const defaultLicense: LicenseInfo = {
  plan: 'Developer',
  status: 'active'
};

// Create context
const GlobalDataContext = createContext<GlobalDataContextType | undefined>(undefined);

// Provider component
export const GlobalDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [recents, setRecents] = useState<Recents | null>(null);
  const [userPreferences, setUserPreferences] = useState<UserPreferences>(defaultPreferences);
  const [licenseInfo, setLicenseInfo] = useState<LicenseInfo>(defaultLicense);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [analyticsSummary, setAnalyticsSummary] = useState<AnalyticsSummary | null>(null);

  // Load preferences from localStorage on mount
  useEffect(() => {
    const savedPrefs = localStorage.getItem('intellilab-preferences');
    if (savedPrefs) {
      try {
        const parsed = JSON.parse(savedPrefs);
        setUserPreferences({ ...defaultPreferences, ...parsed });
      } catch (error) {
        console.error('Failed to parse saved preferences:', error);
      }
    }
  }, []);

  // Save preferences to localStorage when they change
  useEffect(() => {
    localStorage.setItem('intellilab-preferences', JSON.stringify(userPreferences));
  }, [userPreferences]);

  // Fetch KPIs
  const fetchKPIs = useCallback(async () => {
    try {
      const response = await apiService.get('/summary/kpis');
      setKpis(response.data);
    } catch (error) {
      console.error('Failed to fetch KPIs:', error);
      // Set fallback data
      setKpis({
        instrumentsCount: 3,
        openAlerts: 2,
        lowStockCount: 1,
        recentRunsCount: 5,
        recentMethodsCount: 3
      });
    }
  }, []);

  // Fetch recents
  const fetchRecents = useCallback(async () => {
    try {
      const response = await apiService.get('/summary/recents');
      setRecents(response.data);
    } catch (error) {
      console.error('Failed to fetch recents:', error);
      // Set fallback data
      setRecents({
        runs: [
          { id: 1, method_name: 'BTEX-2024-01', timestamp: new Date().toISOString(), status: 'completed' },
          { id: 2, method_name: 'VOC-Analysis', timestamp: new Date().toISOString(), status: 'running' }
        ],
        methods: [
          { id: 1, name: 'BTEX-2024-01', type: 'detection_limit', created_date: new Date().toISOString() },
          { id: 2, name: 'VOC-Analysis', type: 'oven_ramp', created_date: new Date().toISOString() }
        ],
        alerts: [
          { id: 1, severity: 'warning', message: 'GC-2030 calibration due', timestamp: new Date().toISOString() },
          { id: 2, severity: 'info', message: 'New method template available', timestamp: new Date().toISOString() }
        ]
      });
    }
  }, []);

  // Fetch license info
  const fetchLicenseInfo = useCallback(async () => {
    try {
      const response = await apiService.get('/license');
      setLicenseInfo(response.data);
    } catch (error) {
      console.error('Failed to fetch license info:', error);
      // Keep default license info
    }
  }, []);

  // Refresh all data - FIXED: Properly memoized to prevent infinite loops
  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchKPIs(),
        fetchRecents(),
        fetchLicenseInfo()
      ]);
      setLastSyncTime(new Date().toISOString());
    } catch (error) {
      console.error('Failed to refresh data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchKPIs, fetchRecents, fetchLicenseInfo]);

  // Refresh KPIs only
  const refreshKPIs = useCallback(async () => {
    await fetchKPIs();
    setLastSyncTime(new Date().toISOString());
  }, [fetchKPIs]);

  // Refresh recents only
  const refreshRecents = useCallback(async () => {
    await fetchRecents();
    setLastSyncTime(new Date().toISOString());
  }, [fetchRecents]);

  // Update preferences
  const updatePreferences = useCallback(async (newPrefs: Partial<UserPreferences>) => {
    const updatedPrefs = { ...userPreferences, ...newPrefs };
    setUserPreferences(updatedPrefs);
    
    try {
      await apiService.post('/user/preferences', updatedPrefs);
    } catch (error) {
      console.error('Failed to save preferences to server:', error);
      // Preferences are still saved locally
    }
  }, [userPreferences]);

  // Validate license
  const validateLicense = useCallback(async (key: string) => {
    try {
      const response = await apiService.post('/license/validate', { license_key: key });
      return response.data;
    } catch (error) {
      console.error('Failed to validate license:', error);
      return { status: 'error', message: 'Failed to validate license' };
    }
  }, []);

  // Analytics methods
  const fetchDiagnostics = useCallback(async (filters: any) => {
    try {
      const response = await apiService.post('/analytics/diagnostics', filters);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch diagnostics:', error);
      return [];
    }
  }, []);

  const fetchOptimization = useCallback(async (methodId: number) => {
    try {
      const response = await apiService.post('/analytics/optimize-method', { method_id: methodId });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch optimization:', error);
      throw error;
    }
  }, []);

  const fetchMaintenance = useCallback(async () => {
    try {
      const response = await apiService.get('/analytics/maintenance');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch maintenance predictions:', error);
      return [];
    }
  }, []);

  const fetchCostOptimizer = useCallback(async (payload: any) => {
    try {
      const response = await apiService.post('/analytics/cost-optimizer', payload);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch cost optimization:', error);
      throw error;
    }
  }, []);

  const fetchAnalyticsSummary = useCallback(async () => {
    try {
      const response = await apiService.get('/analytics/summary');
      setAnalyticsSummary(response.data);
    } catch (error) {
      console.error('Failed to fetch analytics summary:', error);
    }
  }, []);

  // Phase 5 - QC, Compliance & LIMS methods
  const fetchQCRecords = useCallback(async (filters: any) => {
    try {
      const response = await apiService.get('/qc/records', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch QC records:', error);
      return [];
    }
  }, []);

  const fetchQCSummary = useCallback(async (analyte: string, instrumentId?: number) => {
    try {
      const params = instrumentId ? { instrument_id: instrumentId } : {};
      const response = await apiService.get(`/qc/summary/${analyte}`, { params });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch QC summary:', error);
      throw error;
    }
  }, []);

  const fetchQCChartData = useCallback(async (analyte: string, instrumentId?: number, days: number = 30) => {
    try {
      const params: any = { days };
      if (instrumentId) params.instrument_id = instrumentId;
      const response = await apiService.get(`/qc/charts/${analyte}`, { params });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch QC chart data:', error);
      throw error;
    }
  }, []);

  const fetchQCAlerts = useCallback(async (filters: any) => {
    try {
      const response = await apiService.get('/qc/alerts', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch QC alerts:', error);
      return [];
    }
  }, []);

  const acknowledgeQCAlert = useCallback(async (alertId: number, user: string) => {
    try {
      const response = await apiService.post(`/qc/alerts/${alertId}/acknowledge`, null, {
        params: { acknowledged_by: user }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to acknowledge QC alert:', error);
      throw error;
    }
  }, []);

  const createQCRecord = useCallback(async (record: any) => {
    try {
      const response = await apiService.post('/qc/records', record);
      return response.data;
    } catch (error) {
      console.error('Failed to create QC record:', error);
      throw error;
    }
  }, []);

  const updateQCRecord = useCallback(async (recordId: number, update: any) => {
    try {
      const response = await apiService.put(`/qc/records/${recordId}`, update);
      return response.data;
    } catch (error) {
      console.error('Failed to update QC record:', error);
      throw error;
    }
  }, []);

  const fetchAuditLog = useCallback(async (filters: any) => {
    try {
      const response = await apiService.get('/audit/', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch audit log:', error);
      return [];
    }
  }, []);

  const fetchAuditSummary = useCallback(async (startDate?: string, endDate?: string) => {
    try {
      const params: any = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      const response = await apiService.get('/audit/summary/', { params });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch audit summary:', error);
      throw error;
    }
  }, []);

  const exportAuditLog = useCallback(async (startDate?: string, endDate?: string, format: string = 'json') => {
    try {
      const params: any = { format };
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      const response = await apiService.get('/audit/export/', { params });
      return response.data.data;
    } catch (error) {
      console.error('Failed to export audit log:', error);
      throw error;
    }
  }, []);

  const fetchLIMSConfigs = useCallback(async () => {
    try {
      const response = await apiService.get('/lims/configs');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch LIMS configs:', error);
      return [];
    }
  }, []);

  const createLIMSConfig = useCallback(async (config: any) => {
    try {
      const response = await apiService.post('/lims/configs', config);
      return response.data;
    } catch (error) {
      console.error('Failed to create LIMS config:', error);
      throw error;
    }
  }, []);

  const updateLIMSConfig = useCallback(async (configId: number, update: any) => {
    try {
      const response = await apiService.put(`/lims/configs/${configId}`, update);
      return response.data;
    } catch (error) {
      console.error('Failed to update LIMS config:', error);
      throw error;
    }
  }, []);

  const deleteLIMSConfig = useCallback(async (configId: number) => {
    try {
      await apiService.delete(`/lims/configs/${configId}`);
      return true;
    } catch (error) {
      console.error('Failed to delete LIMS config:', error);
      return false;
    }
  }, []);

  const testLIMSConnection = useCallback(async (configId: number) => {
    try {
      const response = await apiService.post(`/lims/configs/${configId}/test`);
      return response.data;
    } catch (error) {
      console.error('Failed to test LIMS connection:', error);
      throw error;
    }
  }, []);

  const exportDataToLIMS = useCallback(async (request: any) => {
    try {
      const response = await apiService.post('/lims/export', request);
      return response.data;
    } catch (error) {
      console.error('Failed to export data to LIMS:', error);
      throw error;
    }
  }, []);

  const importDataFromLIMS = useCallback(async (request: any) => {
    try {
      const formData = new FormData();
      formData.append('file', request.file);
      formData.append('config_id', request.config_id.toString());
      formData.append('data_type', request.data_type);
      formData.append('format', request.format);
      formData.append('validate_only', request.validate_only.toString());
      
      const response = await apiService.post('/lims/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to import data from LIMS:', error);
      throw error;
    }
  }, []);

  // Initial data load
  useEffect(() => {
    refreshData();
    fetchAnalyticsSummary();
  }, [refreshData, fetchAnalyticsSummary]);

  // Auto-refresh based on user preferences
  useEffect(() => {
    if (userPreferences.refreshInterval <= 0) return;
    
    const interval = setInterval(() => {
      refreshData();
    }, userPreferences.refreshInterval * 1000);
    
    return () => clearInterval(interval);
  }, [userPreferences.refreshInterval, refreshData]);

  const value: GlobalDataContextType = {
    kpis,
    recents,
    userPreferences,
    licenseInfo,
    lastSyncTime,
    isLoading,
    refreshData,
    refreshKPIs,
    refreshRecents,
    updatePreferences,
    validateLicense,
    fetchDiagnostics,
    fetchOptimization,
    fetchMaintenance,
    fetchCostOptimizer,
    analyticsSummary,
    fetchQCRecords,
    fetchQCSummary,
    fetchQCChartData,
    fetchQCAlerts,
    acknowledgeQCAlert,
    createQCRecord,
    updateQCRecord,
    fetchAuditLog,
    fetchAuditSummary,
    exportAuditLog,
    fetchLIMSConfigs,
    createLIMSConfig,
    updateLIMSConfig,
    deleteLIMSConfig,
    testLIMSConnection,
    exportDataToLIMS,
    importDataFromLIMS
  };

  return React.createElement(GlobalDataContext.Provider, { value }, children);
};

// Hook to use the global data
export const useGlobalData = () => {
  const context = useContext(GlobalDataContext);
  if (context === undefined) {
    throw new Error('useGlobalData must be used within a GlobalDataProvider');
  }
  return context;
};
