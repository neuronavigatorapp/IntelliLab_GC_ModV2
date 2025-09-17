import React, { useState, useRef, useCallback } from 'react';
import { Camera, Upload, Zap, TrendingUp, AlertTriangle, CheckCircle, Eye, Users } from 'lucide-react';

interface PeakAnalysis {
  peak_number: number;
  retention_time: number;
  area: number;
  height: number;
  width: number;
  compound_suggestion?: string;
  tailing_factor: number;
  resolution?: number;
}

interface ChromatogramAnalysis {
  peaks_detected: PeakAnalysis[];
  baseline_quality: number;
  noise_level: number;
  troubleshooting_suggestions: string[];
  method_recommendations: string[];
  quality_score: number;
  linkedin_demo_tips: string[];
  processing_time_ms: number;
  peak_count: number;
}

interface ProcessingStatus {
  stage: string;
  progress: number;
  message: string;
}

const ChromatogramAnalyzer: React.FC = () => {
  const [analysis, setAnalysis] = useState<ChromatogramAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus | null>(null);
  const [, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Simulate processing stages for visual feedback
  const simulateProcessing = useCallback((_file: File) => {
    const stages = [
      { stage: 'Image Upload', progress: 20, message: 'Uploading image...' },
      { stage: 'OCR Processing', progress: 40, message: 'Extracting chromatogram data...' },
      { stage: 'Peak Detection', progress: 60, message: 'Identifying peaks...' },
      { stage: 'AI Analysis', progress: 80, message: 'Analyzing peak patterns...' },
      { stage: 'Generating Report', progress: 95, message: 'Preparing analysis report...' },
      { stage: 'Complete', progress: 100, message: 'Analysis complete!' }
    ];

    let currentStage = 0;
    const interval = setInterval(() => {
      if (currentStage < stages.length) {
        setProcessingStatus(stages[currentStage]);
        currentStage++;
      } else {
        clearInterval(interval);
        setProcessingStatus(null);
      }
    }, 800);

    return interval;
  }, []);

  const analyzeImage = async (imageFile: File) => {
    setIsAnalyzing(true);
    setError(null);
    
    const processingInterval = simulateProcessing(imageFile);

    try {
      const formData = new FormData();
      formData.append('file', imageFile);

      const response = await fetch('/api/chromatogram/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.statusText}`);
      }

      const result = await response.json();
      clearInterval(processingInterval);
      setProcessingStatus(null);
      setAnalysis(result);
    } catch (err) {
      clearInterval(processingInterval);
      setProcessingStatus(null);
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      analyzeImage(file);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' } // Prefer back camera on mobile
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (err) {
      setError('Camera access denied. Please use file upload instead.');
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'chromatogram-capture.jpg', { type: 'image/jpeg' });
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
            analyzeImage(file);
            
            // Stop camera
            const stream = video.srcObject as MediaStream;
            stream?.getTracks().forEach(track => track.stop());
            setCameraActive(false);
          }
        }, 'image/jpeg', 0.8);
      }
    }
  };

  const getQualityColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getQualityIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (score >= 60) return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
    return <AlertTriangle className="w-5 h-5 text-red-600" />;
  };

  return (
    <div className="space-y-6">
      {/* Header with LinkedIn Branding */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-xl shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <Eye className="w-8 h-8" />
          <h2 className="text-2xl font-bold">ChromaVision AI</h2>
          <div className="ml-auto flex items-center gap-2 text-blue-100">
            <Users className="w-4 h-4" />
            <span className="text-sm">LinkedIn Portfolio Tool</span>
          </div>
        </div>
        <p className="text-blue-100 leading-relaxed">
          Professional chromatogram analysis powered by computer vision and AI. 
          Upload or capture chromatogram images for instant peak detection, troubleshooting, 
          and method optimization suggestions.
        </p>
        <div className="mt-4 text-xs text-blue-200 bg-blue-700/30 px-3 py-2 rounded-lg">
          💡 <strong>LinkedIn Tip:</strong> Demonstrate technical expertise by analyzing real chromatograms 
          and sharing insights about peak resolution, method development, and troubleshooting
        </div>
      </div>

      {/* Input Methods */}
      <div className="grid md:grid-cols-2 gap-4">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isAnalyzing}
          className="flex items-center justify-center gap-3 p-6 border-2 border-dashed border-blue-300 rounded-xl hover:border-blue-500 transition-colors bg-blue-50 hover:bg-blue-100 disabled:opacity-50"
        >
          <Upload className="w-6 h-6 text-blue-600" />
          <div>
            <div className="font-semibold text-blue-800">Upload Chromatogram</div>
            <div className="text-sm text-blue-600">Select image from device</div>
          </div>
        </button>

        <button
          onClick={startCamera}
          disabled={isAnalyzing || cameraActive}
          className="flex items-center justify-center gap-3 p-6 border-2 border-dashed border-green-300 rounded-xl hover:border-green-500 transition-colors bg-green-50 hover:bg-green-100 disabled:opacity-50"
        >
          <Camera className="w-6 h-6 text-green-600" />
          <div>
            <div className="font-semibold text-green-800">Capture Live</div>
            <div className="text-sm text-green-600">Use device camera</div>
          </div>
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Camera View */}
      {cameraActive && (
        <div className="bg-white p-4 rounded-xl shadow-lg">
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full max-w-md mx-auto rounded-lg"
            />
            <button
              onClick={capturePhoto}
              className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-red-600 hover:bg-red-700 text-white p-3 rounded-full shadow-lg"
            >
              <Camera className="w-6 h-6" />
            </button>
          </div>
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}

      {/* Processing Status */}
      {processingStatus && (
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="w-5 h-5 text-yellow-500 animate-pulse" />
            <span className="font-semibold">{processingStatus.stage}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${processingStatus.progress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600">{processingStatus.message}</p>
        </div>
      )}

      {/* Image Preview */}
      {previewUrl && (
        <div className="bg-white p-4 rounded-xl shadow-lg">
          <h3 className="font-semibold mb-3">Uploaded Chromatogram</h3>
          <img 
            src={previewUrl} 
            alt="Chromatogram" 
            className="max-w-full h-auto rounded-lg border"
          />
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-xl">
          <div className="flex items-center gap-2 text-red-800">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-semibold">Analysis Error</span>
          </div>
          <p className="text-red-700 mt-1">{error}</p>
        </div>
      )}

      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-6">
          {/* Quality Overview */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Analysis Overview</h3>
              <div className="flex items-center gap-2">
                {getQualityIcon(analysis.quality_score)}
                <span className={`font-bold ${getQualityColor(analysis.quality_score)}`}>
                  {analysis.quality_score}/100
                </span>
              </div>
            </div>
            
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-blue-600 font-semibold">Peaks Detected</div>
                <div className="text-2xl font-bold text-blue-800">{analysis.peak_count}</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-green-600 font-semibold">Baseline Quality</div>
                <div className="text-2xl font-bold text-green-800">{analysis.baseline_quality}/100</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-purple-600 font-semibold">Processing Time</div>
                <div className="text-2xl font-bold text-purple-800">{analysis.processing_time_ms}ms</div>
              </div>
            </div>
          </div>

          {/* Peak Details */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Peak Analysis
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2">Peak #</th>
                    <th className="text-left py-2">RT (min)</th>
                    <th className="text-left py-2">Area</th>
                    <th className="text-left py-2">Height</th>
                    <th className="text-left py-2">Width</th>
                    <th className="text-left py-2">Tailing</th>
                    <th className="text-left py-2">Compound</th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.peaks_detected.map((peak) => (
                    <tr key={peak.peak_number} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2 font-medium">{peak.peak_number}</td>
                      <td className="py-2">{peak.retention_time.toFixed(2)}</td>
                      <td className="py-2">{peak.area.toLocaleString()}</td>
                      <td className="py-2">{peak.height.toLocaleString()}</td>
                      <td className="py-2">{peak.width.toFixed(3)}</td>
                      <td className={`py-2 ${peak.tailing_factor > 1.5 ? 'text-orange-600 font-semibold' : 'text-green-600'}`}>
                        {peak.tailing_factor.toFixed(2)}
                      </td>
                      <td className="py-2 text-blue-600">
                        {peak.compound_suggestion || 'Unknown'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Troubleshooting */}
          {analysis.troubleshooting_suggestions.length > 0 && (
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                Troubleshooting Suggestions
              </h3>
              <ul className="space-y-2">
                {analysis.troubleshooting_suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-orange-500 mt-1">•</span>
                    <span className="text-gray-700">{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Method Recommendations */}
          {analysis.method_recommendations.length > 0 && (
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Method Optimization
              </h3>
              <ul className="space-y-2">
                {analysis.method_recommendations.map((recommendation, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">•</span>
                    <span className="text-gray-700">{recommendation}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* LinkedIn Demo Tips */}
          {analysis.linkedin_demo_tips.length > 0 && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-200">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                LinkedIn Showcase Tips
              </h3>
              <div className="bg-white p-4 rounded-lg">
                <ul className="space-y-2">
                  {analysis.linkedin_demo_tips.map((tip, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-blue-500 mt-1">💡</span>
                      <span className="text-gray-700">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChromatogramAnalyzer;