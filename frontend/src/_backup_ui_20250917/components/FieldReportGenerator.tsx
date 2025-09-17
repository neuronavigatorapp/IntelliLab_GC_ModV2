// Field Report Generator - Professional Client Report System
// Generate professional reports from OCR analysis for direct client delivery

import React, { useState, useCallback, useRef } from 'react';
import { Upload, FileText, Download, Settings, Eye, Plus, Trash2, Check, X, Building, FileImage, BarChart3, CheckCircle, Clock, Mail } from 'lucide-react';

interface AnalysisFile {
  id: string;
  file: File;
  preview: string;
  analysis?: any;
  status: 'pending' | 'analyzing' | 'complete' | 'error';
  sampleInfo?: {
    sampleId: string;
    description: string;
    matrix: string;
    concentration: string;
    notes: string;
  };
}

interface CompanyBranding {
  companyName: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  logo?: string;
}

interface ReportConfig {
  reportTitle: string;
  reportType: 'analytical' | 'validation' | 'qc' | 'troubleshooting' | 'custom';
  clientName: string;
  clientContact: string;
  projectNumber: string;
  analyst: string;
  reviewedBy: string;
  includeRawData: boolean;
  includeMethodDetails: boolean;
  includeTroubleshooting: boolean;
  includeRecommendations: boolean;
  template: 'standard' | 'detailed' | 'summary' | 'regulatory';
}

interface GeneratedReport {
  id: string;
  title: string;
  createdDate: Date;
  config: ReportConfig;
  files: AnalysisFile[];
  content: string;
  status: 'draft' | 'finalized' | 'sent';
}

