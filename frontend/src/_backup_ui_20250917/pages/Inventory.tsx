import React from 'react';

import { Package, AlertTriangle, CheckCircle, TrendingDown, BarChart3 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';


// Mock inventory data
const inventoryItems = [
  {
    id: 'INV-001',
    name: 'GC Column - DB-5ms (30m x 0.25mm)',
    category: 'Columns',
    currentStock: 8,
    minThreshold: 3,
    maxCapacity: 15,
    unit: 'units',
    costPerUnit: 425.00,
    supplier: 'Agilent Technologies',
    lastOrdered: '2024-09-01',
    status: 'adequate'
  },
  {
    id: 'INV-002',
    name: 'Helium Gas Cylinder (Ultra Pure)',
    category: 'Gases',
    currentStock: 2,
    minThreshold: 3,
    maxCapacity: 10,
    unit: 'cylinders',
    costPerUnit: 185.00,
    supplier: 'Praxair Inc.',
    lastOrdered: '2024-08-15',
    status: 'low'
  },
  {
    id: 'INV-003',
    name: 'Sample Vials - 2mL Clear Glass',
    category: 'Consumables',
    currentStock: 450,
    minThreshold: 100,
    maxCapacity: 1000,
    unit: 'vials',
    costPerUnit: 0.85,
    supplier: 'Fisher Scientific',
    lastOrdered: '2024-09-10',
    status: 'adequate'
  },
  {
    id: 'INV-004',
    name: 'Liner - Ultra Inert Splitless',
    category: 'Consumables',
    currentStock: 15,
    minThreshold: 20,
    maxCapacity: 50,
    unit: 'liners',
    costPerUnit: 24.50,
    supplier: 'Restek Corporation',
    lastOrdered: '2024-08-20',
    status: 'low'
  },
  {
    id: 'INV-005',
    name: 'Septum - Pre-slit PTFE/Silicone',
    category: 'Consumables',
    currentStock: 95,
    minThreshold: 25,
    maxCapacity: 100,
    unit: 'septa',
    costPerUnit: 2.35,
    supplier: 'Supelco',
    lastOrdered: '2024-09-12',
    status: 'high'
  },
  {
    id: 'INV-006',
    name: 'Standard - PAH Mix 16 Component',
    category: 'Standards',
    currentStock: 0,
    minThreshold: 2,
    maxCapacity: 5,
    unit: 'ampules',
    costPerUnit: 195.00,
    supplier: 'AccuStandard',
    lastOrdered: '2024-07-15',
    status: 'out_of_stock'
  }
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'adequate': return 'bg-teal-500/20 text-teal-300 border-teal-400/30';
    case 'high': return 'bg-green-500/20 text-green-300 border-green-400/30';
    case 'low': return 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30';
    case 'out_of_stock': return 'bg-red-500/20 text-red-300 border-red-400/30';
    default: return 'bg-slate-500/20 text-slate-300 border-slate-400/30';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'adequate':
    case 'high': return <CheckCircle className="h-4 w-4" />;
    case 'low':
    case 'out_of_stock': return <AlertTriangle className="h-4 w-4" />;
    default: return <Package className="h-4 w-4" />;
  }
};

const getStockPercentage = (current: number, max: number) => {
  return (current / max) * 100;
};

const getProgressColor = (percentage: number) => {
  if (percentage > 60) return 'bg-teal-500';
  if (percentage > 30) return 'bg-yellow-500';
  return 'bg-red-500';
};

export const Inventory: React.FC = () => {
  const totalValue = inventoryItems.reduce((sum, item) => sum + (item.currentStock * item.costPerUnit), 0);
  const lowStockItems = inventoryItems.filter(item => item.status === 'low' || item.status === 'out_of_stock').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Inventory</h1>
          <p className="text-slate-400 mt-1">Laboratory consumables and supplies management</p>
        </div>
        <Button className="bg-teal-600 hover:bg-teal-700 text-white shadow-glow-teal">
          <Package className="h-4 w-4 mr-2" />
          Manage Orders
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Items</p>
                <p className="text-2xl font-bold text-white">{inventoryItems.length}</p>
              </div>
              <div className="w-12 h-12 bg-teal-500/20 rounded-lg flex items-center justify-center">
                <Package className="h-6 w-6 text-teal-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Inventory Value</p>
                <p className="text-2xl font-bold text-teal-400">${totalValue.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-teal-500/20 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-teal-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Low Stock Items</p>
                <p className="text-2xl font-bold text-yellow-400">{lowStockItems}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Categories</p>
                <p className="text-2xl font-bold text-cyan-400">
                  {Array.from(new Set(inventoryItems.map(item => item.category))).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                <TrendingDown className="h-6 w-6 text-cyan-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Items */}
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white">Current Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {inventoryItems.map((item) => {
              const stockPercentage = getStockPercentage(item.currentStock, item.maxCapacity);
              
              return (
                <div
                  key={item.id}
                  className="bg-slate-700/30 rounded-lg p-6 border border-slate-600/30"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-teal-500/20 rounded-lg flex items-center justify-center">
                        <Package className="h-6 w-6 text-teal-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">{item.name}</h3>
                        <p className="text-slate-400 text-sm">{item.id} • {item.category}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(item.status)}>
                        {getStatusIcon(item.status)}
                        <span className="ml-2 capitalize">{item.status.replace('_', ' ')}</span>
                      </Badge>
                    </div>
                  </div>

                  {/* Stock Level Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-400">Stock Level</span>
                      <span className="text-white">
                        {item.currentStock} / {item.maxCapacity} {item.unit}
                      </span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${getProgressColor(stockPercentage)}`}
                        style={{ width: `${Math.max(stockPercentage, 5)}%` }}
                      />
                      {/* Minimum threshold indicator */}
                      <div 
                        className="absolute h-3 w-0.5 bg-red-400 transform -translate-y-3"
                        style={{ left: `${(item.minThreshold / item.maxCapacity) * 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs mt-1">
                      <span className="text-red-400">Min: {item.minThreshold}</span>
                      <span className="text-slate-500">Max: {item.maxCapacity}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-slate-400">Unit Cost</p>
                      <p className="text-white font-medium">${item.costPerUnit.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Total Value</p>
                      <p className="text-white font-medium">
                        ${(item.currentStock * item.costPerUnit).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400">Supplier</p>
                      <p className="text-white font-medium">{item.supplier}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Last Ordered</p>
                      <p className="text-white font-medium">{item.lastOrdered}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};