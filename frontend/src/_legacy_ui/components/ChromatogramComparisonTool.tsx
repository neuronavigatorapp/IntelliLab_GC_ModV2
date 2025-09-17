// Chromatogram Comparison Tool - Before/After Analysis
// Perfect for tracking method improvements and troubleshooting effectiveness over time

import React, { useState, useCallback, useRef } from 'react';
import { Upload, FileImage, GitCompare, Download, Trash2, Play, CheckCircle, AlertTriangle, XCircle, ArrowRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ComparisonFile {
  id: string;
  file: File;
  preview: string;
  analysis?: any;
  timestamp: Date;
  label: string;
}

interface ComparisonResult {
  before: ComparisonFile;
  after: ComparisonFile;
  improvements: {
    qualityChange: number;
    peakCountChange: number;
    baselineImprovement: string;
    noiseReduction: number;
    resolutionChange: string;
  };
  recommendations: string[];
  overallAssessment: 'improved' | 'degraded' | 'unchanged';
}

const ChromatogramComparisonTool: React.FC = () => {
  const [beforeFile, setBeforeFile] = useState<ComparisonFile | null>(null);
  const [afterFile, setAfterFile] = useState<ComparisonFile | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);
  const [selectedView, setSelectedView] = useState<'upload' | 'analysis' | 'comparison'>('upload');
  
  const beforeInputRef = useRef<HTMLInputElement>(null);
  const afterInputRef = useRef<HTMLInputElement>(null);

  // Handle file upload
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>, type: 'before' | 'after') => {
    const file = event.target.files?.[0];
    
    if (file && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newFile: ComparisonFile = {
          id: `${Date.now()}-${Math.random()}`,
          file,
          preview: e.target?.result as string,
          timestamp: new Date(),
          label: type === 'before' ? 'Before Optimization' : 'After Optimization'
        };
        
        if (type === 'before') {
          setBeforeFile(newFile);
        } else {
          setAfterFile(newFile);
        }
      };
      reader.readAsDataURL(file);
    }
    
    // Clear input
    if (event.target) {
      event.target.value = '';
    }
  }, []);

  // Analyze single chromatogram
  const analyzeChromatogram = async (file: ComparisonFile): Promise<any> => {
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

  // Run comparison analysis
  const runComparison = async () => {
    if (!beforeFile || !afterFile) return;

    setIsAnalyzing(true);
    setSelectedView('analysis');

    try {
      // Analyze both files
      console.log('Analyzing before file...');
      const beforeAnalysis = await analyzeChromatogram(beforeFile);
      
      console.log('Analyzing after file...');  
      const afterAnalysis = await analyzeChromatogram(afterFile);

      // Update files with analysis results
      const updatedBefore = { ...beforeFile, analysis: beforeAnalysis };
      const updatedAfter = { ...afterFile, analysis: afterAnalysis };
      
      setBeforeFile(updatedBefore);
      setAfterFile(updatedAfter);

      // Calculate comparison metrics
      const comparison = calculateComparison(updatedBefore, updatedAfter);
      setComparisonResult(comparison);
      
      setSelectedView('comparison');
      
    } catch (error: any) {
      console.error('Comparison analysis failed:', error);
      alert(`Analysis failed: ${error.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Calculate comparison metrics
  const calculateComparison = (before: ComparisonFile, after: ComparisonFile): ComparisonResult => {
    const beforeAnalysis = before.analysis?.analysis || {};
    const afterAnalysis = after.analysis?.analysis || {};
    
    // Quality comparison
    const beforeQuality = beforeAnalysis.overall_quality_score || 0;
    const afterQuality = afterAnalysis.overall_quality_score || 0;
    const qualityChange = afterQuality - beforeQuality;
    
    // Peak count comparison
    const beforePeaks = beforeAnalysis.peaks?.length || 0;
    const afterPeaks = afterAnalysis.peaks?.length || 0;
    const peakCountChange = afterPeaks - beforePeaks;
    
    // Baseline comparison
    const beforeBaseline = beforeAnalysis.baseline_quality || 'unknown';
    const afterBaseline = afterAnalysis.baseline_quality || 'unknown';
    let baselineImprovement = 'unchanged';
    
    if (beforeBaseline === 'poor' && afterBaseline === 'good') {
      baselineImprovement = 'improved';
    } else if (beforeBaseline === 'good' && afterBaseline === 'poor') {
      baselineImprovement = 'degraded';
    } else if (beforeBaseline === 'fair' && afterBaseline === 'good') {
      baselineImprovement = 'improved';
    } else if (beforeBaseline === 'good' && afterBaseline === 'fair') {
      baselineImprovement = 'slightly degraded';
    }
    
    // Noise comparison
    const beforeNoise = beforeAnalysis.noise_level || 0;
    const afterNoise = afterAnalysis.noise_level || 0;
    const noiseReduction = beforeNoise - afterNoise;
    
    // Resolution comparison
    const beforeResolution = beforeAnalysis.resolution_issues?.length || 0;
    const afterResolution = afterAnalysis.resolution_issues?.length || 0;
    let resolutionChange = 'unchanged';
    
    if (afterResolution < beforeResolution) {
      resolutionChange = 'improved';
    } else if (afterResolution > beforeResolution) {
      resolutionChange = 'degraded';
    }
    
    // Generate recommendations
    const recommendations = generateRecommendations(qualityChange, peakCountChange, baselineImprovement, noiseReduction, resolutionChange);
    
    // Overall assessment
    let overallAssessment: 'improved' | 'degraded' | 'unchanged' = 'unchanged';
    if (qualityChange > 5) {
      overallAssessment = 'improved';
    } else if (qualityChange < -5) {
      overallAssessment = 'degraded';
    }
    
    return {
      before,
      after,
      improvements: {
        qualityChange,
        peakCountChange,
        baselineImprovement,
        noiseReduction,
        resolutionChange
      },
      recommendations,
      overallAssessment
    };
  };

  // Generate improvement recommendations
  const generateRecommendations = (
    qualityChange: number,
    peakCountChange: number,
    baselineImprovement: string,
    noiseReduction: number,
    resolutionChange: string
  ): string[] => {
    const recommendations: string[] = [];
    
    if (qualityChange > 10) {
      recommendations.push("Excellent improvement! Document this method for future use.");
    } else if (qualityChange > 0) {
      recommendations.push("Good progress. Continue with current optimization strategy.");
    } else if (qualityChange < -5) {
      recommendations.push("Method degradation detected. Revert to previous conditions.");
    }
    
    if (peakCountChange > 5) {
      recommendations.push("Additional peaks detected - verify if these are real compounds or artifacts.");
    } else if (peakCountChange < -5) {
      recommendations.push("Peak loss detected - check for method sensitivity issues.");
    }
    
    if (baselineImprovement === 'improved') {
      recommendations.push("Baseline quality improved - excellent progress on method stability.");
    } else if (baselineImprovement === 'degraded') {
      recommendations.push("Baseline degradation - check column condition and carrier gas purity.");
    }
    
    if (noiseReduction > 0.05) {
      recommendations.push("Noise reduction achieved - method sensitivity has improved.");
    } else if (noiseReduction < -0.05) {
      recommendations.push("Increased noise detected - check detector and electronics.");
    }
    
    if (resolutionChange === 'improved') {
      recommendations.push("Peak resolution improved - excellent separation optimization.");
    } else if (resolutionChange === 'degraded') {
      recommendations.push("Resolution loss - consider adjusting temperature program or flow rate.");
    }
    
    return recommendations.slice(0, 5); // Limit to top 5 recommendations
  };

  // Clear comparison
  const clearComparison = () => {
    setBeforeFile(null);
    setAfterFile(null);
    setComparisonResult(null);
    setSelectedView('upload');
  };

  // Generate comparison report
  const generateReport = () => {
    if (!comparisonResult) return;

    const timestamp = new Date().toISOString().split('T')[0];
    const reportContent = `# Chromatogram Comparison Analysis Report

**Analysis Date:** ${new Date().toLocaleString()}  
**Comparison Type:** Method Optimization Analysis  

## Sample Information

### Before Optimization
- **File:** ${comparisonResult.before.file.name}
- **Analysis Time:** ${comparisonResult.before.timestamp.toLocaleString()}
- **Quality Score:** ${comparisonResult.before.analysis?.analysis?.overall_quality_score?.toFixed(1) || 'N/A'}%
- **Peak Count:** ${comparisonResult.before.analysis?.analysis?.peaks?.length || 'N/A'}
- **Baseline Quality:** ${comparisonResult.before.analysis?.analysis?.baseline_quality || 'N/A'}

### After Optimization  
- **File:** ${comparisonResult.after.file.name}
- **Analysis Time:** ${comparisonResult.after.timestamp.toLocaleString()}
- **Quality Score:** ${comparisonResult.after.analysis?.analysis?.overall_quality_score?.toFixed(1) || 'N/A'}%
- **Peak Count:** ${comparisonResult.after.analysis?.analysis?.peaks?.length || 'N/A'}
- **Baseline Quality:** ${comparisonResult.after.analysis?.analysis?.baseline_quality || 'N/A'}

## Improvement Analysis

### Quality Change
- **Score Change:** ${comparisonResult.improvements.qualityChange > 0 ? '+' : ''}${comparisonResult.improvements.qualityChange.toFixed(1)}%
- **Assessment:** ${comparisonResult.overallAssessment.charAt(0).toUpperCase() + comparisonResult.overallAssessment.slice(1)}

### Peak Analysis
- **Count Change:** ${comparisonResult.improvements.peakCountChange > 0 ? '+' : ''}${comparisonResult.improvements.peakCountChange} peaks
- **Baseline:** ${comparisonResult.improvements.baselineImprovement}
- **Noise Change:** ${comparisonResult.improvements.noiseReduction > 0 ? '-' : '+'}${Math.abs(comparisonResult.improvements.noiseReduction).toFixed(3)}
- **Resolution:** ${comparisonResult.improvements.resolutionChange}

## Recommendations
${comparisonResult.recommendations.map((rec, index) => `${index + 1}. ${rec}`).join('\n')}

## Method Development Notes
- Document successful optimizations for future reference
- Consider implementing changes systematically
- Monitor long-term method stability
- Validate improvements with multiple samples

---
*Generated by ChromaVision Comparison Tool - Method Development Suite*
*Analysis Date: ${new Date().toLocaleString()}*
`;

    // Create and download the report
    const blob = new Blob([reportContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ChromaVision_Comparison_Report_${timestamp}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Get improvement icon
  const getImprovementIcon = (change: number, type: 'quality' | 'peaks' | 'noise') => {
    if (type === 'noise') {
      // For noise, reduction is good
      if (change > 0.01) return <TrendingDown className="w-5 h-5 text-green-500" />;
      if (change < -0.01) return <TrendingUp className="w-5 h-5 text-red-500" />;
      return <Minus className="w-5 h-5 text-gray-500" />;
    } else {
      // For quality and peaks, increase is generally good
      if (change > 0) return <TrendingUp className="w-5 h-5 text-green-500" />;
      if (change < 0) return <TrendingDown className="w-5 h-5 text-red-500" />;
      return <Minus className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <GitCompare className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Chromatogram Comparison Tool</h1>
                <p className="text-gray-600">Track method improvements and troubleshooting effectiveness over time</p>
              </div>
            </div>
            
            {comparisonResult && (
              <div className="text-right">
                <div className={`text-2xl font-bold ${
                  comparisonResult.overallAssessment === 'improved' ? 'text-green-600' :
                  comparisonResult.overallAssessment === 'degraded' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {comparisonResult.improvements.qualityChange > 0 ? '+' : ''}{comparisonResult.improvements.qualityChange.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-500">Quality Change</div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-lg mb-8">
          <div className="flex border-b">
            <button
              onClick={() => setSelectedView('upload')}
              className={`flex-1 py-4 px-6 text-center font-medium ${
                selectedView === 'upload'
                  ? 'border-b-2 border-purple-500 text-purple-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Upload className="w-5 h-5 inline-block mr-2" />
              Upload Samples
            </button>
            <button
              onClick={() => setSelectedView('analysis')}
              className={`flex-1 py-4 px-6 text-center font-medium ${
                selectedView === 'analysis'
                  ? 'border-b-2 border-purple-500 text-purple-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              disabled={!beforeFile || !afterFile}
            >
              <Play className="w-5 h-5 inline-block mr-2" />
              Analysis Progress
            </button>
            <button
              onClick={() => setSelectedView('comparison')}
              className={`flex-1 py-4 px-6 text-center font-medium ${
                selectedView === 'comparison'
                  ? 'border-b-2 border-purple-500 text-purple-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              disabled={!comparisonResult}
            >
              <GitCompare className="w-5 h-5 inline-block mr-2" />
              Comparison Results
            </button>
          </div>
        </div>

        {/* Upload View */}
        {selectedView === 'upload' && (
          <div className="space-y-6">
            
            {/* Upload Areas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Before Upload */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  <FileImage className="w-5 h-5 mr-2 text-red-500" />
                  Before Optimization
                </h3>
                
                {!beforeFile ? (
                  <div 
                    className="border-2 border-dashed border-theme-accent-orange/30 rounded-xl p-8 text-center hover:border-theme-accent-orange transition-colors cursor-pointer"
                    onClick={() => beforeInputRef.current?.click()}
                  >
                    <FileImage className="w-12 h-12 text-theme-accent-orange mx-auto mb-3" />
                    <p className="text-theme-text mb-2">Upload BEFORE chromatogram</p>
                    <p className="text-sm text-theme-text-muted">Original method results</p>
                    
                    <input
                      ref={beforeInputRef}
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileUpload(e, 'before')}
                      className="hidden"
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={beforeFile.preview}
                        alt="Before optimization"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-800 truncate">{beforeFile.file.name}</p>
                        <p className="text-sm text-gray-500">{beforeFile.timestamp.toLocaleString()}</p>
                      </div>
                      <button
                        onClick={() => setBeforeFile(null)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    </div>
                    
                    {beforeFile.analysis && (
                      <div className="bg-red-50 rounded-lg p-3">
                        <p className="text-sm">
                          <strong>Quality:</strong> {beforeFile.analysis.analysis?.overall_quality_score?.toFixed(1)}% • 
                          <strong>Peaks:</strong> {beforeFile.analysis.analysis?.peaks?.length} • 
                          <strong>Grade:</strong> {beforeFile.analysis.ai_insights?.quality_grade}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* After Upload */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  <FileImage className="w-5 h-5 mr-2 text-green-500" />
                  After Optimization
                </h3>
                
                {!afterFile ? (
                  <div 
                    className="border-2 border-dashed border-theme-accent-mint/50 rounded-xl p-8 text-center hover:border-theme-accent-mint transition-colors cursor-pointer"
                    onClick={() => afterInputRef.current?.click()}
                  >
                    <FileImage className="w-12 h-12 text-theme-accent-mint mx-auto mb-3" />
                    <p className="text-theme-text mb-2">Upload AFTER chromatogram</p>
                    <p className="text-sm text-theme-text-muted">Optimized method results</p>
                    
                    <input
                      ref={afterInputRef}
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileUpload(e, 'after')}
                      className="hidden"
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={afterFile.preview}
                        alt="After optimization"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-800 truncate">{afterFile.file.name}</p>
                        <p className="text-sm text-gray-500">{afterFile.timestamp.toLocaleString()}</p>
                      </div>
                      <button
                        onClick={() => setAfterFile(null)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    </div>
                    
                    {afterFile.analysis && (
                      <div className="bg-green-50 rounded-lg p-3">
                        <p className="text-sm">
                          <strong>Quality:</strong> {afterFile.analysis.analysis?.overall_quality_score?.toFixed(1)}% • 
                          <strong>Peaks:</strong> {afterFile.analysis.analysis?.peaks?.length} • 
                          <strong>Grade:</strong> {afterFile.analysis.ai_insights?.quality_grade}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            {beforeFile && afterFile && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <ArrowRight className="w-8 h-8 text-purple-500" />
                    <div>
                      <p className="text-lg font-semibold text-gray-800">Ready for Comparison</p>
                      <p className="text-gray-600">Both chromatograms uploaded successfully</p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={runComparison}
                      disabled={isAnalyzing}
                      className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:from-purple-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <GitCompare className="w-5 h-5" />
                      <span>{isAnalyzing ? 'Analyzing...' : 'Compare Chromatograms'}</span>
                    </button>
                    <button
                      onClick={clearComparison}
                      className="flex items-center space-x-2 px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                      <span>Clear All</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Analysis Progress View */}
        {selectedView === 'analysis' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-6">Analysis Progress</h3>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-4 p-4 bg-red-50 rounded-lg">
                <div className="w-16 h-12 bg-gray-200 rounded overflow-hidden">
                  {beforeFile && (
                    <img
                      src={beforeFile.preview}
                      alt="Before"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-800">Before Optimization</div>
                  <div className="text-sm text-gray-500">
                    {beforeFile?.analysis ? 'Analysis complete' : isAnalyzing ? 'Analyzing...' : 'Waiting...'}
                  </div>
                </div>
                <div>
                  {beforeFile?.analysis ? (
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  ) : isAnalyzing ? (
                    <div className="w-6 h-6 border-2 border-theme-accent-orange border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <AlertTriangle className="w-6 h-6 text-yellow-500" />
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-4 p-4 bg-green-50 rounded-lg">
                <div className="w-16 h-12 bg-gray-200 rounded overflow-hidden">
                  {afterFile && (
                    <img
                      src={afterFile.preview}
                      alt="After"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-800">After Optimization</div>
                  <div className="text-sm text-gray-500">
                    {afterFile?.analysis ? 'Analysis complete' : isAnalyzing ? 'Analyzing...' : 'Waiting...'}
                  </div>
                </div>
                <div>
                  {afterFile?.analysis ? (
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  ) : isAnalyzing ? (
                    <div className="w-6 h-6 border-2 border-theme-accent-mint border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <AlertTriangle className="w-6 h-6 text-yellow-500" />
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Comparison Results View */}
        {selectedView === 'comparison' && comparisonResult && (
          <div className="space-y-6">
            
            {/* Overall Assessment */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-semibold text-gray-800">Comparison Results</h3>
                <button
                  onClick={generateReport}
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all"
                >
                  <Download className="w-5 h-5" />
                  <span>Export Report</span>
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className={`rounded-lg p-4 text-center ${
                  comparisonResult.overallAssessment === 'improved' ? 'bg-green-50' :
                  comparisonResult.overallAssessment === 'degraded' ? 'bg-red-50' : 'bg-gray-50'
                }`}>
                  <div className={`text-3xl font-bold ${
                    comparisonResult.overallAssessment === 'improved' ? 'text-green-600' :
                    comparisonResult.overallAssessment === 'degraded' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {comparisonResult.improvements.qualityChange > 0 ? '+' : ''}{comparisonResult.improvements.qualityChange.toFixed(1)}%
                  </div>
                  <div className="text-gray-700 font-medium">Quality Change</div>
                </div>
                
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-blue-600 flex items-center justify-center">
                    {getImprovementIcon(comparisonResult.improvements.peakCountChange, 'peaks')}
                    <span className="ml-2">{Math.abs(comparisonResult.improvements.peakCountChange)}</span>
                  </div>
                  <div className="text-blue-700 font-medium">Peak Count Change</div>
                </div>
                
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-purple-600">
                    {comparisonResult.improvements.baselineImprovement === 'improved' ? '↗️' :
                     comparisonResult.improvements.baselineImprovement === 'degraded' ? '↘️' : '→'}
                  </div>
                  <div className="text-purple-700 font-medium">Baseline Quality</div>
                </div>
                
                <div className="bg-orange-50 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-orange-600 flex items-center justify-center">
                    {getImprovementIcon(comparisonResult.improvements.noiseReduction, 'noise')}
                    <span className="ml-2">{Math.abs(comparisonResult.improvements.noiseReduction).toFixed(3)}</span>
                  </div>
                  <div className="text-orange-700 font-medium">Noise Change</div>
                </div>
              </div>
            </div>

            {/* Side-by-side Comparison */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Before Results */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <div className="w-4 h-4 bg-red-500 rounded-full mr-3"></div>
                  Before Optimization
                </h4>
                
                <div className="aspect-video bg-gray-100 rounded-lg mb-4 overflow-hidden">
                  <img
                    src={comparisonResult.before.preview}
                    alt="Before optimization"
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Quality Score:</span>
                    <span className="font-medium">
                      {comparisonResult.before.analysis?.analysis?.overall_quality_score?.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Peak Count:</span>
                    <span className="font-medium">
                      {comparisonResult.before.analysis?.analysis?.peaks?.length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Baseline:</span>
                    <span className="font-medium">
                      {comparisonResult.before.analysis?.analysis?.baseline_quality || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Noise Level:</span>
                    <span className="font-medium">
                      {comparisonResult.before.analysis?.analysis?.noise_level?.toFixed(3) || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* After Results */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <div className="w-4 h-4 bg-green-500 rounded-full mr-3"></div>
                  After Optimization
                </h4>
                
                <div className="aspect-video bg-gray-100 rounded-lg mb-4 overflow-hidden">
                  <img
                    src={comparisonResult.after.preview}
                    alt="After optimization"
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Quality Score:</span>
                    <span className="font-medium">
                      {comparisonResult.after.analysis?.analysis?.overall_quality_score?.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Peak Count:</span>
                    <span className="font-medium">
                      {comparisonResult.after.analysis?.analysis?.peaks?.length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Baseline:</span>
                    <span className="font-medium">
                      {comparisonResult.after.analysis?.analysis?.baseline_quality || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Noise Level:</span>
                    <span className="font-medium">
                      {comparisonResult.after.analysis?.analysis?.noise_level?.toFixed(3) || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 text-green-500 mr-2" />
                Method Development Recommendations
              </h4>
              
              <div className="space-y-3">
                {comparisonResult.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm font-semibold mt-0.5">
                      {index + 1}
                    </div>
                    <div className="text-gray-700">{recommendation}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChromatogramComparisonTool;