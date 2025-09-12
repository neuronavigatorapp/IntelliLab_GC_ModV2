import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { toast } from 'react-hot-toast';

// Create axios instance
const apiService: AxiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiService.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor with better error handling
apiService.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    const message = (error.response?.data as any)?.message || error.message || 'An error occurred';
    
    // Only show error toast for specific error types, not connection issues
    if (error.response?.status && error.response.status !== 401 && error.response.status !== 0) {
      toast.error(message);
    }
    
    // Don't log connection errors to avoid spam
    if (error.code !== 'ERR_NETWORK' && error.code !== 'ECONNREFUSED') {
      console.error('API Error:', error);
    }
    
    return Promise.reject(error);
  }
);

// Mock data for when backend is not available
const mockData = {
  instruments: [
    {
      id: 1,
      name: 'GC-2030-001',
      type: 'GC-FID',
      status: 'online',
      location: 'Lab A',
      last_calibration: '2024-01-15',
      next_calibration: '2024-02-15',
      manufacturer: 'Shimadzu',
      model: 'GC-2030',
      serial_number: 'SH2030-001',
      detector_type: 'FID',
      column_type: 'DB-5MS',
      column_length: 30,
      column_diameter: 0.25,
      carrier_gas: 'Helium',
      flow_rate: 1.5
    },
    {
      id: 2,
      name: 'GC-2030-002',
      type: 'GC-ECD',
      status: 'online',
      location: 'Lab B',
      last_calibration: '2024-01-10',
      next_calibration: '2024-02-10',
      manufacturer: 'Shimadzu',
      model: 'GC-2030',
      serial_number: 'SH2030-002',
      detector_type: 'ECD',
      column_type: 'DB-1701',
      column_length: 30,
      column_diameter: 0.25,
      carrier_gas: 'Nitrogen',
      flow_rate: 1.2
    },
    {
      id: 3,
      name: 'GC-2010-001',
      type: 'GC-MS',
      status: 'maintenance',
      location: 'Lab C',
      last_calibration: '2024-01-05',
      next_calibration: '2024-02-05',
      manufacturer: 'Shimadzu',
      model: 'GC-2010 Plus',
      serial_number: 'SH2010-001',
      detector_type: 'MS',
      column_type: 'DB-5MS',
      column_length: 30,
      column_diameter: 0.25,
      carrier_gas: 'Helium',
      flow_rate: 1.0
    },
    {
      id: 4,
      name: 'GC-7890-001',
      type: 'GC-FID',
      status: 'online',
      location: 'Lab D',
      last_calibration: '2024-01-20',
      next_calibration: '2024-02-20',
      manufacturer: 'Agilent',
      model: '7890B',
      serial_number: 'AG7890-001',
      detector_type: 'FID',
      column_type: 'HP-5',
      column_length: 30,
      column_diameter: 0.32,
      carrier_gas: 'Helium',
      flow_rate: 2.0
    },
    {
      id: 5,
      name: 'GC-7890-002',
      type: 'GC-ECD',
      status: 'offline',
      location: 'Lab E',
      last_calibration: '2024-01-12',
      next_calibration: '2024-02-12',
      manufacturer: 'Agilent',
      model: '7890B',
      serial_number: 'AG7890-002',
      detector_type: 'ECD',
      column_type: 'HP-1701',
      column_length: 30,
      column_diameter: 0.25,
      carrier_gas: 'Nitrogen',
      flow_rate: 1.5
    }
  ],
  methods: [
    {
      id: 1,
      name: 'BTEX-2024-01',
      type: 'detection_limit',
      description: 'Benzene, Toluene, Ethylbenzene, Xylene analysis using FID detection',
      created_date: '2024-01-15T10:00:00Z',
      status: 'active',
      instrument_id: 1,
      parameters: {
        injection_volume: 1.0,
        split_ratio: 50,
        oven_temp: 40,
        oven_ramp: '40°C (2 min) → 200°C @ 10°C/min → 200°C (5 min)',
        detector_temp: 250,
        carrier_flow: 1.5
      }
    },
    {
      id: 2,
      name: 'VOC-Analysis',
      type: 'oven_ramp',
      description: 'Volatile Organic Compounds analysis with temperature programming',
      created_date: '2024-01-10T14:30:00Z',
      status: 'active',
      instrument_id: 1,
      parameters: {
        injection_volume: 2.0,
        split_ratio: 20,
        oven_temp: 35,
        oven_ramp: '35°C (3 min) → 150°C @ 8°C/min → 150°C (3 min)',
        detector_temp: 250,
        carrier_flow: 1.2
      }
    },
    {
      id: 3,
      name: 'Pesticides-Screening',
      type: 'detection_limit',
      description: 'Pesticide residue screening method using ECD detection',
      created_date: '2024-01-05T09:15:00Z',
      status: 'draft',
      instrument_id: 2,
      parameters: {
        injection_volume: 1.0,
        split_ratio: 10,
        oven_temp: 80,
        oven_ramp: '80°C (1 min) → 280°C @ 15°C/min → 280°C (10 min)',
        detector_temp: 300,
        carrier_flow: 1.0
      }
    },
    {
      id: 4,
      name: 'Fatty-Acids-Profile',
      type: 'oven_ramp',
      description: 'Fatty acid methyl ester analysis for biodiesel quality control',
      created_date: '2024-01-08T11:45:00Z',
      status: 'active',
      instrument_id: 4,
      parameters: {
        injection_volume: 1.0,
        split_ratio: 100,
        oven_temp: 50,
        oven_ramp: '50°C (1 min) → 250°C @ 4°C/min → 250°C (5 min)',
        detector_temp: 280,
        carrier_flow: 2.0
      }
    },
    {
      id: 5,
      name: 'Alcohols-Analysis',
      type: 'detection_limit',
      description: 'Alcohol content analysis for beverage quality control',
      created_date: '2024-01-12T16:20:00Z',
      status: 'active',
      instrument_id: 1,
      parameters: {
        injection_volume: 0.5,
        split_ratio: 30,
        oven_temp: 40,
        oven_ramp: '40°C (2 min) → 180°C @ 12°C/min → 180°C (3 min)',
        detector_temp: 250,
        carrier_flow: 1.8
      }
    }
  ],
  compounds: [
    {
      id: 1,
      name: 'Benzene',
      formula: 'C6H6',
      molecular_weight: 78.11,
      boiling_point: 80.1,
      retention_time: 3.2,
      detection_limit: 0.001,
      category: 'BTEX',
      cas_number: '71-43-2'
    },
    {
      id: 2,
      name: 'Toluene',
      formula: 'C7H8',
      molecular_weight: 92.14,
      boiling_point: 110.6,
      retention_time: 4.8,
      detection_limit: 0.002,
      category: 'BTEX',
      cas_number: '108-88-3'
    },
    {
      id: 3,
      name: 'Ethylbenzene',
      formula: 'C8H10',
      molecular_weight: 106.16,
      boiling_point: 136.2,
      retention_time: 6.5,
      detection_limit: 0.003,
      category: 'BTEX',
      cas_number: '100-41-4'
    },
    {
      id: 4,
      name: 'Xylene',
      formula: 'C8H10',
      molecular_weight: 106.16,
      boiling_point: 138.4,
      retention_time: 7.2,
      detection_limit: 0.003,
      category: 'BTEX',
      cas_number: '1330-20-7'
    },
    {
      id: 5,
      name: 'Methanol',
      formula: 'CH3OH',
      molecular_weight: 32.04,
      boiling_point: 64.7,
      retention_time: 1.8,
      detection_limit: 0.005,
      category: 'Alcohols',
      cas_number: '67-56-1'
    },
    {
      id: 6,
      name: 'Ethanol',
      formula: 'C2H5OH',
      molecular_weight: 46.07,
      boiling_point: 78.4,
      retention_time: 2.3,
      detection_limit: 0.008,
      category: 'Alcohols',
      cas_number: '64-17-5'
    },
    {
      id: 7,
      name: 'Chlorpyrifos',
      formula: 'C9H11Cl3NO3PS',
      molecular_weight: 350.59,
      boiling_point: 200,
      retention_time: 12.8,
      detection_limit: 0.0001,
      category: 'Pesticides',
      cas_number: '2921-88-2'
    },
    {
      id: 8,
      name: 'Methyl Palmitate',
      formula: 'C17H34O2',
      molecular_weight: 270.45,
      boiling_point: 340,
      retention_time: 18.5,
      detection_limit: 0.01,
      category: 'Fatty Acids',
      cas_number: '112-39-0'
    }
  ],
  kpis: {
    instrumentsCount: 5,
    openAlerts: 3,
    lowStockCount: 2,
    recentRunsCount: 8,
    recentMethodsCount: 5
  },
  recents: {
    runs: [
      { id: 1, method_name: 'BTEX-2024-01', timestamp: new Date().toISOString(), status: 'completed', instrument: 'GC-2030-001' },
      { id: 2, method_name: 'VOC-Analysis', timestamp: new Date().toISOString(), status: 'running', instrument: 'GC-2030-001' },
      { id: 3, method_name: 'Pesticides-Screening', timestamp: new Date().toISOString(), status: 'completed', instrument: 'GC-2030-002' },
      { id: 4, method_name: 'Fatty-Acids-Profile', timestamp: new Date().toISOString(), status: 'completed', instrument: 'GC-7890-001' },
      { id: 5, method_name: 'Alcohols-Analysis', timestamp: new Date().toISOString(), status: 'queued', instrument: 'GC-2030-001' }
    ],
    methods: [
      { id: 1, name: 'BTEX-2024-01', type: 'detection_limit', created_date: new Date().toISOString() },
      { id: 2, name: 'VOC-Analysis', type: 'oven_ramp', created_date: new Date().toISOString() },
      { id: 3, name: 'Pesticides-Screening', type: 'detection_limit', created_date: new Date().toISOString() },
      { id: 4, name: 'Fatty-Acids-Profile', type: 'oven_ramp', created_date: new Date().toISOString() },
      { id: 5, name: 'Alcohols-Analysis', type: 'detection_limit', created_date: new Date().toISOString() }
    ],
    alerts: [
      { id: 1, severity: 'warning', message: 'GC-2030-001 calibration due in 5 days', timestamp: new Date().toISOString() },
      { id: 2, severity: 'info', message: 'New method template available for BTEX analysis', timestamp: new Date().toISOString() },
      { id: 3, severity: 'warning', message: 'Low carrier gas pressure detected on GC-7890-001', timestamp: new Date().toISOString() }
    ]
  }
};

