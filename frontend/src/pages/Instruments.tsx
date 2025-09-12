import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/Badge';
import { 
  Microscope, 
  Plus, 
  Edit, 
  Copy, 
  Archive,
  Settings,
  Activity,
  AlertCircle
} from 'lucide-react';

interface VirtualInstrument {
  id: string;
  name: string;
  model: string;
  column: string;
  detector: string[];
  status: 'active' | 'maintenance' | 'offline';
  lastUsed: string;
}

interface InstrumentsProps {
  onNavigate: (path: string) => void;
}

export const Instruments: React.FC<InstrumentsProps> = ({ onNavigate }) => {
  const [instruments] = useState<VirtualInstrument[]>([
    {
      id: '1',
      name: 'GC-2030 Main',
      model: 'Shimadzu GC-2030',
      column: 'Rxi-5ms (30m × 0.25mm × 0.25μm)',
      detector: ['FID', 'MS'],
      status: 'active',
      lastUsed: '2 hours ago'
    },
    {
      id: '2',
      name: 'GC-2014 Plus',
      model: 'Shimadzu GC-2014 Plus',
      column: 'DB-624 (30m × 0.25mm × 1.4μm)',
      detector: ['FID', 'ECD'],
      status: 'active',
      lastUsed: '1 day ago'
    },
    {
      id: '3',
      name: 'GC-2030 Backup',
      model: 'Shimadzu GC-2030',
      column: 'Rxi-5ms (30m × 0.25mm × 0.25μm)',
      detector: ['FID'],
      status: 'maintenance',
      lastUsed: '1 week ago'
    },
    {
      id: '4',
      name: 'GC-2010 Plus',
      model: 'Shimadzu GC-2010 Plus',
      column: 'DB-1 (30m × 0.25mm × 0.25μm)',
      detector: ['FID', 'TCD'],
      status: 'offline',
      lastUsed: '2 weeks ago'
    }
  ]);

  const [showCreateForm, setShowCreateForm] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'maintenance':
        return 'warning';
      case 'offline':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Activity className="h-4 w-4" />;
      case 'maintenance':
        return <Settings className="h-4 w-4" />;
      case 'offline':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Virtual Instruments</h1>
          <p className="text-gray-600">Manage and configure your GC instrument fleet</p>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          variant="brand"
          className="flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Create Instrument</span>
        </Button>
      </div>

      {/* Instruments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {instruments.map((instrument, index) => (
          <motion.div
            key={instrument.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
          >
            <Card className="card-hover">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{instrument.name}</CardTitle>
                    <p className="text-sm text-gray-600">{instrument.model}</p>
                  </div>
                  <Badge variant={getStatusColor(instrument.status)} className="flex items-center space-x-1">
                    {getStatusIcon(instrument.status)}
                    <span className="capitalize">{instrument.status}</span>
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Microscope className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium">Column:</span>
                  </div>
                  <p className="text-sm text-gray-600 ml-6">{instrument.column}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Settings className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium">Detectors:</span>
                  </div>
                  <div className="flex flex-wrap gap-1 ml-6">
                    {instrument.detector.map((det, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {det}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="text-xs text-gray-500">
                  Last used: {instrument.lastUsed}
                </div>

                <div className="flex space-x-2 pt-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    <Copy className="h-3 w-3 mr-1" />
                    Duplicate
                  </Button>
                  <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                    <Archive className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Create Instrument Form (Modal-like) */}
      {showCreateForm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowCreateForm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
            <div 
              className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Create New Instrument</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCreateForm(false)}
              >
                ×
              </Button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Instrument Name</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="e.g., GC-2030 Lab A"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Model</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                    <option>Shimadzu GC-2030</option>
                    <option>Shimadzu GC-2014 Plus</option>
                    <option>Agilent 7890B</option>
                    <option>Thermo TRACE 1310</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Column Configuration</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                  <option>Rxi-5ms (30m × 0.25mm × 0.25μm)</option>
                  <option>DB-624 (30m × 0.25mm × 1.4μm)</option>
                  <option>DB-1 (30m × 0.25mm × 0.25μm)</option>
                  <option>Custom Configuration</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Detectors</label>
                <div className="grid grid-cols-2 gap-2">
                  {['FID', 'MS', 'ECD', 'TCD', 'NPD', 'FPD'].map((detector) => (
                    <label key={detector} className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm">{detector}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="brand"
                  onClick={() => {
                    // Handle create instrument
                    setShowCreateForm(false);
                  }}
                >
                  Create Instrument
                </Button>
              </div>
            </div>
            </div>
          </motion.div>
          </div>
        </motion.div>
      )}

      {/* Summary Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {instruments.length}
              </div>
              <div className="text-sm text-gray-600">Total Instruments</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {instruments.filter(i => i.status === 'active').length}
              </div>
              <div className="text-sm text-gray-600">Active</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {instruments.filter(i => i.status === 'maintenance').length}
              </div>
              <div className="text-sm text-gray-600">Maintenance</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {instruments.filter(i => i.status === 'offline').length}
              </div>
              <div className="text-sm text-gray-600">Offline</div>
            </div>
          </CardContent>
        </Card>
        </div>
      </motion.div>
    </div>
  );
};
