import React from 'react';
import { Link } from 'react-router-dom';
import { ConnectivityBadge } from '../../components/Offline/ConnectivityBadge';
import { SyncStatus } from '../../components/Offline/SyncStatus';

export const MobileHome: React.FC = () => {
  const quickActions = [
    {
      title: 'Record QC',
      description: 'Add QC measurements',
      icon: '📊',
      color: 'bg-blue-500',
      link: '/m/qc'
    },
    {
      title: 'Inventory',
      description: 'Manage consumables',
      icon: '📦',
      color: 'bg-green-500',
      link: '/m/inventory'
    },
    {
      title: 'Maintenance',
      description: 'Log maintenance notes',
      icon: '🔧',
      color: 'bg-yellow-500',
      link: '/maintenance'
    },
    {
      title: 'Photos',
      description: 'Capture and attach photos',
      icon: '📷',
      color: 'bg-purple-500',
      link: '/attachments'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Mobile Lab</h1>
          <div className="flex items-center gap-2">
            <ConnectivityBadge />
            <SyncStatus showDetails={false} />
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">🧪</span>
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">IntelliLab GC</h2>
              <p className="text-sm text-gray-600">Mobile Companion</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-4">
          {quickActions.map((action, index) => (
            <Link
              key={index}
              to={action.link}
              className="block bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center mb-3`}>
                <span className="text-2xl">{action.icon}</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{action.title}</h3>
              <p className="text-sm text-gray-600">{action.description}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-sm">📊</span>
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">QC Record Added</p>
                <p className="text-sm text-gray-600">GC-2010 - Toluene measurement</p>
              </div>
              <span className="text-xs text-gray-500">2m ago</span>
            </div>
          </div>
          
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <span className="text-sm">📦</span>
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Inventory Updated</p>
                <p className="text-sm text-gray-600">Carrier gas - 2 cylinders remaining</p>
              </div>
              <span className="text-xs text-gray-500">15m ago</span>
            </div>
          </div>
          
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-sm">🔧</span>
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Maintenance Note</p>
                <p className="text-sm text-gray-600">Column replacement scheduled</p>
              </div>
              <span className="text-xs text-gray-500">1h ago</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sync Status */}
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Sync Status</h2>
        <SyncStatus showDetails={true} />
      </div>

      {/* Navigation Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <div className="flex justify-around">
          <Link to="/" className="flex flex-col items-center text-gray-600 hover:text-blue-600">
            <span className="text-xl">🏠</span>
            <span className="text-xs">Home</span>
          </Link>
          <Link to="/m" className="flex flex-col items-center text-blue-600">
            <span className="text-xl">📱</span>
            <span className="text-xs">Mobile</span>
          </Link>
          <Link to="/instruments" className="flex flex-col items-center text-gray-600 hover:text-blue-600">
            <span className="text-xl">🔬</span>
            <span className="text-xs">Instruments</span>
          </Link>
          <Link to="/settings" className="flex flex-col items-center text-gray-600 hover:text-blue-600">
            <span className="text-xl">⚙️</span>
            <span className="text-xs">Settings</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
