import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import LeveyJenningsChart from '../../components/Chromatography/LeveyJenningsChart';
import { qcAPI, esignAPI } from '../../services/apiService';
import RequireRole from '../../components/Common/RequireRole';
import {
  QCTarget,
  QCRecord,
  QCTimeSeriesPoint,
  QCPolicy,
  QCStatus,
  WESTGARD_RULES,
  QC_STATUS_COLORS
} from '../../types/qc';

interface QCDashboardProps {}

const QCDashboard: React.FC<QCDashboardProps> = () => {
  const [targets, setTargets] = useState<QCTarget[]>([]);
  const [records, setRecords] = useState<QCRecord[]>([]);
  const [series, setSeries] = useState<{ [analyte: string]: QCTimeSeriesPoint[] }>({});
  const [policy, setPolicy] = useState<QCPolicy>({
    stopOnFail: true,
    warnOn1_2s: true,
    requireNBeforeStrict: 20
  });
  const [status, setStatus] = useState<QCStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMethodId, setSelectedMethodId] = useState<string>('1');
  const [selectedInstrumentId, setSelectedInstrumentId] = useState<string>('1');
  const [selectedAnalyte, setSelectedAnalyte] = useState<string>('');
  const [dateRange, setDateRange] = useState<number>(30);

  useEffect(() => {
    loadQCData();
  }, [selectedMethodId, selectedInstrumentId, dateRange]);

  useEffect(() => {
    if (selectedAnalyte) {
      loadSeriesData(selectedAnalyte);
    }
  }, [selectedAnalyte, selectedMethodId, selectedInstrumentId, dateRange]);

  const loadQCData = async () => {
    try {
      setLoading(true);
      
      // Load QC targets
      const targetsResponse = await qcAPI.getTargets(selectedMethodId, selectedInstrumentId);
      setTargets(targetsResponse.data);
      
      // Set first analyte as selected if none selected
      if (!selectedAnalyte && targetsResponse.data.length > 0) {
        setSelectedAnalyte(targetsResponse.data[0].analyte);
      }
      
      // Load QC records
      const recordsResponse = await qcAPI.getRecords({
        methodId: selectedMethodId,
        instrumentId: selectedInstrumentId,
        limit: 100
      });
      setRecords(recordsResponse.data);
      
      // Load QC policy
      const policyResponse = await qcAPI.getPolicy();
      setPolicy(policyResponse.data);
      
      // Load QC status
      const statusResponse = await qcAPI.getStatus();
      setStatus(statusResponse.data);
      
    } catch (error) {
      console.error('Failed to load QC data:', error);
      toast.error('Failed to load QC data');
    } finally {
      setLoading(false);
    }
  };

  const loadSeriesData = async (analyte: string) => {
    try {
      const response = await qcAPI.getSeries(
        analyte, 
        selectedMethodId, 
        selectedInstrumentId, 
        dateRange
      );
      setSeries(prev => ({ ...prev, [analyte]: response.data }));
    } catch (error) {
      console.error(`Failed to load series data for ${analyte}:`, error);
    }
  };

  const handlePolicyUpdate = async (newPolicy: QCPolicy) => {
    try {
      await qcAPI.setPolicy(newPolicy);
      setPolicy(newPolicy);
      toast.success('QC policy updated successfully');
    } catch (error) {
      console.error('Failed to update QC policy:', error);
      toast.error('Failed to update QC policy');
    }
  };

  const getRecentRuleHits = () => {
    const recentHits = records
      .filter(record => new Date(record.timestamp) > new Date(Date.now() - dateRange * 24 * 60 * 60 * 1000))
      .flatMap(record => record.ruleHits)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);
    
    return recentHits;
  };

  const getAnalyteTarget = (analyte: string) => {
    return targets.find(target => target.analyte === analyte);
  };

  const getAnalyteRuleHits = (analyte: string) => {
    return records
      .flatMap(record => record.ruleHits)
      .filter(hit => hit.analyte === analyte);
  };

  const signLatestQCForAnalyte = async () => {
    try {
      const latestRecord = records.find(r => r.results.some(res => res.analyte === selectedAnalyte));
      if (!latestRecord) {
        toast.error('No QC record found to sign');
        return;
      }
      await esignAPI.create({
        objectType: 'qcRecord',
        objectId: latestRecord.id,
        reason: `Approve QC for ${selectedAnalyte}`,
        objectData: latestRecord,
      });
      toast.success('QC record signed');
    } catch (e) {
      toast.error('Failed to sign QC record');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading QC Dashboard...</p>
        </div>
      </div>
    );
  }

  const recentRuleHits = getRecentRuleHits();
  const selectedTarget = getAnalyteTarget(selectedAnalyte);
  const selectedSeries = series[selectedAnalyte] || [];
  const selectedRuleHits = getAnalyteRuleHits(selectedAnalyte);

  return (
    <div className="qc-dashboard p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">QC Dashboard</h1>
        <p className="text-gray-600">Monitor QC performance and Westgard rule violations</p>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Method ID
            </label>
            <select
              value={selectedMethodId}
              onChange={(e) => setSelectedMethodId(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="1">Method 1</option>
              <option value="2">Method 2</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Instrument ID
            </label>
            <select
              value={selectedInstrumentId}
              onChange={(e) => setSelectedInstrumentId(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="1">GC-MS-001</option>
              <option value="2">GC-FID-002</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Analyte
            </label>
            <select
              value={selectedAnalyte}
              onChange={(e) => setSelectedAnalyte(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">Select Analyte</option>
              {targets.map(target => (
                <option key={target.id} value={target.analyte}>
                  {target.analyte}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date Range
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Status Cards */}
      {status && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-blue-600">{status.total_targets}</div>
            <div className="text-sm text-gray-600">QC Targets</div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-green-600">{status.total_records}</div>
            <div className="text-sm text-gray-600">QC Records</div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-red-600">{status.recent_failures}</div>
            <div className="text-sm text-gray-600">Recent Failures</div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <div className={`text-2xl font-bold ${status.system_status === 'operational' ? 'text-green-600' : 'text-red-600'}`}>
              {status.system_status.toUpperCase()}
            </div>
            <div className="text-sm text-gray-600">System Status</div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Levey-Jennings Chart */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-lg shadow">
            {selectedAnalyte && selectedTarget ? (
              <LeveyJenningsChart
                analyte={selectedAnalyte}
                points={selectedSeries}
                target={selectedTarget}
                ruleHits={selectedRuleHits}
                height={400}
                showBands={true}
                showRuleHits={true}
              />
            ) : (
              <div className="text-center py-20 text-gray-500">
                <p>Select an analyte to view the Levey-Jennings chart</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          
          {/* QC Policy */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">QC Policy</h3>
            
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={policy.stopOnFail}
                  onChange={(e) => handlePolicyUpdate({ ...policy, stopOnFail: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm">Stop sequence on failure</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={policy.warnOn1_2s}
                  onChange={(e) => handlePolicyUpdate({ ...policy, warnOn1_2s: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm">Warn on 1-2s rule</span>
              </label>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Points before strict rules
                </label>
                <input
                  type="number"
                  value={policy.requireNBeforeStrict}
                  onChange={(e) => handlePolicyUpdate({ ...policy, requireNBeforeStrict: Number(e.target.value) })}
                  min="1"
                  max="100"
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
            </div>
            <div className="pt-3">
              <RequireRole role={['admin','qc','analyst']} userRole={'analyst'}>
                <button
                  onClick={signLatestQCForAnalyte}
                  className="bg-green-600 text-white px-3 py-2 rounded-md text-sm"
                >
                  Sign latest QC for analyte
                </button>
              </RequireRole>
            </div>
          </div>

          {/* Recent Rule Hits */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Rule Violations</h3>
            
            {recentRuleHits.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {recentRuleHits.map((hit, index) => {
                  const rule = WESTGARD_RULES.find(r => r.id === hit.rule);
                  return (
                    <div key={index} className="p-2 border rounded text-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-semibold">{hit.analyte}</span>
                          <span 
                            className="ml-2 px-2 py-1 rounded text-xs"
                            style={{ 
                              backgroundColor: rule?.color + '20',
                              color: rule?.color 
                            }}
                          >
                            {hit.rule}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(hit.timestamp).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        Value: {hit.value.toFixed(3)}, Z-score: {hit.zscore.toFixed(2)}σ
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No recent rule violations</p>
            )}
          </div>

          {/* QC Targets Summary */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">QC Targets</h3>
            
            {targets.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {targets.map(target => (
                  <div key={target.id} className="p-2 border rounded text-sm">
                    <div className="font-semibold">{target.analyte}</div>
                    <div className="text-xs text-gray-600">
                      {target.mean.toFixed(3)} ± {target.sd.toFixed(3)} {target.unit}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No QC targets defined</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QCDashboard;
