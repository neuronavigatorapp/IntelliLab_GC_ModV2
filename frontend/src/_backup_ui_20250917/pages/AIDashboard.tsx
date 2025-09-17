import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Brain, TrendingUp, Activity, Zap } from 'lucide-react';

const aiStats = [
  { icon: <TrendingUp className="h-8 w-8 text-blue-500" />, label: 'Optimizations', value: 42 },
  { icon: <Activity className="h-8 w-8 text-green-500" />, label: 'Active Models', value: 7 },
  { icon: <Zap className="h-8 w-8 text-yellow-500" />, label: 'Predictions Today', value: 128 },
];

export const AIDashboard: React.FC = () => (
  <div className="min-h-screen bg-gray-50 p-8">
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl text-white">
          <Brain className="h-8 w-8" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Analytics Dashboard</h1>
          <p className="text-gray-600">Enterprise AI insights and optimization metrics</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {aiStats.map((stat, _idx) => (
          <Card key={stat.label} className="bg-gradient-to-br from-slate-100 to-slate-200 border-0 shadow-md">
            <CardContent className="flex items-center gap-4 p-6">
              {stat.icon}
              <div>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-gray-600 text-sm">{stat.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>AI Optimization Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-gray-400">
            [AI optimization charts coming soon]
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
);

export default AIDashboard;
