import React from 'react';

import { Microscope, Wifi, AlertTriangle, CheckCircle, Clock, Settings } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';

// Mock data for instruments
const mockInstruments = [
  {
    id: 'GC-MS-001',
    name: 'Agilent 8860 GC / 5977B MS',
    status: 'online',
    location: 'Lab A - Bay 1',
    lastMaintenance: '2024-09-10',
    nextMaintenance: '2024-10-10',
    uptime: '99.2%',
    temperature: '250°C',
    pressure: '15.2 psi',
    currentMethod: 'EPA_8270D_SemiVOC'
  },
  {
    id: 'GC-FID-002', 
    name: 'Shimadzu GC-2030 FID',
    status: 'maintenance',
    location: 'Lab B - Bay 2',
    lastMaintenance: '2024-09-14',
    nextMaintenance: '2024-11-14',
    uptime: '97.8%',
    temperature: 'N/A',
    pressure: 'N/A',
    currentMethod: 'Routine Maintenance'
  },
  {
    id: 'GC-ECD-003',
    name: 'PerkinElmer Clarus 690 ECD',
    status: 'error',
    location: 'Lab A - Bay 3',
    lastMaintenance: '2024-08-15',
    nextMaintenance: '2024-09-15',
    uptime: '94.5%',
    temperature: 'Error',
    pressure: 'Low Pressure Alert',
    currentMethod: 'System Error'
  },
  {
    id: 'GC-MS-004',
    name: 'Thermo Fisher Trace 1310 GC-MS',
    status: 'online',
    location: 'Lab C - Bay 1', 
    lastMaintenance: '2024-09-05',
    nextMaintenance: '2024-12-05',
    uptime: '98.9%',
    temperature: '320°C',
    pressure: '12.8 psi',
    currentMethod: 'Custom_Pesticides_Analysis'
  }
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'online': return 'bg-teal-500/20 text-teal-300 border-teal-400/30';
    case 'maintenance': return 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30';
    case 'error': return 'bg-red-500/20 text-red-300 border-red-400/30';
    default: return 'bg-slate-500/20 text-slate-300 border-slate-400/30';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'online': return <CheckCircle className="h-4 w-4" />;
    case 'maintenance': return <Clock className="h-4 w-4" />;
    case 'error': return <AlertTriangle className="h-4 w-4" />;
    default: return <Wifi className="h-4 w-4" />;
  }
};

export const Instruments: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Instruments</h1>
          <p className="text-slate-400 mt-1">Monitor and manage GC system fleet</p>
        </div>
        <Button className="bg-teal-600 hover:bg-teal-700 text-white shadow-glow-teal">
          <Settings className="h-4 w-4 mr-2" />
          Configure Instruments
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Instruments</p>
                <p className="text-2xl font-bold text-white">{mockInstruments.length}</p>
              </div>
              <div className="w-12 h-12 bg-teal-500/20 rounded-lg flex items-center justify-center">
                <Microscope className="h-6 w-6 text-teal-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Online</p>
                <p className="text-2xl font-bold text-teal-400">
                  {mockInstruments.filter(i => i.status === 'online').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-teal-500/20 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-teal-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Maintenance</p>
                <p className="text-2xl font-bold text-yellow-400">
                  {mockInstruments.filter(i => i.status === 'maintenance').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Errors</p>
                <p className="text-2xl font-bold text-red-400">
                  {mockInstruments.filter(i => i.status === 'error').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Instruments Table */}
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white">Instrument Fleet Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockInstruments.map((instrument) => (
              <div
                key={instrument.id}
                className="bg-slate-700/30 rounded-lg p-6 border border-slate-600/30"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-teal-500/20 rounded-lg flex items-center justify-center">
                      <Microscope className="h-6 w-6 text-teal-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{instrument.name}</h3>
                      <p className="text-slate-400 text-sm">{instrument.id} • {instrument.location}</p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(instrument.status)}>
                    {getStatusIcon(instrument.status)}
                    <span className="ml-2 capitalize">{instrument.status}</span>
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-slate-400">Current Method</p>
                    <p className="text-white font-medium">{instrument.currentMethod}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Temperature</p>
                    <p className="text-white font-medium">{instrument.temperature}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Pressure</p>
                    <p className="text-white font-medium">{instrument.pressure}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Uptime</p>
                    <p className="text-white font-medium">{instrument.uptime}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};