// Helper function to check if backend is available
const isBackendAvailable = async (): Promise<boolean> => {
  try {
    await apiService.get('/health', { timeout: 5000 });
    return true;
  } catch (error) {
    return false;
  }
};

// API methods with fallback to mock data
export const instrumentsAPI = {
  // Get all instruments
  getAll: async () => {
    try {
      const response = await apiService.get('/instruments/');
      return response;
    } catch (error) {
      console.log('Using mock instruments data');
      return { data: mockData.instruments };
    }
  },
  
  // Get instrument by ID
  getById: async (id: number) => {
    try {
      const response = await apiService.get(`/instruments/${id}`);
      return response;
    } catch (error) {
      const instrument = mockData.instruments.find(i => i.id === id);
      return { data: instrument };
    }
  },
  
  // Create instrument
  create: async (data: any) => {
    try {
      const response = await apiService.post('/instruments/', data);
      return response;
    } catch (error) {
      console.log('Mock instrument creation');
      const newInstrument = { ...data, id: Date.now() };
      mockData.instruments.push(newInstrument);
      return { data: newInstrument };
    }
  },
  
  // Update instrument
  update: async (id: number, data: any) => {
    try {
      const response = await apiService.put(`/instruments/${id}`, data);
      return response;
    } catch (error) {
      console.log('Mock instrument update');
      const index = mockData.instruments.findIndex(i => i.id === id);
      if (index !== -1) {
        mockData.instruments[index] = { ...mockData.instruments[index], ...data };
      }
      return { data: mockData.instruments[index] };
    }
  },
  
  // Delete instrument
  delete: async (id: number) => {
    try {
      const response = await apiService.delete(`/instruments/${id}`);
      return response;
    } catch (error) {
      console.log('Mock instrument deletion');
      const index = mockData.instruments.findIndex(i => i.id === id);
      if (index !== -1) {
        mockData.instruments.splice(index, 1);
      }
      return { data: { success: true } };
    }
  },
  
  // Get fleet overview
  getFleetOverview: async () => {
    try {
      const response = await apiService.get('/instruments/fleet/overview');
      return response;
    } catch (error) {
      console.log('Using mock fleet overview');
      return { 
        data: {
          total: mockData.instruments.length,
          online: mockData.instruments.filter(i => i.status === 'online').length,
          maintenance: mockData.instruments.filter(i => i.status === 'maintenance').length,
          offline: mockData.instruments.filter(i => i.status === 'offline').length
        }
      };
    }
  },
  
  // Get instrument performance
  getPerformance: async (id: number) => {
    try {
      const response = await apiService.get(`/instruments/${id}/performance`);
      return response;
    } catch (error) {
      console.log('Using mock performance data');
      return { 
        data: {
          uptime: 95.5,
          runs_completed: 150,
          average_run_time: 45,
          last_maintenance: '2024-01-15'
        }
      };
    }
  },
};

