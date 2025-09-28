import React, { useState, useCallback, useRef } from 'react';
import { Upload, Eye, Download, FileImage, AlertCircle, CheckCircle2, Loader2, PlayCircle, HelpCircle } from 'lucide-react';
import { ChromatogramAnalysisResult } from '../../lib/api.types';
import { apiClient } from '../../lib/demoApiClient';
import { useNavigate } from 'react-router-dom';

// Type declarations for window objects
declare global {
  interface Window {
    Plotly?: {
      toImage: (div: any, options: any) => Promise<string>;
    };
    html2canvas?: (element: HTMLElement, options?: any) => Promise<HTMLCanvasElement>;
  }
}

// Simple in-memory cache for OCR results
const ocrCache = new Map<string, ChromatogramAnalysisResult>();

export const OCRVision: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<ChromatogramAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFromCache, setIsFromCache] = useState(false);
  const resultsContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Generate simple hash for file caching
  const generateFileHash = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
  };

  // File validation
  const validateFile = (file: File): string | null => {
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      return 'File size must be less than 10MB';
    }
    
    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
      return 'Only PNG and JPG images are supported';
    }
    
    return null;
  };

  // Handle file selection
  const handleFileSelect = useCallback((file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setSelectedFile(file);
    setResults(null);

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, []);

  // Handle drag and drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Analyze image
  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    setError(null);
    setIsFromCache(false);

    try {
      // Generate hash for caching
      const fileHash = await generateFileHash(selectedFile);
      
      // Check cache first
      const cachedResult = ocrCache.get(fileHash);
      if (cachedResult) {
        setResults(cachedResult);
        setIsFromCache(true);
        setIsAnalyzing(false);
        return;
      }

      // Make API call if not cached
      const response = await apiClient.upload<ChromatogramAnalysisResult>(
        '/api/chromatogram/analyze',
        selectedFile
      );

      // Cache the result
      ocrCache.set(fileHash, response);
      setResults(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Export CSV
  const exportCSV = () => {
    if (!results?.peaks) return;
    
    const headers = ['Peak ID', 'Name', 'Retention Time (min)', 'Area', 'Height', 'S/N Ratio', 'Tailing Factor'];
    const rows = results.peaks.map(peak => [
      peak.id,
      peak.name || '',
      peak.retention_time.toFixed(2),
      peak.area.toFixed(0),
      peak.height.toFixed(0),
      peak.snr.toFixed(1),
      peak.tailing_factor?.toFixed(2) || ''
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'chromatogram_peaks.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  // Export PNG - target TIC chart specifically
  const exportPNG = async () => {
    if (!results) return;
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `tic-chart-${timestamp}.png`;
    
    try {
      // Method 1: Target TIC chart container specifically
      const ticContainer = document.querySelector('[data-testid="tic-chart-container"]') as HTMLElement;
      if (ticContainer && window.html2canvas) {
        const canvas = await window.html2canvas(ticContainer, {
          backgroundColor: '#ffffff',
          scale: 2,
          useCORS: true,
          width: 800,
          height: 400
        });
        
        const imgData = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = imgData;
        link.download = filename;
        link.click();
        return;
      }
      
      // Method 2: SVG-to-Canvas conversion for TIC chart
      const ticSvg = document.querySelector('[data-testid="tic-chart-svg"]') as SVGElement;
      if (ticSvg) {
        const svgData = new XMLSerializer().serializeToString(ticSvg);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        canvas.width = 800;
        canvas.height = 400;
        
        img.onload = () => {
          if (ctx) {
            // Fill white background
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Draw SVG
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            // Download
            const imgData = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = imgData;
            link.download = filename;
            link.click();
          }
        };
        
        const svgjsn = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
        img.src = svgjsn;
        return;
      }
      
      // Method 3: Legacy support - Plotly chart
      const plotlyDiv = document.querySelector('.plotly-chart-container .js-plotly-plot') as any;
      if (plotlyDiv && window.Plotly) {
        const imgData = await window.Plotly.toImage(plotlyDiv, {
          format: 'png',
          width: 1200,
          height: 800,
          scale: 2
        });
        
        const link = document.createElement('a');
        link.href = imgData;
        link.download = filename;
        link.click();
        return;
      }
      
      // Method 4: Canvas fallback
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      if (canvas) {
        const imgData = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = imgData;
        link.download = filename;
        link.click();
        return;
      }
      
      // Method 5: Full results container using html2canvas if available
      if (resultsContainerRef.current && window.html2canvas) {
        const canvas = await window.html2canvas(resultsContainerRef.current, {
          backgroundColor: '#ffffff',
          scale: 2,
          useCORS: true
        });
        
        const imgData = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = imgData;
        link.download = filename;
        link.click();
        return;
      }
      
      // Fallback: disable button gracefully
      console.warn('No TIC chart found for PNG export');
      alert('TIC chart not available for export. Please ensure analysis results are displayed.');
      
    } catch (error) {
      console.error('PNG export failed:', error);
      alert('PNG export failed. Please try again.');
    }
  };

  // Use in Sandbox - deep link handoff
  const useInSandbox = () => {
    if (!results?.peaks) return;
    
    // Build compact payload from OCR peaks
    const peaksData = results.peaks.map(peak => ({
      rt: peak.retention_time,
      area: peak.area,
      height: peak.height,
      snr: peak.snr
    }));
    
    // Infer method hints from peaks if possible
    const hints = {
      peak_count: results.peaks.length,
      max_rt: Math.max(...results.peaks.map(p => p.retention_time)),
      avg_snr: results.peaks.reduce((sum, p) => sum + p.snr, 0) / results.peaks.length,
      baseline_quality: results.baseline.quality_score
    };
    
    // Navigate with URL-safe JSON
    const peaksParam = encodeURIComponent(JSON.stringify(peaksData));
    const hintsParam = encodeURIComponent(JSON.stringify(hints));
    
    navigate(`/sandbox?peaks=${peaksParam}&hints=${hintsParam}`);
  };

  // Ask Troubleshooter - send analysis summary
  const askTroubleshooter = () => {
    if (!results) return;
    
    // Build summary object
    const summary = {
      source: 'ocr_analysis',
      overall_quality: results.overall_quality,
      baseline_quality: results.baseline.quality_score,
      baseline_drift: results.baseline.drift,
      noise_level: results.baseline.noise_level,
      peak_count: results.peaks.length,
      avg_snr: results.peaks.reduce((sum, p) => sum + p.snr, 0) / results.peaks.length,
      poor_snr_count: results.peaks.filter(p => p.snr < 3).length,
      tailing_issues: results.peaks.filter(p => (p.tailing_factor || 0) > 2).length,
      recommendations: results.recommendations || [],
      troubleshooting_suggestions: results.troubleshooting_suggestions || []
    };
    
    // Navigate with preloaded context
    const summaryParam = encodeURIComponent(JSON.stringify(summary));
    navigate(`/troubleshooter?context=${summaryParam}`);
  };

  // Get quality badge info
  const getQualityBadge = (score: number) => {
    if (score >= 90) return { color: 'bg-green-100 text-green-800', label: 'Excellent' };
    if (score >= 70) return { color: 'bg-yellow-100 text-yellow-800', label: 'Good' };
    if (score >= 50) return { color: 'bg-orange-100 text-orange-800', label: 'Fair' };
    return { color: 'bg-red-100 text-red-800', label: 'Poor' };
  };

  const qualityBadge = results ? getQualityBadge(results.overall_quality) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-text mb-4">OCR Vision Analysis</h1>
        <p className="text-muted max-w-2xl mx-auto">
          Upload chromatogram images to automatically detect peaks and extract analytical data using AI vision.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Card: Upload */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <Upload className="text-brand-500" size={20} />
              <h2 className="text-lg font-semibold">Upload Image</h2>
            </div>
          </div>
          <div className="card-content">
            {!selectedFile ? (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-brand-300 transition-colors"
              >
                <FileImage size={48} className="mx-auto text-muted mb-4" />
                <h3 className="font-medium mb-2">Drag & drop or click to upload</h3>
                <p className="text-sm text-muted mb-4">
                  PNG, JPG files up to 10MB
                </p>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                  data-testid="ocr-file-input"
                />
                <label htmlFor="file-upload">
                  <button className="app-button-primary cursor-pointer">
                    Select File
                  </button>
                </label>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="border rounded-lg p-2 bg-surface">
                  {previewUrl && (
                    <img
                      src={previewUrl}
                      alt="Chromatogram preview"
                      className="w-full h-48 object-contain"
                    />
                  )}
                </div>
                
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted">File:</span>
                    <span className="font-medium">{selectedFile.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Size:</span>
                    <span>{(selectedFile.size / 1024 / 1024).toFixed(1)} MB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Type:</span>
                    <span>{selectedFile.type}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="app-button-primary flex-1 flex items-center justify-center gap-2"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Eye size={16} />
                        Analyze
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                      setResults(null);
                      setError(null);
                    }}
                    className="app-button-outline"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg mt-4">
                <AlertCircle size={16} />
                <span className="text-sm">{error}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Card: Results */}
        <div className="card" ref={resultsContainerRef}>
          <div className="card-header">
            <div className="flex items-center gap-2">
              <Eye className="text-brand-500" size={20} />
              <h2 className="text-lg font-semibold">Analysis Results</h2>
            </div>
            {qualityBadge && (
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${qualityBadge.color}`}>
                {qualityBadge.label} ({results!.overall_quality}%)
              </span>
            )}
          </div>
          <div className="card-content">
            {!results ? (
              <div className="text-center py-8">
                <Eye size={48} className="mx-auto text-muted mb-4" />
                <p className="text-muted">
                  Upload and analyze an image to see detected peaks
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Quality Badges */}
                <div className="flex flex-wrap gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getQualityBadge(results.baseline.quality_score).color}`}>
                    Baseline: {results.baseline.quality_score}%
                  </span>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {results.peaks.length} Peaks
                  </span>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    Noise: {results.baseline.noise_level.toFixed(1)}
                  </span>
                </div>

                {/* TIC Chart */}
                <div>
                  <h3 className="font-medium mb-3">Total Ion Chromatogram</h3>
                  <div 
                    className="tic-chart-container bg-surface rounded-lg border p-4" 
                    data-testid="tic-chart-container"
                    ref={(el) => {
                      // Assign to a ref for PNG export targeting
                      if (el) {
                        (el as any).ticChartRef = true;
                      }
                    }}
                  >
                    <svg 
                      className="w-full h-64" 
                      viewBox="0 0 400 200" 
                      data-testid="tic-chart-svg"
                    >
                      <defs>
                        <linearGradient id="ticGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.6"/>
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.1"/>
                        </linearGradient>
                      </defs>
                      
                      {/* Background grid */}
                      <defs>
                        <pattern id="grid" width="40" height="20" patternUnits="userSpaceOnUse">
                          <path d="M 40 0 L 0 0 0 20" fill="none" stroke="#e5e7eb" strokeWidth="0.5"/>
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#grid)" />
                      
                      {/* Generate TIC trace from peaks */}
                      {(() => {
                        const maxRT = Math.max(...results.peaks.map(p => p.retention_time));
                        const maxHeight = Math.max(...results.peaks.map(p => p.height));
                        const padding = 20;
                        const chartWidth = 400 - 2 * padding;
                        const chartHeight = 200 - 2 * padding;
                        
                        // Generate baseline with slight noise
                        const baselinePoints: Array<{x: number, y: number}> = [];
                        for (let i = 0; i <= 100; i++) {
                          const rt = (i / 100) * maxRT;
                          const x = padding + (rt / maxRT) * chartWidth;
                          const noise = (Math.random() - 0.5) * (results.baseline.noise_level / maxHeight) * chartHeight * 0.1;
                          const y = 200 - padding - noise;
                          baselinePoints.push({x, y});
                        }
                        
                        // Add peaks as Gaussian curves
                        const allPoints: Array<{x: number, y: number}> = [];
                        for (let i = 0; i <= 200; i++) {
                          const rt = (i / 200) * maxRT;
                          const x = padding + (rt / maxRT) * chartWidth;
                          let totalSignal = 0;
                          
                          // Add baseline noise
                          totalSignal += (Math.random() - 0.5) * (results.baseline.noise_level / maxHeight) * 0.1;
                          
                          // Add each peak as Gaussian
                          results.peaks.forEach(peak => {
                            const distance = Math.abs(rt - peak.retention_time);
                            const sigma = 0.05; // Peak width
                            if (distance < sigma * 4) { // Only calculate within 4 sigma
                              const gaussian = (peak.height / maxHeight) * Math.exp(-0.5 * Math.pow(distance / sigma, 2));
                              totalSignal += gaussian;
                            }
                          });
                          
                          const y = 200 - padding - (totalSignal * chartHeight);
                          allPoints.push({x, y: Math.max(padding, Math.min(200 - padding, y))});
                        }
                        
                        const pathData = allPoints.map((point, index) =>
                          `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
                        ).join(' ');
                        
                        const fillPath = pathData + ` L ${allPoints[allPoints.length - 1].x} ${200 - padding} L ${padding} ${200 - padding} Z`;
                        
                        return (
                          <>
                            {/* Fill area */}
                            <path
                              d={fillPath}
                              fill="url(#ticGradient)"
                              strokeWidth="0"
                            />
                            {/* Trace line */}
                            <path
                              d={pathData}
                              fill="none"
                              stroke="#3b82f6"
                              strokeWidth="2"
                            />
                            
                            {/* Peak markers */}
                            {results.peaks.map((peak, index) => {
                              const x = padding + (peak.retention_time / maxRT) * chartWidth;
                              const y = 200 - padding - (peak.height / maxHeight) * chartHeight;
                              return (
                                <g key={peak.id}>
                                  <circle
                                    cx={x}
                                    cy={y}
                                    r="3"
                                    fill="#ef4444"
                                    stroke="#ffffff"
                                    strokeWidth="1"
                                  />
                                  <text
                                    x={x}
                                    y={y - 8}
                                    textAnchor="middle"
                                    className="text-xs fill-text-primary"
                                    fontSize="10"
                                  >
                                    {peak.retention_time.toFixed(1)}
                                  </text>
                                </g>
                              );
                            })}
                            
                            {/* Axes */}
                            <line x1={padding} y1={200 - padding} x2={400 - padding} y2={200 - padding} stroke="#374151" strokeWidth="1"/>
                            <line x1={padding} y1={padding} x2={padding} y2={200 - padding} stroke="#374151" strokeWidth="1"/>
                            
                            {/* Axis labels */}
                            <text x={200} y={195} textAnchor="middle" className="text-xs fill-text-secondary" fontSize="11">
                              Retention Time (min)
                            </text>
                            <text x={15} y={100} textAnchor="middle" className="text-xs fill-text-secondary" fontSize="11" transform="rotate(-90 15 100)">
                              Signal Intensity
                            </text>
                            
                            {/* RT scale markers */}
                            {[0.25, 0.5, 0.75, 1.0].map(fraction => {
                              const x = padding + fraction * chartWidth;
                              const rt = fraction * maxRT;
                              return (
                                <g key={fraction}>
                                  <line x1={x} y1={200 - padding} x2={x} y2={200 - padding + 5} stroke="#6b7280" strokeWidth="1"/>
                                  <text x={x} y={200 - padding + 15} textAnchor="middle" className="text-xs fill-text-secondary" fontSize="10">
                                    {rt.toFixed(1)}
                                  </text>
                                </g>
                              );
                            })}
                          </>
                        );
                      })()}
                    </svg>
                  </div>
                </div>

                {/* Peaks Table */}
                <div>
                  <h3 className="font-medium mb-3">Detected Peaks</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm" data-testid="ocr-peaks-table">
                      <thead>
                        <tr className="border-b text-left">
                          <th className="pb-2 font-medium">RT (min)</th>
                          <th className="pb-2 font-medium">Area</th>
                          <th className="pb-2 font-medium">Height</th>
                          <th className="pb-2 font-medium">S/N</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.peaks.map((peak, index) => (
                          <tr key={peak.id} className="border-b">
                            <td className="py-2">{peak.retention_time.toFixed(2)}</td>
                            <td className="py-2">{peak.area.toLocaleString()}</td>
                            <td className="py-2">{peak.height.toLocaleString()}</td>
                            <td className="py-2">{peak.snr.toFixed(1)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <button
                      onClick={exportCSV}
                      className="app-button-outline flex items-center gap-2 flex-1"
                      data-testid="export-csv-btn"
                    >
                      <Download size={16} />
                      Export CSV
                    </button>
                    <button
                      onClick={exportPNG}
                      className="app-button-outline flex items-center gap-2 flex-1"
                      data-testid="export-png-btn"
                    >
                      <Download size={16} />
                      Export PNG
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={useInSandbox}
                      className="app-button-primary flex items-center gap-2 flex-1"
                      data-testid="use-in-sandbox-btn"
                    >
                      <PlayCircle size={16} />
                      Use in Sandbox
                    </button>
                    <button
                      onClick={askTroubleshooter}
                      className="app-button-outline flex items-center gap-2 flex-1"
                      data-testid="ask-troubleshooter-btn"
                    >
                      <HelpCircle size={16} />
                      Ask Troubleshooter
                    </button>
                  </div>
                </div>

                {/* Success indicator */}
                <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
                  <CheckCircle2 size={16} />
                  <span className="text-sm">
                    Analysis completed successfully
                    {isFromCache && ' (Loaded from cache)'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};