const FieldReportGenerator: React.FC = () => {
  const [files, setFiles] = useState<AnalysisFile[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [branding, setBranding] = useState<CompanyBranding>({
    companyName: 'ChromaVision Analytics',
    address: '123 Science Park, Analytical City, AC 12345',
    phone: '+1 (555) 123-4567',
    email: 'reports@chromavision.com',
    website: 'www.chromavision.com'
  });
  
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    reportTitle: 'Chromatographic Analysis Report',
    reportType: 'analytical',
    clientName: '',
    clientContact: '',
    projectNumber: '',
    analyst: '',
    reviewedBy: '',
    includeRawData: true,
    includeMethodDetails: true,
    includeTroubleshooting: true,
    includeRecommendations: true,
    template: 'standard'
  });
  
  const [generatedReports, setGeneratedReports] = useState<GeneratedReport[]>([]);
  const [selectedView, setSelectedView] = useState<'upload' | 'configure' | 'preview' | 'reports'>('upload');
  const [showBrandingModal, setShowBrandingModal] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file upload
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    
    selectedFiles.forEach((file, index) => {
      if (file.type.startsWith('image/') || file.type === 'application/pdf') {
        const reader = new FileReader();
        reader.onload = (e) => {
          const newFile: AnalysisFile = {
            id: `file-${Date.now()}-${index}`,
            file,
            preview: e.target?.result as string,
            status: 'pending',
            sampleInfo: {
              sampleId: `SAMPLE-${String(files.length + index + 1).padStart(3, '0')}`,
              description: '',
              matrix: '',
              concentration: '',
              notes: ''
            }
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
  }, [files.length]);

  // Update sample information
  const updateSampleInfo = (fileId: string, sampleInfo: Partial<AnalysisFile['sampleInfo']>) => {
    setFiles(prev => prev.map(file => 
      file.id === fileId 
        ? { ...file, sampleInfo: { ...file.sampleInfo!, ...sampleInfo } }
        : file
    ));
  };

  // Remove file
  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(file => file.id !== fileId));
  };

  // Analyze single file
  const analyzeFile = async (file: AnalysisFile): Promise<any> => {
    try {
      const response = await fetch('/api/chromatogram/analyze-base64', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: file.preview
        })
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      throw new Error(`Failed to analyze ${file.file.name}: ${error.message}`);
    }
  };

  // Run analysis on all files
  const runBatchAnalysis = async () => {
    if (files.length === 0) return;

    setIsAnalyzing(true);
    setSelectedView('configure');

    try {
      const updatedFiles = [...files];
      
      // Update all to analyzing status
      updatedFiles.forEach(file => file.status = 'analyzing');
      setFiles(updatedFiles);

      // Analyze each file
      for (let i = 0; i < updatedFiles.length; i++) {
        const file = updatedFiles[i];
        
        try {
          const analysis = await analyzeFile(file);
          updatedFiles[i] = { ...file, status: 'complete', analysis };
          setFiles([...updatedFiles]);
          
        } catch (error: any) {
          console.error(`Analysis failed for ${file.file.name}:`, error);
          updatedFiles[i] = { ...file, status: 'error', analysis: { error: error.message } };
          setFiles([...updatedFiles]);
        }
        
        // Small delay between analyses
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Generate report content
  const generateReportContent = (): string => {
    const timestamp = new Date().toLocaleString();
    const completedFiles = files.filter(f => f.status === 'complete' && f.analysis);
    
    let content = `# ${reportConfig.reportTitle}\n\n`;
    
    // Header Information
    content += `**Company:** ${branding.companyName}\n`;
    content += `**Address:** ${branding.address}\n`;
    content += `**Contact:** ${branding.phone} | ${branding.email}\n`;
    if (branding.website) content += `**Website:** ${branding.website}\n`;
    content += `\n---\n\n`;
    
    // Report Information
    content += `## Report Information\n\n`;
    content += `**Report Date:** ${timestamp}\n`;
    content += `**Report Type:** ${reportConfig.reportType.toUpperCase()}\n`;
    content += `**Client:** ${reportConfig.clientName || 'Not specified'}\n`;
    content += `**Contact:** ${reportConfig.clientContact || 'Not specified'}\n`;
    content += `**Project Number:** ${reportConfig.projectNumber || 'Not assigned'}\n`;
    content += `**Analyst:** ${reportConfig.analyst || 'Not specified'}\n`;
    content += `**Reviewed By:** ${reportConfig.reviewedBy || 'Pending review'}\n`;
    content += `\n`;
    
    // Executive Summary
    content += `## Executive Summary\n\n`;
    content += `This report presents the chromatographic analysis results for ${completedFiles.length} sample(s) `;
    content += `analyzed using ChromaVision AI-powered OCR technology. `;
    
    const avgQuality = completedFiles.reduce((acc, f) => 
      acc + (f.analysis?.analysis?.overall_quality_score || 0), 0) / completedFiles.length;
    
    if (avgQuality >= 85) {
      content += `Overall analysis quality is excellent (${avgQuality.toFixed(1)}%), indicating well-optimized chromatographic conditions.\n\n`;
    } else if (avgQuality >= 70) {
      content += `Overall analysis quality is good (${avgQuality.toFixed(1)}%), with minor optimization opportunities identified.\n\n`;
    } else {
      content += `Overall analysis quality requires attention (${avgQuality.toFixed(1)}%), with significant optimization recommendations provided.\n\n`;
    }
    
    // Sample Results
    content += `## Sample Analysis Results\n\n`;
    
    completedFiles.forEach((file, index) => {
      const analysis = file.analysis.analysis;
      const insights = file.analysis.ai_insights;
      const sample = file.sampleInfo!;
      
      content += `### Sample ${index + 1}: ${sample.sampleId}\n\n`;
      content += `**Description:** ${sample.description || 'Not provided'}\n`;
      content += `**Matrix:** ${sample.matrix || 'Not specified'}\n`;
      content += `**Concentration:** ${sample.concentration || 'Not specified'}\n`;
      if (sample.notes) content += `**Notes:** ${sample.notes}\n`;
      content += `\n`;
      
      content += `**Analysis Results:**\n`;
      content += `- **Quality Score:** ${analysis.overall_quality_score?.toFixed(1)}%\n`;
      content += `- **Peak Count:** ${analysis.peaks?.length || 0}\n`;
      content += `- **Quality Grade:** ${insights.quality_grade}\n`;
      content += `- **Primary Assessment:** ${insights.primary_issue}\n`;
      content += `- **Baseline Quality:** ${analysis.baseline_quality?.toFixed(1)}%\n`;
      content += `- **Noise Level:** ${analysis.noise_level?.toFixed(1)}\n`;
      content += `\n`;
      
      if (reportConfig.includeRawData && analysis.peaks?.length > 0) {
        content += `**Peak Data:**\n\n`;
        content += `| Peak | Retention Time | Area | Height | Width | Resolution |\n`;
        content += `|------|----------------|------|--------|-------|------------|\n`;
        
        analysis.peaks.forEach((peak: any, peakIndex: number) => {
          content += `| ${peakIndex + 1} | ${peak.retention_time?.toFixed(2)} min | `;
          content += `${peak.area?.toLocaleString()} | ${peak.height?.toLocaleString()} | `;
          content += `${peak.width?.toFixed(2)} | ${peak.resolution?.toFixed(2) || 'N/A'} |\n`;
        });
        content += `\n`;
      }
      
      if (reportConfig.includeTroubleshooting && analysis.troubleshooting_suggestions?.length > 0) {
        content += `**Troubleshooting Recommendations:**\n`;
        analysis.troubleshooting_suggestions.forEach((suggestion: string) => {
          content += `- ${suggestion}\n`;
        });
        content += `\n`;
      }
    });
    
    // Method Details
    if (reportConfig.includeMethodDetails) {
      content += `## Analytical Method Information\n\n`;
      content += `**Analysis Technology:** ChromaVision AI-Powered OCR Analysis\n`;
      content += `**Detection Method:** Automated peak detection and integration\n`;
      content += `**Quality Assessment:** AI-driven quality scoring algorithm\n`;
      content += `**Data Processing:** Automated baseline correction and noise reduction\n`;
      content += `\n`;
    }
    
    // Overall Recommendations
    if (reportConfig.includeRecommendations) {
      content += `## Overall Recommendations\n\n`;
      
      if (avgQuality >= 85) {
        content += `✅ **Excellent Quality:** Current analytical conditions are well-optimized.\n`;
        content += `- Maintain current chromatographic parameters\n`;
        content += `- Continue with routine quality monitoring\n`;
        content += `- Consider method validation for regulatory submission\n`;
      } else if (avgQuality >= 70) {
        content += `🔧 **Good Quality with Optimization Opportunities:**\n`;
        content += `- Minor method refinements recommended\n`;
        content += `- Consider peak resolution optimization\n`;
        content += `- Evaluate baseline stability improvements\n`;
      } else {
        content += `⚠️ **Requires Significant Attention:**\n`;
        content += `- Comprehensive method optimization needed\n`;
        content += `- Review chromatographic parameters systematically\n`;
        content += `- Consider alternative analytical approaches\n`;
      }
      
      content += `\n**Next Steps:**\n`;
      content += `1. Implement recommended optimizations\n`;
      content += `2. Validate improved conditions with replicate analyses\n`;
      content += `3. Document method parameters for future use\n`;
      content += `4. Schedule follow-up analysis if needed\n\n`;
    }
    
    // Footer
    content += `---\n\n`;
    content += `## Report Validation\n\n`;
    content += `**Analysis Technology:** ChromaVision AI v2.0\n`;
    content += `**Report Generated:** ${timestamp}\n`;
    content += `**Analysis Confidence:** ${completedFiles.length > 0 ? 
      completedFiles[0].analysis?.ai_insights?.confidence_score?.toFixed(1) : 'N/A'}%\n`;
    content += `**Analyst Signature:** ${reportConfig.analyst || '_________________'}\n`;
    content += `**Review Signature:** ${reportConfig.reviewedBy || '_________________'}\n`;
    content += `\n`;
    content += `*This report was generated using ChromaVision AI technology for automated chromatographic analysis.*\n`;
    content += `*For technical questions, contact: ${branding.email}*\n`;
    
    return content;
  };

  // Generate final report
  const generateReport = () => {
    if (files.filter(f => f.status === 'complete').length === 0) {
      alert('No completed analyses available. Please run analysis first.');
      return;
    }
    
    if (!reportConfig.clientName.trim()) {
      alert('Please specify client name before generating report.');
      return;
    }
    
    const reportContent = generateReportContent();
    const newReport: GeneratedReport = {
      id: `report-${Date.now()}`,
      title: reportConfig.reportTitle,
      createdDate: new Date(),
      config: { ...reportConfig },
      files: [...files],
      content: reportContent,
      status: 'draft'
    };
    
    setGeneratedReports(prev => [...prev, newReport]);
    setSelectedView('reports');
  };

  // Export report
  const exportReport = (report: GeneratedReport, format: 'md' | 'txt' | 'json') => {
    let content: string;
    let filename: string;
    let mimeType: string;
    
    switch (format) {
      case 'md':
        content = report.content;
        filename = `${report.title.replace(/\s+/g, '_')}_${report.createdDate.toISOString().split('T')[0]}.md`;
        mimeType = 'text/markdown';
        break;
      case 'txt':
        content = report.content.replace(/[#*\-|]/g, '').replace(/\n\n+/g, '\n\n');
        filename = `${report.title.replace(/\s+/g, '_')}_${report.createdDate.toISOString().split('T')[0]}.txt`;
        mimeType = 'text/plain';
        break;
      case 'json':
        content = JSON.stringify({
          report: {
            id: report.id,
            title: report.title,
            createdDate: report.createdDate,
            config: report.config,
            summary: {
              totalSamples: report.files.length,
              completedAnalyses: report.files.filter(f => f.status === 'complete').length,
              averageQuality: report.files
                .filter(f => f.status === 'complete')
                .reduce((acc, f) => acc + (f.analysis?.analysis?.overall_quality_score || 0), 0) / 
                report.files.filter(f => f.status === 'complete').length
            },
            samples: report.files.map(f => ({
              sampleId: f.sampleInfo?.sampleId,
              description: f.sampleInfo?.description,
              status: f.status,
              analysis: f.analysis
            }))
          },
          metadata: {
            generatedBy: 'ChromaVision Field Report Generator',
            version: '1.0.0',
            exportDate: new Date().toISOString()
          }
        }, null, 2);
        filename = `${report.title.replace(/\s+/g, '_')}_${report.createdDate.toISOString().split('T')[0]}.json`;
        mimeType = 'application/json';
        break;
    }
    
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Get status icon
  const getStatusIcon = (status: AnalysisFile['status']) => {
    switch (status) {
      case 'complete': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error': return <X className="w-5 h-5 text-red-500" />;
      case 'analyzing': return <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
      default: return <Clock className="w-5 h-5 text-yellow-500" />;
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
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Field Report Generator</h1>
                <p className="text-gray-600">Professional client reports from OCR chromatogram analysis</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowBrandingModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span>Branding</span>
              </button>
              
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">{files.length}</div>
                <div className="text-sm text-gray-500">Samples</div>
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
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Upload className="w-5 h-5 inline-block mr-2" />
              Upload & Configure
            </button>
            <button
              onClick={() => setSelectedView('configure')}
              className={`flex-1 py-4 px-6 text-center font-medium ${
                selectedView === 'configure'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              disabled={files.length === 0}
            >
              <Settings className="w-5 h-5 inline-block mr-2" />
              Report Configuration
            </button>
            <button
              onClick={() => setSelectedView('preview')}
              className={`flex-1 py-4 px-6 text-center font-medium ${
                selectedView === 'preview'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              disabled={files.filter(f => f.status === 'complete').length === 0}
            >
              <Eye className="w-5 h-5 inline-block mr-2" />
              Preview Report
            </button>
            <button
              onClick={() => setSelectedView('reports')}
              className={`flex-1 py-4 px-6 text-center font-medium ${
                selectedView === 'reports'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <FileText className="w-5 h-5 inline-block mr-2" />
              Generated Reports ({generatedReports.length})
            </button>
          </div>
        </div>

        {/* Upload & Configure View */}
        {selectedView === 'upload' && (
          <div className="space-y-6">
            
            {/* File Upload Area */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-800">Sample Upload</h3>
                <div className="flex space-x-3">
                  {files.length > 0 && (
                    <button
                      onClick={runBatchAnalysis}
                      disabled={isAnalyzing}
                      className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <BarChart3 className="w-5 h-5" />
                      <span>{isAnalyzing ? 'Analyzing...' : 'Run Analysis'}</span>
                    </button>
                  )}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Add Samples</span>
                  </button>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf"
                onChange={handleFileUpload}
                className="hidden"
              />

              {/* Upload Drop Zone */}
              {files.length === 0 ? (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-blue-300 rounded-xl p-12 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                >
                  <Upload className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">Upload Chromatogram Images</h3>
                  <p className="text-gray-500 mb-4">Drag and drop files or click to select</p>
                  <p className="text-sm text-gray-400">Supports: JPG, PNG, PDF • Multiple files allowed</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {files.map((file) => (
                    <div key={file.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <FileImage className="w-5 h-5 text-blue-500" />
                          <span className="font-medium text-gray-800 text-sm truncate">
                            {file.file.name}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(file.status)}
                          <button
                            onClick={() => removeFile(file.id)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="w-full h-32 bg-gray-200 rounded mb-3 overflow-hidden">
                        <img
                          src={file.preview}
                          alt={file.file.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      {/* Sample Information Form */}
                      <div className="space-y-2">
                        <input
                          type="text"
                          placeholder="Sample ID"
                          value={file.sampleInfo?.sampleId || ''}
                          onChange={(e) => updateSampleInfo(file.id, { sampleId: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <input
                          type="text"
                          placeholder="Description"
                          value={file.sampleInfo?.description || ''}
                          onChange={(e) => updateSampleInfo(file.id, { description: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <input
                          type="text"
                          placeholder="Matrix (e.g., water, soil)"
                          value={file.sampleInfo?.matrix || ''}
                          onChange={(e) => updateSampleInfo(file.id, { matrix: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      {/* Analysis Status */}
                      {file.status === 'complete' && file.analysis && (
                        <div className="mt-3 p-2 bg-green-50 rounded text-sm">
                          <div className="text-green-700 font-medium">
                            Quality: {file.analysis.analysis?.overall_quality_score?.toFixed(1)}%
                          </div>
                          <div className="text-green-600">
                            Peaks: {file.analysis.analysis?.peaks?.length}
                          </div>
                        </div>
                      )}
                      
                      {file.status === 'error' && (
                        <div className="mt-3 p-2 bg-red-50 rounded text-sm text-red-600">
                          Analysis failed
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Report Configuration View */}
        {selectedView === 'configure' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-6">Report Configuration</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Basic Information */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-700">Basic Information</h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Report Title</label>
                  <input
                    type="text"
                    value={reportConfig.reportTitle}
                    onChange={(e) => setReportConfig(prev => ({ ...prev, reportTitle: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
                  <select
                    value={reportConfig.reportType}
                    onChange={(e) => setReportConfig(prev => ({ ...prev, reportType: e.target.value as ReportConfig['reportType'] }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="analytical">Analytical Report</option>
                    <option value="validation">Method Validation</option>
                    <option value="qc">Quality Control</option>
                    <option value="troubleshooting">Troubleshooting</option>
                    <option value="custom">Custom Report</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Template Style</label>
                  <select
                    value={reportConfig.template}
                    onChange={(e) => setReportConfig(prev => ({ ...prev, template: e.target.value as ReportConfig['template'] }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="standard">Standard Report</option>
                    <option value="detailed">Detailed Analysis</option>
                    <option value="summary">Executive Summary</option>
                    <option value="regulatory">Regulatory Submission</option>
                  </select>
                </div>
              </div>
              
              {/* Client Information */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-700">Client Information</h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Client Name *</label>
                  <input
                    type="text"
                    value={reportConfig.clientName}
                    onChange={(e) => setReportConfig(prev => ({ ...prev, clientName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Client company name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Client Contact</label>
                  <input
                    type="text"
                    value={reportConfig.clientContact}
                    onChange={(e) => setReportConfig(prev => ({ ...prev, clientContact: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Contact person name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Project Number</label>
                  <input
                    type="text"
                    value={reportConfig.projectNumber}
                    onChange={(e) => setReportConfig(prev => ({ ...prev, projectNumber: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Project reference number"
                  />
                </div>
              </div>
              
              {/* Personnel */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-700">Personnel</h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Analyst</label>
                  <input
                    type="text"
                    value={reportConfig.analyst}
                    onChange={(e) => setReportConfig(prev => ({ ...prev, analyst: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Analyst name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reviewed By</label>
                  <input
                    type="text"
                    value={reportConfig.reviewedBy}
                    onChange={(e) => setReportConfig(prev => ({ ...prev, reviewedBy: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Reviewer name"
                  />
                </div>
              </div>
              
              {/* Report Options */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-700">Report Options</h4>
                
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={reportConfig.includeRawData}
                      onChange={(e) => setReportConfig(prev => ({ ...prev, includeRawData: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Include Raw Peak Data</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={reportConfig.includeMethodDetails}
                      onChange={(e) => setReportConfig(prev => ({ ...prev, includeMethodDetails: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Include Method Details</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={reportConfig.includeTroubleshooting}
                      onChange={(e) => setReportConfig(prev => ({ ...prev, includeTroubleshooting: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Include Troubleshooting</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={reportConfig.includeRecommendations}
                      onChange={(e) => setReportConfig(prev => ({ ...prev, includeRecommendations: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Include Recommendations</span>
                  </label>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end mt-8">
              <button
                onClick={generateReport}
                disabled={files.filter(f => f.status === 'complete').length === 0 || !reportConfig.clientName.trim()}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <FileText className="w-5 h-5" />
                <span>Generate Report</span>
              </button>
            </div>
          </div>
        )}

        {/* Preview Report View */}
        {selectedView === 'preview' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-800">Report Preview</h3>
              <div className="flex space-x-3">
                <button
                  onClick={generateReport}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  <Check className="w-4 h-4" />
                  <span>Generate Final</span>
                </button>
              </div>
            </div>
            
            <div className="prose max-w-none">
              <div className="bg-gray-50 rounded-lg p-6 border">
                <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
                  {generateReportContent()}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Generated Reports View */}
        {selectedView === 'reports' && (
          <div className="space-y-6">
            
            {generatedReports.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No Reports Generated Yet</h3>
                <p className="text-gray-500 mb-6">Generate your first professional report from uploaded samples</p>
                <button
                  onClick={() => setSelectedView('upload')}
                  className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Start Creating Report
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {generatedReports.map((report) => (
                  <div key={report.id} className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-800 mb-2">{report.title}</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Client:</span> {report.config.clientName}
                          </div>
                          <div>
                            <span className="font-medium">Date:</span> {report.createdDate.toLocaleDateString()}
                          </div>
                          <div>
                            <span className="font-medium">Samples:</span> {report.files.length}
                          </div>
                          <div>
                            <span className="font-medium">Status:</span> 
                            <span className={`ml-1 px-2 py-1 rounded-full text-xs ${
                              report.status === 'finalized' ? 'bg-green-100 text-green-700' :
                              report.status === 'sent' ? 'bg-blue-100 text-blue-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {report.status}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2 ml-6">
                        <button
                          onClick={() => exportReport(report, 'md')}
                          className="flex items-center space-x-1 px-3 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                          title="Export as Markdown"
                        >
                          <Download className="w-4 h-4" />
                          <span>MD</span>
                        </button>
                        <button
                          onClick={() => exportReport(report, 'txt')}
                          className="flex items-center space-x-1 px-3 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                          title="Export as Text"
                        >
                          <Download className="w-4 h-4" />
                          <span>TXT</span>
                        </button>
                        <button
                          onClick={() => exportReport(report, 'json')}
                          className="flex items-center space-x-1 px-3 py-2 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
                          title="Export as JSON"
                        >
                          <Download className="w-4 h-4" />
                          <span>JSON</span>
                        </button>
                        <button className="flex items-center space-x-1 px-3 py-2 bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors">
                          <Mail className="w-4 h-4" />
                          <span>Email</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Company Branding Modal */}
        {showBrandingModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <Building className="w-6 h-6 mr-2" />
                Company Branding
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                  <input
                    type="text"
                    value={branding.companyName}
                    onChange={(e) => setBranding(prev => ({ ...prev, companyName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={branding.email}
                    onChange={(e) => setBranding(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <input
                    type="text"
                    value={branding.address}
                    onChange={(e) => setBranding(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={branding.phone}
                    onChange={(e) => setBranding(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                  <input
                    type="url"
                    value={branding.website}
                    onChange={(e) => setBranding(prev => ({ ...prev, website: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowBrandingModal(false)}
                  className="flex-1 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setShowBrandingModal(false)}
                  className="flex-1 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FieldReportGenerator;