// Health check API
export const healthAPI = {
  // Check backend health
  checkHealth: async () => {
    try {
      const response = await apiService.get('/health');
      return response;
    } catch (error) {
      return { data: { status: 'offline', message: 'Backend not available' } };
    }
  },
  
  // Check if backend is available
  isAvailable: async () => {
    return await isBackendAvailable();
  },
};

export const calculationsAPI = {
  // Inlet simulator
  inletSimulation: async (data: any) => {
    try {
      const response = await apiService.post('/calculations/inlet-simulator', data);
      return response;
    } catch (error) {
      console.log('Using mock inlet simulation');
      return { 
        data: {
          result: 'Mock simulation result',
          parameters: data,
          timestamp: new Date().toISOString()
        }
      };
    }
  },
  
  // Detection limit
  detectionLimit: async (data: any) => {
    try {
      const response = await apiService.post('/calculations/detection-limit', data);
      return response;
    } catch (error) {
      console.log('Using mock detection limit calculation');
      return { 
        data: {
          lod: 0.001,
          loq: 0.003,
          parameters: data,
          timestamp: new Date().toISOString()
        }
      };
    }
  },
  
  // Oven ramp
  ovenRamp: async (data: any) => {
    try {
      const response = await apiService.post('/calculations/oven-ramp', data);
      return response;
    } catch (error) {
      console.log('Using mock oven ramp calculation');
      return { 
        data: {
          temperature_profile: [50, 100, 150, 200, 250],
          time_profile: [0, 5, 10, 15, 20],
          parameters: data,
          timestamp: new Date().toISOString()
        }
      };
    }
  },
  
  // Get calculation history
  getHistory: async () => {
    try {
      const response = await apiService.get('/calculations/history');
      return response;
    } catch (error) {
      console.log('Using mock calculation history');
      return { 
        data: [
          {
            id: 1,
            type: 'detection_limit',
            parameters: { compound: 'Benzene' },
            result: { lod: 0.001, loq: 0.003 },
            timestamp: new Date().toISOString()
          }
        ]
      };
    }
  },
};

