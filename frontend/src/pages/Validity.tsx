import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui';
import { Badge } from '../components/ui';
import { Shield, CheckCircle, FileText, Users, Award, Calendar } from 'lucide-react';

export const Validity: React.FC = () => {
  const validationItems = [
    { category: 'Method Validation', status: 'complete', count: 15, lastUpdated: '2025-09-15' },
    { category: 'System Suitability', status: 'current', count: 8, lastUpdated: '2025-09-17' },
    { category: 'Calibration Records', status: 'complete', count: 12, lastUpdated: '2025-09-16' },
    { category: 'Quality Control', status: 'pending', count: 3, lastUpdated: '2025-09-14' }
  ];

  const certifications = [
    { name: 'ISO 17025', status: 'valid', expires: '2026-03-15' },
    { name: 'EPA Method 8270', status: 'valid', expires: '2025-12-01' },
    { name: 'USP <621>', status: 'valid', expires: '2026-06-30' },
    { name: 'FDA 21 CFR Part 11', status: 'valid', expires: '2026-01-15' }
  ];

  const auditTrail = [
    { action: 'Method modification approved', user: 'Dr. Smith', timestamp: '2025-09-17 14:30' },
    { action: 'Calibration completed', user: 'Lab Tech A', timestamp: '2025-09-17 11:15' },
    { action: 'QC sample analyzed', user: 'Analyst B', timestamp: '2025-09-17 09:45' },
    { action: 'System backup verified', user: 'Admin', timestamp: '2025-09-16 16:20' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete':
      case 'current':
      case 'valid':
        return 'success';
      case 'pending':
        return 'warning';
      case 'expired':
        return 'error';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">System Validity</h1>
          <p className="text-text-secondary mt-2">
            Compliance tracking, method validation, and regulatory documentation
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="success">
            <Shield size={14} className="mr-1" />
            Compliant
          </Badge>
          <Badge variant="info">GMP Ready</Badge>
          <Badge variant="warning">Fidelity: Trends (Synthetic)</Badge>
        </div>
      </div>

      {/* Validation Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {validationItems.map((item, index) => (
          <Card key={index} variant="elevated">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-success-50 rounded-lg">
                  <CheckCircle className="text-success-600" size={20} />
                </div>
                <Badge variant={getStatusColor(item.status) as any} size="sm">
                  {item.status}
                </Badge>
              </div>
              <h3 className="font-semibold text-text-primary mb-1">{item.category}</h3>
              <p className="text-2xl font-bold text-text-primary mb-2">{item.count}</p>
              <p className="text-xs text-text-secondary">
                Last updated: {item.lastUpdated}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Certifications */}
      <Card variant="glass">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Award className="text-warning-500" size={20} />
            <CardTitle>Active Certifications</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {certifications.map((cert, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-surface rounded-lg">
                <div>
                  <h4 className="font-medium text-text-primary">{cert.name}</h4>
                  <p className="text-sm text-text-secondary">Expires: {cert.expires}</p>
                </div>
                <Badge variant="success" size="sm">Valid</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Documentation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <FileText className="text-info-500" size={20} />
              <CardTitle>Documentation</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-surface rounded-lg">
                <span className="text-text-primary">Method Protocols</span>
                <Badge variant="info" size="sm">24 Files</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-surface rounded-lg">
                <span className="text-text-primary">Validation Reports</span>
                <Badge variant="info" size="sm">18 Files</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-surface rounded-lg">
                <span className="text-text-primary">Calibration Records</span>
                <Badge variant="info" size="sm">45 Files</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-surface rounded-lg">
                <span className="text-text-primary">Audit Documents</span>
                <Badge variant="info" size="sm">12 Files</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Users className="text-accent-500" size={20} />
              <CardTitle>Audit Trail</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {auditTrail.map((entry, index) => (
                <div key={index} className="border-l-2 border-accent-200 pl-4 py-2">
                  <p className="text-sm font-medium text-text-primary">{entry.action}</p>
                  <p className="text-xs text-text-secondary">
                    by {entry.user} • {entry.timestamp}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Status */}
      <Card variant="elevated">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Calendar className="text-success-500" size={20} />
            <CardTitle>Compliance Dashboard</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-success-600 mb-2">100%</div>
              <div className="text-sm text-text-secondary">Method Validation</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-success-600 mb-2">98%</div>
              <div className="text-sm text-text-secondary">System Suitability</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-warning-600 mb-2">95%</div>
              <div className="text-sm text-text-secondary">Documentation</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};