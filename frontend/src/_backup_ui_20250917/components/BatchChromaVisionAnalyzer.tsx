// Batch ChromaVision Analyzer - OCR-Driven Multi-Chromatogram Analysis
// Perfect for field work where you collect multiple chromatogram images and need comprehensive analysis.

import React, { useState, useCallback, useRef } from 'react';
import { Upload, FileImage, BarChart3, Download, Trash2, Play, CheckCircle, AlertCircle, XCircle, FileText, TrendingUp, Camera } from 'lucide-react';

interface ChromatogramFile {
  id: string;
  file: File;
  preview: string;
  status: 'pending' | 'analyzing' | 'complete' | 'error';
  analysis?: any;
  timestamp: Date;
}

interface BatchAnalysisReport {
  totalSamples: number;
  successfulAnalyses: number;
  averageQualityScore: number;
  commonIssues: string[];
  recommendations: string[];
  analysisTimestamp: Date;
}

const BatchChromaVisionAnalyzer: React.FC = () => {
  const [files, setFiles] = useState<ChromatogramFile[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [batchReport, setBatchReport] = useState<BatchAnalysisReport | null>(null);
  const [selectedView, setSelectedView] = useState<'upload' | 'analysis' | 'report'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file upload (multiple files)
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    
    selectedFiles.forEach(file => {
      if (file.type.startsWith('image/') || file.type === 'application/pdf') {
        const reader = new FileReader();
        reader.onload = (e) => {
          const newFile: ChromatogramFile = {
            id: `${Date.now()}-${Math.random()}`,
            file,
            preview: e.target?.result as string,
            status: 'pending',
            timestamp: new Date()
          };
          
          setFiles(prev => [...prev, newFile]);
        };
        reader.readAsDataURL(file);
      }
    });
    
    // Clear input
    if (event.target) {
      event.target.value = '';
    }
  }, []);

  // Analyze single chromatogram
  const analyzeChromatogram = async (chromatogramFile: ChromatogramFile): Promise<any> => {
    try {
      const response = await fetch('/api/chromatogram/analyze-base64', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: chromatogramFile.preview
        })
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      throw new Error(`Failed to analyze ${chromatogramFile.file.name}: ${error.message}`);
    }
  };

  // Run batch analysis
  const runBatchAnalysis = async () => {
    if (files.length === 0) return;

    setIsAnalyzing(true);
    setSelectedView('analysis');
    
    let successCount = 0;
    let totalQuality = 0;
    const allIssues: string[] = [];
    const allRecommendations: string[] = [];

    // Update all files to analyzing status
    setFiles(prev => prev.map(f => ({ ...f, status: 'analyzing' as const })));

    // Analyze each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      try {
        const analysis = await analyzeChromatogram(file);
        
        // Update file with successful analysis
        setFiles(prev => prev.map(f => 
          f.id === file.id 
            ? { ...f, status: 'complete', analysis }
            : f
        ));
        
        successCount++;
        
        // Accumulate quality scores and issues
        if (analysis.analysis?.overall_quality_score) {
          totalQuality += analysis.analysis.overall_quality_score;
        }
        
        if (analysis.analysis?.troubleshooting_suggestions) {
          allIssues.push(...analysis.analysis.troubleshooting_suggestions);
        }
        
        if (analysis.analysis?.method_recommendations) {
          allRecommendations.push(...analysis.analysis.method_recommendations);
        }
        
      } catch (error: any) {
        console.error(`Analysis failed for ${file.file.name}:`, error);
        
        // Update file with error status
        setFiles(prev => prev.map(f => 
          f.id === file.id 
            ? { ...f, status: 'error', analysis: { error: error.message } }
            : f
        ));
      }
      
      // Small delay between analyses to prevent overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Generate batch report
    const report: BatchAnalysisReport = {
      totalSamples: files.length,
      successfulAnalyses: successCount,
      averageQualityScore: successCount > 0 ? totalQuality / successCount : 0,
      commonIssues: Array.from(new Set(allIssues)).slice(0, 5), // Top 5 unique issues
      recommendations: Array.from(new Set(allRecommendations)).slice(0, 5), // Top 5 unique recommendations
      analysisTimestamp: new Date()
    };

    setBatchReport(report);
    setIsAnalyzing(false);
    setSelectedView('report');
  };

  // Clear all files
  const clearAllFiles = () => {
    setFiles([]);
    setBatchReport(null);
    setSelectedView('upload');
  };

  // Remove single file
  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  // Generate professional report
  const generateReport = () => {
    if (!batchReport) return;

    const reportContent = `
# ChromaVision Batch Analysis Report

**Analysis Date:** ${batchReport.analysisTimestamp.toLocaleString()}  
**Total Samples:** ${batchReport.totalSamples}  
**Successful Analyses:** ${batchReport.successfulAnalyses}  
**Success Rate:** ${((batchReport.successfulAnalyses / batchReport.totalSamples) * 100).toFixed(1)}%  
**Average Quality Score:** ${batchReport.averageQualityScore.toFixed(1)}%  

## Sample Analysis Results

${files.map((file, index) => `
### Sample ${index + 1}: ${file.file.name}
- **Status:** ${file.status === 'complete' ? '✅ Complete' : file.status === 'error' ? '❌ Failed' : '⏳ Pending'}
- **Quality Score:** ${file.analysis?.analysis?.overall_quality_score?.toFixed(1) || 'N/A'}%
- **Peak Count:** ${file.analysis?.analysis?.peaks?.length || 'N/A'}
- **Primary Issue:** ${file.analysis?.ai_insights?.primary_issue || 'N/A'}
`).join('')}

## Common Issues Identified
${batchReport.commonIssues.map(issue => `- ${issue}`).join('\n')}

## Method Recommendations  
${batchReport.recommendations.map(rec => `- ${rec}`).join('\n')}

---
*Generated by ChromaVision AI - Professional GC Analysis Platform*
    `;

    // Create and download the report
    const blob = new Blob([reportContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ChromaVision_Batch_Report_${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusIcon = (status: ChromatogramFile['status']) => {
    switch (status) {
      case 'complete': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'analyzing': return <div className="w-5 h-5 border-2 border-theme-primary-500 border-t-transparent rounded-full animate-spin" />;
      default: return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Batch ChromaVision Analyzer</h1>
                <p className="text-gray-600">OCR-driven analysis for multiple chromatogram images</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">{files.length}</div>
                <div className="text-sm text-gray-500">Samples Loaded</div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-lg mb-8">
          <div className="flex border-b">
            <button
              onClick={() => setSelectedView('upload')}
              className={`flex-1 py-4 px-6 text-center font-medium ${
                selectedView === 'upload'
                  ? 'border-b-2 border-theme-primary-500 text-theme-primary-400'
                  : 'text-theme-text-muted hover:text-theme-text'
              }`}
            >
              <Upload className="w-5 h-5 inline-block mr-2" />
              Upload Samples
            </button>
            <button
              onClick={() => setSelectedView('analysis')}
              className={`flex-1 py-4 px-6 text-center font-medium ${
                selectedView === 'analysis'
                  ? 'border-b-2 border-theme-primary-500 text-theme-primary-400'
                  : 'text-theme-text-muted hover:text-theme-text'
              }`}
            >
              <Camera className="w-5 h-5 inline-block mr-2" />
              Analysis Progress
            </button>
            <button
              onClick={() => setSelectedView('report')}
              className={`flex-1 py-4 px-6 text-center font-medium ${
                selectedView === 'report'
                  ? 'border-b-2 border-theme-primary-500 text-theme-primary-400'
                  : 'text-theme-text-muted hover:text-theme-text'
              }`}
              disabled={!batchReport}
            >
              <FileText className="w-5 h-5 inline-block mr-2" />
              Batch Report
            </button>
          </div>
        </div>

        {/* Upload View */}
        {selectedView === 'upload' && (
          <div className="space-y-6">
            
            {/* Upload Area */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div 
                className="border-2 border-dashed border-theme-border rounded-xl p-12 text-center hover:border-theme-primary-400 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <FileImage className="w-16 h-16 text-theme-text-muted mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-theme-text mb-2">
                  Upload Chromatogram Images
                </h3>
                <p className="text-theme-text-muted mb-4">
                  Drop multiple images here or click to select files
                </p>
                <p className="text-sm text-theme-text-muted">
                  Supports: PNG, JPG, PDF • Perfect for field photos and instrument printouts
                </p>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,.pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>

            {/* File List */}
            {files.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-800">
                    Loaded Samples ({files.length})
                  </h3>
                  <div className="flex space-x-3">
                    <button
                      onClick={runBatchAnalysis}
                      disabled={isAnalyzing || files.length === 0}
                      className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <Play className="w-5 h-5" />
                      <span>{isAnalyzing ? 'Analyzing...' : 'Run Batch Analysis'}</span>
                    </button>
                    <button
                      onClick={clearAllFiles}
                      className="flex items-center space-x-2 px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                      <span>Clear All</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {files.map((file) => (
                    <div key={file.id} className="bg-gray-50 rounded-lg p-4 relative">
                      <div className="aspect-video bg-gray-200 rounded-lg mb-3 overflow-hidden">
                        <img
                          src={file.preview}
                          alt={file.file.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(file.status)}
                          <span className="text-sm font-medium text-gray-700 truncate">
                            {file.file.name}
                          </span>
                        </div>
                        <button
                          onClick={() => removeFile(file.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="text-xs text-gray-500">
                        Size: {(file.file.size / 1024).toFixed(1)} KB
                      </div>
                      
                      {file.analysis?.analysis?.overall_quality_score && (
                        <div className="mt-2 text-xs">
                          <div className="text-gray-600">Quality: {file.analysis.analysis.overall_quality_score.toFixed(1)}%</div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                            <div 
                              className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-2 rounded-full transition-all"
                              style={{ width: `${file.analysis.analysis.overall_quality_score}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Analysis Progress View */}
        {selectedView === 'analysis' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-6">Analysis Progress</h3>
            
            {files.length === 0 ? (
              <div className="text-center py-12">
                <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No samples uploaded yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {files.map((file, index) => (
                  <div key={file.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className="text-lg font-semibold text-gray-600 w-8">
                      {index + 1}
                    </div>
                    
                    <div className="w-16 h-12 bg-gray-200 rounded overflow-hidden">
                      <img
                        src={file.preview}
                        alt={file.file.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <div className="flex-1">
                      <div className="font-medium text-gray-800 truncate">{file.file.name}</div>
                      <div className="text-sm text-gray-500">
                        {file.status === 'complete' && file.analysis?.analysis && (
                          <>
                            Quality: {file.analysis.analysis.overall_quality_score?.toFixed(1)}% • 
                            Peaks: {file.analysis.analysis.peaks?.length} • 
                            Grade: {file.analysis.ai_insights?.quality_grade}
                          </>
                        )}
                        {file.status === 'error' && (
                          <span className="text-red-500">Analysis failed</span>
                        )}
                        {file.status === 'analyzing' && (
                          <span className="text-blue-500">Analyzing...</span>
                        )}
                        {file.status === 'pending' && (
                          <span className="text-yellow-500">Waiting...</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="w-8">
                      {getStatusIcon(file.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Batch Report View */}
        {selectedView === 'report' && batchReport && (
          <div className="space-y-6">
            
            {/* Report Summary */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-semibold text-gray-800">Batch Analysis Report</h3>
                <button
                  onClick={generateReport}
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all"
                >
                  <Download className="w-5 h-5" />
                  <span>Export Report</span>
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-blue-600">{batchReport.totalSamples}</div>
                  <div className="text-blue-700 font-medium">Total Samples</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-green-600">{batchReport.successfulAnalyses}</div>
                  <div className="text-green-700 font-medium">Successful</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-purple-600">{batchReport.averageQualityScore.toFixed(1)}%</div>
                  <div className="text-purple-700 font-medium">Avg Quality</div>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-yellow-600">
                    {((batchReport.successfulAnalyses / batchReport.totalSamples) * 100).toFixed(1)}%
                  </div>
                  <div className="text-yellow-700 font-medium">Success Rate</div>
                </div>
              </div>
            </div>

            {/* Common Issues */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <AlertCircle className="w-5 h-5 text-orange-500 mr-2" />
                  Common Issues Identified
                </h4>
                <div className="space-y-3">
                  {batchReport.commonIssues.length > 0 ? (
                    batchReport.commonIssues.map((issue, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 bg-orange-50 rounded-lg">
                        <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 text-sm font-semibold mt-0.5">
                          {index + 1}
                        </div>
                        <div className="text-gray-700">{issue}</div>
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-500 italic">No common issues identified</div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <TrendingUp className="w-5 h-5 text-green-500 mr-2" />
                  Method Recommendations
                </h4>
                <div className="space-y-3">
                  {batchReport.recommendations.length > 0 ? (
                    batchReport.recommendations.map((rec, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                        <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-sm font-semibold mt-0.5">
                          {index + 1}
                        </div>
                        <div className="text-gray-700">{rec}</div>
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-500 italic">No specific recommendations available</div>
                  )}
                </div>
              </div>
            </div>

            {/* Individual Sample Results */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-6">Individual Sample Results</h4>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Sample</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Quality Score</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Peak Count</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Primary Issue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {files.map((file, _index) => (
                      <tr key={file.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="font-medium text-gray-800 truncate max-w-32">{file.file.name}</div>
                          <div className="text-xs text-gray-500">{file.timestamp.toLocaleTimeString()}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(file.status)}
                            <span className={`text-sm font-medium ${
                              file.status === 'complete' ? 'text-green-600' :
                              file.status === 'error' ? 'text-red-600' :
                              'text-yellow-600'
                            }`}>
                              {file.status.charAt(0).toUpperCase() + file.status.slice(1)}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {file.analysis?.analysis?.overall_quality_score ? (
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">{file.analysis.analysis.overall_quality_score.toFixed(1)}%</span>
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-2 rounded-full"
                                  style={{ width: `${file.analysis.analysis.overall_quality_score}%` }}
                                ></div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-medium">
                            {file.analysis?.analysis?.peaks?.length || 'N/A'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-gray-600">
                            {file.analysis?.ai_insights?.primary_issue || 'N/A'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BatchChromaVisionAnalyzer;