// Chromatography API
export const chromatographyAPI = {
  // Detect peaks in chromatogram data
  detectPeaks: (data: any) => apiService.post('/chromatography/detect', data),
  
  // Simulate chromatogram
  simulateChromatogram: (data: any) => apiService.post('/chromatography/simulate', data),
  
  // Import chromatogram from file
  importChromatogram: (data: any) => apiService.post('/chromatography/import', data),
  
  // Export chromatogram data
  exportChromatogram: (data: any) => apiService.post('/chromatography/export', data),

  // Quick-Run: returns RunRecord only
  quickRun: (data: { instrument_id: number; method_id: number; compounds?: any[]; sample_name?: string; }) =>
    apiService.post('/chromatography/quick-run', data),
};

// Runs API
export const runsAPI = {
  // Create a new run record
  createRun: (data: any) => apiService.post('/runs/', data),
  
  // Get a specific run record
  getRun: (id: number) => apiService.get(`/runs/${id}`),
  
  // List run records with optional filtering
  listRuns: (params?: { method_id?: number; instrument_id?: number; limit?: number }) => 
    apiService.get('/runs/', { params }),
  
  // Update a run record
  updateRun: (id: number, data: any) => apiService.put(`/runs/${id}`, data),
  
  // Delete a run record
  deleteRun: (id: number) => apiService.delete(`/runs/${id}`),
};

// Methods API
export const methodsAPI = {
  list: async (methodType?: string) => {
    try {
      const response = await apiService.get('/methods/', { params: { method_type: methodType } });
      return response;
    } catch (error) {
      console.log('Using mock methods data');
      let methods = mockData.methods;
      if (methodType) {
        methods = methods.filter(m => m.type === methodType);
      }
      return { data: methods };
    }
  },
  get: async (id: number) => {
    try {
      const response = await apiService.get(`/methods/${id}`);
      return response;
    } catch (error) {
      const method = mockData.methods.find(m => m.id === id);
      return { data: method };
    }
  },
  create: async (data: any) => {
    try {
      const response = await apiService.post('/methods/', data);
      return response;
    } catch (error) {
      console.log('Mock method creation');
      const newMethod = { ...data, id: Date.now(), created_date: new Date().toISOString() };
      mockData.methods.push(newMethod);
      return { data: newMethod };
    }
  },
  update: async (id: number, data: any) => {
    try {
      const response = await apiService.put(`/methods/${id}`, data);
      return response;
    } catch (error) {
      console.log('Mock method update');
      const index = mockData.methods.findIndex(m => m.id === id);
      if (index !== -1) {
        mockData.methods[index] = { ...mockData.methods[index], ...data };
      }
      return { data: mockData.methods[index] };
    }
  },
  delete: async (id: number) => {
    try {
      const response = await apiService.delete(`/methods/${id}`);
      return response;
    } catch (error) {
      console.log('Mock method deletion');
      const index = mockData.methods.findIndex(m => m.id === id);
      if (index !== -1) {
        mockData.methods.splice(index, 1);
      }
      return { data: { success: true } };
    }
  },
};

