import React, { useState } from 'react';
import QCCharts from '../components/QCCompliance/QCCharts';
import AuditLogViewer from '../components/QCCompliance/AuditLogViewer';
import LIMSSettings from '../components/QCCompliance/LIMSSettings';
import { isQCComplianceEnabled, isLIMSEnabled } from '../config/featureFlags';

interface Tab {
  id: string;
  name: string;
  component: React.ReactNode;
  enabled: boolean;
}

const QCCompliance: React.FC = () => {
  const [activeTab, setActiveTab] = useState('qc-charts');

  const tabs: Tab[] = [
    {
      id: 'qc-charts',
      name: 'QC Charts',
      component: <QCCharts analyte="Benzene" days={30} />,
      enabled: isQCComplianceEnabled()
    },
    {
      id: 'audit-log',
      name: 'Audit Log',
      component: <AuditLogViewer />,
      enabled: isQCComplianceEnabled()
    },
    {
      id: 'lims-settings',
      name: 'LIMS Settings',
      component: <LIMSSettings />,
      enabled: isLIMSEnabled()
    }
  ];

  const enabledTabs = tabs.filter(tab => tab.enabled);

  if (enabledTabs.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">QC & Compliance Features Disabled</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  The QC & Compliance features are currently disabled. Please contact your administrator to enable these features.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">QC & Compliance</h1>
          <p className="mt-2 text-gray-600">
            Quality control management, audit trails, and LIMS integration for regulatory compliance.
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
              {enabledTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    py-4 px-1 border-b-2 font-medium text-sm
                    ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {enabledTabs.find(tab => tab.id === activeTab)?.component}
          </div>
        </div>

        {/* Feature Information */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">QC Charts</h3>
                <p className="text-sm text-gray-500">
                  Control charts with SPC rules for quality monitoring and trend analysis.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Audit Log</h3>
                <p className="text-sm text-gray-500">
                  21 CFR Part 11 compliant audit trails for all system activities.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">LIMS Integration</h3>
                <p className="text-sm text-gray-500">
                  Connect to external LIMS systems for data exchange and synchronization.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Compliance Information */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Compliance Features</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p className="mb-2">
                  This module provides comprehensive quality control and compliance features:
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>QC Management:</strong> ASTM D6299-style control charts with SPC rules</li>
                  <li><strong>Audit Trails:</strong> 21 CFR Part 11 compliant electronic records</li>
                  <li><strong>LIMS Integration:</strong> Secure data exchange with external systems</li>
                  <li><strong>Trend Analysis:</strong> Statistical process control and trend detection</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QCCompliance;
