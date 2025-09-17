import React, { useState } from 'react';
import { PlayCircle, CheckCircle, AlertTriangle, Clock, Search } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

// Mock data for runs
const mockRuns = [
  {
    id: 'RUN-2024-001234',
    sampleName: 'Water Sample - Site A',
    method: 'EPA_8270D_SemiVOC',
    instrument: 'GC-MS-001',
    status: 'completed',
    startTime: '2024-09-14 09:15:00',
    endTime: '2024-09-14 10:00:00',
    operator: 'Dr. Sarah Johnson',
    qcPassed: true,
    injectionVolume: '1.0 µL',
    peaksDetected: 23
  },
  {
    id: 'RUN-2024-001235',
    sampleName: 'Soil Extract - Location B',
    method: 'Custom_Pesticides_Analysis',
    instrument: 'GC-MS-004',
    status: 'running',
    startTime: '2024-09-14 10:30:00',
    endTime: null,
    operator: 'Mike Chen',
    qcPassed: null,
    injectionVolume: '2.0 µL',
    peaksDetected: null,
    progress: 65
  },
  {
    id: 'RUN-2024-001236',
    sampleName: 'Gasoline Sample - Tank C',
    method: 'ASTM_D3328_Benzene',
    instrument: 'GC-FID-002',
    status: 'queued',
    startTime: null,
    endTime: null,
    operator: 'Dr. Maria Rodriguez',
    qcPassed: null,
    injectionVolume: '1.5 µL',
    peaksDetected: null
  },
  {
    id: 'RUN-2024-001237',
    sampleName: 'Pharmaceutical QC',
    method: 'USP_467_Solvents',
    instrument: 'GC-FID-002',
    status: 'error',
    startTime: '2024-09-14 08:00:00',
    endTime: '2024-09-14 08:15:00',
    operator: 'John Smith',
    qcPassed: false,
    injectionVolume: '0.5 µL',
    peaksDetected: 0,
    errorMessage: 'Injection system pressure fault'
  }
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return 'bg-teal-500/20 text-teal-300 border-teal-400/30';
    case 'running': return 'bg-blue-500/20 text-blue-300 border-blue-400/30';
    case 'queued': return 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30';
    case 'error': return 'bg-red-500/20 text-red-300 border-red-400/30';
    default: return 'bg-slate-500/20 text-slate-300 border-slate-400/30';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed': return <CheckCircle className="h-4 w-4" />;
    case 'running': return <PlayCircle className="h-4 w-4" />;
    case 'queued': return <Clock className="h-4 w-4" />;
    case 'error': return <AlertTriangle className="h-4 w-4" />;
    default: return <Clock className="h-4 w-4" />;
  }
};

export const Runs: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredRuns = mockRuns.filter(run => {
    const matchesSearch = run.sampleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         run.method.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         run.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || run.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Runs</h1>
          <p className="text-slate-400 mt-1">Sample run queue and analysis history</p>
        </div>
        <Button className="bg-teal-600 hover:bg-teal-700 text-white shadow-glow-teal">
          <PlayCircle className="h-4 w-4 mr-2" />
          New Run
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Runs Today</p>
                <p className="text-2xl font-bold text-white">{mockRuns.length}</p>
              </div>
              <div className="w-12 h-12 bg-teal-500/20 rounded-lg flex items-center justify-center">
                <PlayCircle className="h-6 w-6 text-teal-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Completed</p>
                <p className="text-2xl font-bold text-teal-400">
                  {mockRuns.filter(r => r.status === 'completed').length}
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
                <p className="text-slate-400 text-sm">Running</p>
                <p className="text-2xl font-bold text-blue-400">
                  {mockRuns.filter(r => r.status === 'running').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <PlayCircle className="h-6 w-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">In Queue</p>
                <p className="text-2xl font-bold text-yellow-400">
                  {mockRuns.filter(r => r.status === 'queued').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
          <Input 
            placeholder="Search runs..."
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            className="pl-10 bg-slate-800/50 border-slate-600/50 text-white"
          />
        </div>
        <select 
          value={filterStatus} 
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white"
        >
          <option value="all">All Status</option>
          <option value="completed">Completed</option>
          <option value="running">Running</option>
          <option value="queued">Queued</option>
          <option value="error">Error</option>
        </select>
      </div>

      {/* Runs Table */}
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white">Analysis Queue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredRuns.map((run) => (
              <div
                key={run.id}
                className="bg-slate-700/30 rounded-lg p-6 border border-slate-600/30 opacity-0 animate-fade-in"
                style={{ animationDelay: '0.1s' }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-teal-500/20 rounded-lg flex items-center justify-center">
                      {getStatusIcon(run.status)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{run.sampleName}</h3>
                      <p className="text-slate-400 text-sm">{run.id} • {run.operator}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(run.status)}>
                      {getStatusIcon(run.status)}
                      <span className="ml-2 capitalize">{run.status}</span>
                    </Badge>
                    {run.qcPassed === true && (
                      <Badge className="bg-teal-500/20 text-teal-300 border-teal-400/30">
                        QC Pass
                      </Badge>
                    )}
                    {run.qcPassed === false && (
                      <Badge className="bg-red-500/20 text-red-300 border-red-400/30">
                        QC Fail
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Progress bar for running samples */}
                {run.status === 'running' && run.progress && (
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-400">Analysis Progress</span>
                      <span className="text-blue-400">{run.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-cyan-400 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${run.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Error message */}
                {run.status === 'error' && run.errorMessage && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <p className="text-red-300 text-sm">{run.errorMessage}</p>
                  </div>
                )}
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-slate-400">Method</p>
                    <p className="text-white font-medium">{run.method}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Instrument</p>
                    <p className="text-white font-medium">{run.instrument}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Injection Volume</p>
                    <p className="text-white font-medium">{run.injectionVolume}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">
                      {run.status === 'completed' ? 'Peaks Detected' : 'Start Time'}
                    </p>
                    <p className="text-white font-medium">
                      {run.status === 'completed' 
                        ? `${run.peaksDetected} peaks`
                        : run.startTime || 'Queued'
                      }
                    </p>
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