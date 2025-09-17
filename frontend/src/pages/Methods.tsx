import React, { useState } from 'react';

import { FileText, Search, Filter, Plus, Edit, Trash2, Clock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

// Mock data for methods
const mockMethods = [
  {
    id: 'EPA_8270D',
    name: 'EPA 8270D - Semivolatile Organic Compounds',
    category: 'Environmental',
    status: 'validated',
    lastModified: '2024-09-10',
    author: 'Dr. Smith',
    runtime: '45 min',
    description: 'Analysis of semivolatile organic compounds in water and soil samples'
  },
  {
    id: 'ASTM_D3328',
    name: 'ASTM D3328 - Gasoline Additives',
    category: 'Petroleum',
    status: 'draft',
    lastModified: '2024-09-12',
    author: 'Dr. Johnson',
    runtime: '32 min',
    description: 'Determination of gasoline additives by gas chromatography'
  },
  {
    id: 'CUSTOM_PEST',
    name: 'Custom Pesticide Screen',
    category: 'Food & Agriculture',
    status: 'validated',
    lastModified: '2024-09-08',
    author: 'Dr. Williams',
    runtime: '28 min',
    description: 'Multi-residue pesticide analysis for agricultural products'
  },
  {
    id: 'USP_467',
    name: 'USP <467> - Residual Solvents',
    category: 'Pharmaceutical',
    status: 'under_review',
    lastModified: '2024-09-14',
    author: 'Dr. Brown',
    runtime: '55 min',
    description: 'Residual solvent analysis in pharmaceutical products'
  }
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'validated': return 'bg-teal-500/20 text-teal-300 border-teal-400/30';
    case 'draft': return 'bg-amber-500/20 text-amber-300 border-amber-400/30';
    case 'under_review': return 'bg-purple-500/20 text-purple-300 border-purple-400/30';
    default: return 'bg-slate-500/20 text-slate-300 border-slate-400/30';
  }
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'Environmental': return 'bg-green-500/20 text-green-300 border-green-400/30';
    case 'Petroleum': return 'bg-orange-500/20 text-orange-300 border-orange-400/30';
    case 'Food & Agriculture': return 'bg-cyan-500/20 text-cyan-300 border-cyan-400/30';
    case 'Pharmaceutical': return 'bg-blue-500/20 text-blue-300 border-blue-400/30';
    default: return 'bg-slate-500/20 text-slate-300 border-slate-400/30';
  }
};

export const Methods: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const filteredMethods = mockMethods.filter(method => {
    const matchesSearch = method.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         method.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === '' || method.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(mockMethods.map(m => m.category)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Analytical Methods</h1>
          <p className="text-slate-400">Manage and deploy validated analytical methods</p>
        </div>
        <Button className="bg-teal-600 hover:bg-teal-700 text-white">
          <Plus className="h-4 w-4 mr-2" />
          New Method
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search methods..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-700/50 border-slate-600/50 text-white placeholder-slate-400"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-md text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Methods</p>
                <p className="text-2xl font-bold text-white">{mockMethods.length}</p>
              </div>
              <div className="w-12 h-12 bg-teal-500/20 rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-teal-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Validated</p>
                <p className="text-2xl font-bold text-emerald-400">
                  {mockMethods.filter(m => m.status === 'validated').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-emerald-400" />
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
                  {categories.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                <Filter className="h-6 w-6 text-cyan-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Avg Runtime</p>
                <p className="text-2xl font-bold text-purple-400">
                  {Math.round(mockMethods.reduce((acc, m) => acc + parseInt(m.runtime), 0) / mockMethods.length)} min
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Methods Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredMethods.map((method) => (
          <Card key={method.id} className="bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/50 transition-colors">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg text-white mb-2">{method.name}</CardTitle>
                  <p className="text-slate-400 text-sm">{method.description}</p>
                </div>
                <div className="flex space-x-2">
                  <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" className="text-slate-400 hover:text-red-400">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge className={getCategoryColor(method.category)}>
                    {method.category}
                  </Badge>
                  <Badge className={getStatusColor(method.status)}>
                    {method.status.replace('_', ' ')}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-400">Author:</span>
                    <span className="text-white ml-1">{method.author}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Runtime:</span>
                    <span className="text-white ml-1">{method.runtime}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400">Last Modified:</span>
                    <span className="text-white ml-1">{method.lastModified}</span>
                  </div>
                </div>

                <div className="flex space-x-2 pt-2">
                  <Button size="sm" className="flex-1 bg-teal-600 hover:bg-teal-700">
                    Deploy
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 border-slate-600 text-slate-300 hover:text-white">
                    View Details
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredMethods.length === 0 && (
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No Methods Found</h3>
            <p className="text-slate-400 mb-4">
              {searchTerm || selectedCategory ? 
                'No methods match your current filters.' : 
                'No analytical methods available. Create your first method to get started.'
              }
            </p>
            <Button className="bg-teal-600 hover:bg-teal-700">
              <Plus className="h-4 w-4 mr-2" />
              Create Method
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};