// Method Presets API
export const methodPresetsAPI = {
  list: (standardBody?: string) => apiService.get('/method-presets/', { params: { standard_body: standardBody } }),
  create: (data: any) => apiService.post('/method-presets/', data),
  update: (id: number, data: any) => apiService.put(`/method-presets/${id}`, data),
  delete: (id: number) => apiService.delete(`/method-presets/${id}`),
};

// Compounds API
export const compoundsAPI = {
  list: (params?: { category?: string; search?: string; limit?: number }) => apiService.get('/compounds/', { params }),
  create: (data: any) => apiService.post('/compounds/', data),
  update: (id: number, data: any) => apiService.put(`/compounds/${id}`, data),
  delete: (id: number) => apiService.delete(`/compounds/${id}`),
  loadCsv: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiService.post('/compounds/load-csv', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
};

// Sandbox API
export const sandboxAPI = {
  listFaults: () => apiService.get('/sandbox/faults'),
  run: (data: any) => apiService.post('/sandbox/run', data),
};

// Inventory API
export const inventoryAPI = {
  // Get inventory status
  getStatus: (instrumentId?: number) => apiService.get('/inventory/status', {
    params: instrumentId ? { instrument_id: instrumentId } : {}
  }),
  
  // Set reorder thresholds
  setThresholds: (consumableId: number, thresholds: any) => 
    apiService.post(`/inventory/thresholds/${consumableId}`, thresholds),
  
  // Record usage
  recordUsage: (consumableId: number, usage: any) => 
    apiService.post(`/inventory/usage/${consumableId}`, usage),
  
  // Get usage predictions
  getPredictions: (consumableId: number) => 
    apiService.get(`/inventory/predictions/${consumableId}`),
  
  // Get inventory alerts
  getAlerts: (severity?: string) => apiService.get('/inventory/alerts', {
    params: severity ? { severity } : {}
  }),
  
  // Restock consumable
  restock: (consumableId: number, restockData: any) => 
    apiService.post(`/inventory/restock/${consumableId}`, restockData),
  
  // Get inventory summary
  getSummary: () => apiService.get('/inventory/summary'),
  
  // Get inventory trends
  getTrends: (days?: number) => apiService.get('/inventory/trends', {
    params: days ? { days } : {}
  }),
};

export const aiAPI = {
  // AI Troubleshooting
  troubleshooting: (data: any) => apiService.post('/ai/troubleshooting', data),
  
  // Fleet Maintenance
  fleetMaintenance: (data: any) => apiService.post('/ai/fleet-maintenance', data),
  
  // Maintenance Scheduling
  scheduleMaintenance: (data: any) => apiService.post('/ai/schedule-maintenance', data),
  
  // Chromatogram Analysis
  chromatogramAnalysis: (data: any) => apiService.post('/ai/chromatogram-analysis', data),
  
  // Get AI service status
  getStatus: () => apiService.get('/ai/status'),
  
  // Get maintenance alerts
  getMaintenanceAlerts: () => apiService.get('/ai/maintenance-alerts'),
  
  // Get maintenance schedule
  getMaintenanceSchedule: () => apiService.get('/ai/maintenance-schedule'),
};



// System API for backup and management
export const systemAPI = {
  // Create backup
  createBackup: () => apiService.post('/system/backup'),
  
  // List backups
  listBackups: () => apiService.get('/system/backup/list'),
  
  // Get data location info
  getDataLocation: () => apiService.get('/system/data-location'),
  
  // Get system health
  getHealth: () => apiService.get('/system/health'),
  
  // Run migration
  migrate: () => apiService.post('/system/migrate'),
  
  // Get version info
  getVersion: () => apiService.get('/system/version'),
};

export const filesAPI = {
  // Upload file
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiService.post('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  
  // Download file
  download: (id: number) => apiService.get(`/files/download/${id}`, { responseType: 'blob' }),
  
  // Get all files
  getAll: (skip?: number, limit?: number) => 
    apiService.get('/files/', { params: { skip, limit } }),
  
  // Delete file
  delete: (id: number) => apiService.delete(`/files/${id}`),
  
  // Export method
  exportMethod: (methodData: any, filename?: string) => 
    apiService.post('/files/export/method', { method_data: methodData, filename }),
  
  // Import method
  importMethod: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiService.post('/files/import/method', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  
  // Get file stats
  getStats: () => apiService.get('/files/stats'),
};

// WebSocket service with improved error handling
export class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3; // Reduced to prevent spam
  private reconnectDelay = 2000; // Increased delay
  private listeners: Map<string, Function[]> = new Map();
  private isConnecting = false;

  connect() {
    if (this.isConnecting || this.ws?.readyState === WebSocket.CONNECTING) {
      return; // Prevent multiple connection attempts
    }
    
    this.isConnecting = true;
    const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:8000/ws';
    
    try {
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        this.isConnecting = false;
        this.emit('connected', {});
      };
      
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.emit(data.type || 'message', data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };
      
      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.isConnecting = false;
        this.emit('disconnected', {});
        this.attemptReconnect();
      };
      
      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnecting = false;
        this.emit('error', error);
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.isConnecting = false;
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.connect();
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  send(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }
}

// Summary and Reports API
export const summaryAPI = {
  // Get KPIs
  getKPIs: async () => {
    try {
      const response = await apiService.get('/summary/kpis');
      return response;
    } catch (error) {
      console.log('Using mock KPIs data');
      return { data: mockData.kpis };
    }
  },
  
  // Get recent activity
  getRecents: async () => {
    try {
      const response = await apiService.get('/summary/recents');
      return response;
    } catch (error) {
      console.log('Using mock recents data');
      return { data: mockData.recents };
    }
  },
};

export const reportsAPI = {
  // Generate report
  generate: (data: any) => apiService.post('/reports/generate', data),
  
  // Get report by ID
  getById: (id: number) => apiService.get(`/reports/${id}`),
  
  // Get all reports
  getAll: () => apiService.get('/reports/'),
  
  // Download report
  download: (id: number, format: string) => apiService.get(`/reports/${id}/download?format=${format}`),
};

// Training API
export const trainingAPI = {
  // Lessons
  getLessons: (params?: any) => apiService.get('/training/lessons', { params }),
  getLesson: (id: number) => apiService.get(`/training/lessons/${id}`),
  createLesson: (data: any) => apiService.post('/training/lessons', data),
  updateLesson: (id: number, data: any) => apiService.put(`/training/lessons/${id}`, data),
  publishLesson: (id: number) => apiService.post(`/training/lessons/${id}/publish`),
  
  // Exercises
  getExercises: (lessonId: number) => apiService.get(`/training/lessons/${lessonId}/exercises`),
  getExercise: (id: number) => apiService.get(`/training/exercises/${id}`),
  createExercise: (data: any) => apiService.post('/training/exercises', data),
  updateExercise: (id: number, data: any) => apiService.put(`/training/exercises/${id}`, data),
  
  // Attempts
  startAttempt: (exerciseId: number, userId: number = 1) => 
    apiService.post('/training/attempts/start', { exercise_id: exerciseId, user_id: userId }),
  submitAttempt: (data: any) => apiService.post('/training/attempts/submit', data),
  getAttempt: (id: number) => apiService.get(`/training/attempts/${id}`),
  
  // Progress
  getCourseProgress: (courseId: number, userId: number = 1) => 
    apiService.get(`/training/courses/${courseId}/progress?user_id=${userId}`),
  
  // Search
  searchLessons: (params: any) => apiService.get('/training/search', { params }),
  
  // Stats
  getStats: (userId: number = 1) => apiService.get(`/training/stats?user_id=${userId}`),
  
  // Exercise types and difficulties
  getExerciseTypes: () => apiService.get('/training/exercises/types'),
  getDifficulties: () => apiService.get('/training/difficulties'),
  
  // Hints and rubrics
  getExerciseHints: (exerciseId: number) => apiService.get(`/training/exercises/${exerciseId}/hints`),
  getExerciseRubric: (exerciseId: number) => apiService.get(`/training/exercises/${exerciseId}/scoring-rubric`),
};

// Instructor API
export const instructorAPI = {
  // Courses
  getCourses: (params?: any) => apiService.get('/instructor/courses', { params }),
  getCourse: (id: number) => apiService.get(`/instructor/courses/${id}`),
  createCourse: (data: any) => apiService.post('/instructor/courses', data),
  updateCourse: (id: number, data: any) => apiService.put(`/instructor/courses/${id}`, data),
  publishCourse: (id: number) => apiService.post(`/instructor/courses/${id}/publish`),
  
  // Enrollments
  assignCourse: (courseId: number, data: any) => 
    apiService.post(`/instructor/courses/${courseId}/assign`, data),
  getCourseEnrollments: (courseId: number) => 
    apiService.get(`/instructor/courses/${courseId}/enrollments`),
  getUserEnrollments: (userId: number) => 
    apiService.get(`/instructor/users/${userId}/enrollments`),
  
  // Grade overrides
  overrideGrade: (attemptId: number, data: any) => 
    apiService.post(`/instructor/attempts/${attemptId}/override`, data),
  getGradeOverrides: (courseId?: number) => 
    apiService.get('/instructor/grade-overrides', { params: { course_id: courseId } }),
  
  // Analytics
  getCourseAnalytics: (courseId: number) => 
    apiService.get(`/instructor/courses/${courseId}/analytics`),
  getUserProgress: (courseId: number, userId: number) => 
    apiService.get(`/instructor/courses/${courseId}/users/${userId}/progress`),
  
  // Course management
  addLessonToCourse: (courseId: number, lessonId: number, position?: number) => 
    apiService.post(`/instructor/courses/${courseId}/lessons/${lessonId}`, { position }),
  removeLessonFromCourse: (courseId: number, lessonId: number) => 
    apiService.delete(`/instructor/courses/${courseId}/lessons/${lessonId}`),
  reorderCourseLessons: (courseId: number, lessonOrder: number[]) => 
    apiService.put(`/instructor/courses/${courseId}/lessons/reorder`, { lesson_order: lessonOrder }),
  
  // Enrollments
  getEnrollment: (id: number) => apiService.get(`/instructor/enrollments/${id}`),
  updateEnrollmentStatus: (id: number, status: string) => 
    apiService.put(`/instructor/enrollments/${id}/status`, { status }),
  
  // Stats
  getStats: (instructorId: number = 1) => apiService.get(`/instructor/stats?instructor_id=${instructorId}`),
  
  // Export
  exportCourseData: (courseId: number) => apiService.get(`/instructor/courses/${courseId}/export`),
};

// Branding API
export const brandingAPI = {
  // Theme management
  getTheme: (orgId?: number) => apiService.get('/branding/theme', { params: { org_id: orgId } }),
  createTheme: (orgId: number, data: any) => 
    apiService.post('/branding/theme', data, { params: { org_id: orgId } }),
  updateTheme: (orgId: number, data: any) => 
    apiService.put('/branding/theme', data, { params: { org_id: orgId } }),
  deleteTheme: (orgId: number) => apiService.delete('/branding/theme', { params: { org_id: orgId } }),
  
  // Theme lists
  getThemes: () => apiService.get('/branding/themes'),
  
  // CSS and metadata
  getThemeCssVars: (orgId?: number) => 
    apiService.get('/branding/theme/css-vars', { params: { org_id: orgId } }),
  getThemeMetadata: (orgId?: number) => 
    apiService.get('/branding/theme/metadata', { params: { org_id: orgId } }),
  
  // Preview and validation
  previewTheme: (orgId: number, data: any) => 
    apiService.get('/branding/theme/preview', { params: { org_id: orgId, ...data } }),
  validateThemeData: (data: any) => apiService.get('/branding/theme/validate', { params: data }),
  
  // Default and reset
  getDefaultTheme: () => apiService.get('/branding/theme/default'),
  resetTheme: (orgId: number) => apiService.post('/branding/theme/reset', {}, { params: { org_id: orgId } }),
  
  // Import/Export
  exportTheme: (orgId: number) => apiService.get('/branding/theme/export', { params: { org_id: orgId } }),
  importTheme: (orgId: number, data: any) => 
    apiService.post('/branding/theme/import', data, { params: { org_id: orgId } }),
  
  // Colors and fonts
  getThemeColors: (orgId?: number) => 
    apiService.get('/branding/theme/colors', { params: { org_id: orgId } }),
  getAvailableFonts: () => apiService.get('/branding/theme/fonts'),
};

// Enhanced Calibration API with IS support, versioning, and outlier handling
export const calibrationAPI = {
  // Fit calibration curve with enhanced features
  fitCalibration: (data: {
    method_id: number;
    instrument_id?: number;
    target_name: string;
    model_type: string;
    mode: 'external' | 'internal_standard';
    internal_standard?: {
      peak_name: string;
      amount: number;
      unit: string;
    };
    outlier_policy: 'none' | 'grubbs' | 'iqr';
    levels: Array<{
      target_name: string;
      amount: number;
      unit: string;
      peak_name?: string;
      area?: number;
      is_area?: number;
      rt?: number;
      included?: boolean;
    }>;
  }) => apiService.post('/calibration/fit', data),
  
  // List calibration versions
  listVersions: (methodId?: number, instrumentId?: number, targetName?: string) => 
    apiService.get('/calibration/versions', { 
      params: { method_id: methodId, instrument_id: instrumentId, target_name: targetName } 
    }),
  
  // Activate calibration by ID
  activateCalibration: (calibrationId: string) => 
    apiService.post('/calibration/activate', { calibration_id: calibrationId }),
  
  // Get active calibration
  getActiveCalibration: (methodId: number, instrumentId?: number) => 
    apiService.get('/calibration/active', { params: { method_id: methodId, instrument_id: instrumentId } }),
  
  // Get specific calibration
  getCalibration: (calibrationId: string) => apiService.get(`/calibration/${calibrationId}`),
  
  // Delete calibration
  deleteCalibration: (calibrationId: string) => apiService.delete(`/calibration/${calibrationId}`),
  
  // List calibrations with filtering
  listCalibrations: (methodId?: number, instrumentId?: number, targetName?: string) => 
    apiService.get('/calibration/', { 
      params: { method_id: methodId, instrument_id: instrumentId, target_name: targetName } 
    }),
  
  // Get residuals data for plotting
  getResiduals: (calibrationId: string) => apiService.get(`/calibration/${calibrationId}/residuals`),
  
  // Validate calibration quality
  validateCalibration: (calibrationId: string) => apiService.get(`/calibration/${calibrationId}/validation`),
  
  // Export calibration report
  exportCalibration: (calibrationId: string, format: 'csv' | 'pdf' | 'xlsx' | 'json' = 'csv') => 
    apiService.get(`/calibration/${calibrationId}/export`, { params: { format } }),
};

// Quantitation API
export const quantAPI = {
  // Quantitate a run
  quantitateRun: (data: any) => apiService.post('/quant/', data),
};

// Sequences API
export const sequencesAPI = {
  // Template management
  createTemplate: (data: any) => apiService.post('/sequences/templates', data),
  getTemplate: (templateId: string) => apiService.get(`/sequences/templates/${templateId}`),
  listTemplates: (instrumentId?: number) => 
    apiService.get('/sequences/templates', { params: { instrument_id: instrumentId } }),
  updateTemplate: (templateId: string, data: any) => apiService.put(`/sequences/templates/${templateId}`, data),
  deleteTemplate: (templateId: string) => apiService.delete(`/sequences/templates/${templateId}`),
  
  // Sequence runs
  runSequence: (data: any) => apiService.post('/sequences/run', data),
  getSequenceRun: (runId: string) => apiService.get(`/sequences/run/${runId}`),
  listSequenceRuns: (limit?: number) => 
    apiService.get('/sequences/runs', { params: { limit } }),
};

// Licensing API
export const licensingAPI = {
  // Get license info
  getLicenseInfo: () => apiService.get('/license'),
  
  // Validate license key
  validateLicense: (key: string) => apiService.post('/license/validate', { license_key: key }),
};

// User Preferences API
export const preferencesAPI = {
  // Get user preferences
  getPreferences: () => apiService.get('/user/preferences'),
  
  // Update user preferences
  updatePreferences: (preferences: any) => apiService.post('/user/preferences', preferences),
};

// QC Auto-Flagging API
export const qcAPI = {
  // QC Targets
  getTargets: (methodId: string, instrumentId?: string) => 
    apiService.get('/qc/targets', { params: { methodId, instrumentId } }),
  
  createTarget: (target: any) => apiService.post('/qc/targets', target),
  
  getTarget: (targetId: string) => apiService.get(`/qc/targets/${targetId}`),
  
  deleteTarget: (targetId: string) => apiService.delete(`/qc/targets/${targetId}`),
  
  // QC Series Data
  getSeries: (analyte: string, methodId: string, instrumentId?: string, days: number = 30) =>
    apiService.get('/qc/series', { params: { analyte, methodId, instrumentId, days } }),
  
  // QC Records
  getRecords: (filters: any = {}) => apiService.get('/qc/records', { params: filters }),
  
  // QC Policy
  getPolicy: () => apiService.get('/qc/policy'),
  
  setPolicy: (policy: any) => apiService.post('/qc/policy', policy),
  
  // QC Status
  getStatus: () => apiService.get('/qc/status'),
  
  // QC Override (stub for manual override functionality)
  override: (recordId: string, reason: string) => 
    apiService.post(`/qc/override/${recordId}`, { reason }),
};

export const wsService = new WebSocketService();

// Export the main apiService instance
export { apiService }; 

// Part 11: Audit and E-Sign APIs
export const auditAPI = {
  list: (params?: any) => apiService.get('/audit/', { params }),
};

export const esignAPI = {
  create: (data: { objectType: string; objectId: string; reason: string; objectData?: any }) =>
    apiService.post('/esign/', data),
  list: (params?: { objectType?: string; objectId?: string; limit?: number }) =>
    apiService.get('/esign/', { params }),
};