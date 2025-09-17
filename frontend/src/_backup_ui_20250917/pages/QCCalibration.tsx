import React from 'react';

import { Target, TrendingUp, CheckCircle, AlertTriangle, Calendar } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';

// Mock QC data
const qcTrends = [
  { date: '09-10', value: 98.5, target: 100, ucl: 105, lcl: 95 },
  { date: '09-11', value: 101.2, target: 100, ucl: 105, lcl: 95 },
  { date: '09-12', value: 99.8, target: 100, ucl: 105, lcl: 95 },
  { date: '09-13', value: 100.5, target: 100, ucl: 105, lcl: 95 },
  { date: '09-14', value: 102.1, target: 100, ucl: 105, lcl: 95 },
];

const calibrationData = [
  { concentration: 0.1, response: 125.5, expected: 120.0 },
  { concentration: 0.5, response: 598.2, expected: 600.0 },
  { concentration: 1.0, response: 1201.8, expected: 1200.0 },
  { concentration: 2.0, response: 2395.6, expected: 2400.0 },
  { concentration: 5.0, response: 5987.3, expected: 6000.0 },
];

const qcSamples = [
  {
    id: 'QC-001',
    type: 'Reference Standard',
    compound: 'Benzene',
    expectedValue: '100.0 mg/L',
    measuredValue: '98.5 mg/L',
    deviation: '-1.5%',
    status: 'pass',
    runDate: '2024-09-14'
  },
  {
    id: 'QC-002', 
    type: 'Check Standard',
    compound: 'Toluene',
    expectedValue: '50.0 mg/L',
    measuredValue: '52.3 mg/L',
    deviation: '+4.6%',
    status: 'warning',
    runDate: '2024-09-14'
  },
  {
    id: 'QC-003',
    type: 'Blank',
    compound: 'Various',
    expectedValue: '< 0.1 mg/L',
    measuredValue: '0.08 mg/L',
    deviation: 'OK',
    status: 'pass',
    runDate: '2024-09-14'
  }
];

export const QCCalibration: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">QC & Calibration</h1>
          <p className="text-slate-400 mt-1">Quality control monitoring and calibration management</p>
        </div>
        <Button className="bg-teal-600 hover:bg-teal-700 text-white shadow-glow-teal">
          <Target className="h-4 w-4 mr-2" />
          New QC Run
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">QC Pass Rate</p>
                <p className="text-2xl font-bold text-teal-400">96.7%</p>
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
                <p className="text-slate-400 text-sm">Calibrations Due</p>
                <p className="text-2xl font-bold text-yellow-400">3</p>
              </div>
              <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Control Charts</p>
                <p className="text-2xl font-bold text-cyan-400">12</p>
              </div>
              <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-cyan-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Out of Control</p>
                <p className="text-2xl font-bold text-red-400">1</p>
              </div>
              <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Levey-Jennings Chart */}
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-white">QC Trend Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={qcTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                  <XAxis dataKey="date" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid #475569',
                      borderRadius: '8px'
                    }}
                  />
                  <Line type="monotone" dataKey="ucl" stroke="#ef4444" strokeDasharray="5 5" name="UCL" />
                  <Line type="monotone" dataKey="target" stroke="#14b8a6" strokeWidth={2} name="Target" />
                  <Line type="monotone" dataKey="lcl" stroke="#ef4444" strokeDasharray="5 5" name="LCL" />
                  <Line type="monotone" dataKey="value" stroke="#22d3ee" strokeWidth={3} name="QC Value" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Calibration Chart */}
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-white">Calibration Curve</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart data={calibrationData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                  <XAxis dataKey="concentration" stroke="#94a3b8" name="Concentration" />
                  <YAxis dataKey="response" stroke="#94a3b8" name="Response" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid #475569',
                      borderRadius: '8px'
                    }}
                  />
                  <Scatter dataKey="response" fill="#14b8a6" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 text-center">
              <p className="text-sm text-slate-400">
                R² = 0.9995 • Linearity: Excellent
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* QC Sample Results */}
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white">Recent QC Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {qcSamples.map((sample) => (
              <div
                key={sample.id}
                className="bg-slate-700/30 rounded-lg p-6 border border-slate-600/30 opacity-0 animate-fade-in"
                style={{ animationDelay: '0.1s' }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-teal-500/20 rounded-lg flex items-center justify-center">
                      <Target className="h-6 w-6 text-teal-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{sample.type}</h3>
                      <p className="text-slate-400 text-sm">{sample.id} • {sample.compound}</p>
                    </div>
                  </div>
                  <Badge className={
                    sample.status === 'pass' 
                      ? 'bg-teal-500/20 text-teal-300 border-teal-400/30'
                      : sample.status === 'warning'
                      ? 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30'
                      : 'bg-red-500/20 text-red-300 border-red-400/30'
                  }>
                    {sample.status === 'pass' ? <CheckCircle className="h-4 w-4 mr-1" /> : 
                     sample.status === 'warning' ? <AlertTriangle className="h-4 w-4 mr-1" /> :
                     <AlertTriangle className="h-4 w-4 mr-1" />}
                    {sample.status.toUpperCase()}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-slate-400">Expected Value</p>
                    <p className="text-white font-medium">{sample.expectedValue}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Measured Value</p>
                    <p className="text-white font-medium">{sample.measuredValue}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Deviation</p>
                    <p className={`font-medium ${
                      sample.status === 'pass' ? 'text-teal-400' :
                      sample.status === 'warning' ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {sample.deviation}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400">Run Date</p>
                    <p className="text-white font-medium">{sample.runDate}</p>
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