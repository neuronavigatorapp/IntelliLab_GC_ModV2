import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui';
import { Badge, Button } from '../components/ui';
import { Eye, Upload, Image, FileText, Download, CheckCircle } from 'lucide-react';

export const OCR: React.FC = () => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
        setResults(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const processImage = () => {
    setIsProcessing(true);
    // Simulate OCR processing
    setTimeout(() => {
      setResults({
        peaks: [
          { name: 'Methane', retention: '1.23', area: '125,432', height: '8,432' },
          { name: 'Ethane', retention: '2.45', area: '234,567', height: '12,334' },
          { name: 'Propane', retention: '3.67', area: '189,234', height: '9,876' }
        ],
        metadata: {
          method: 'GC-FID Analysis', 
          temperature: '250°C',
          column: 'DB-1 30m x 0.32mm'
        }
      });
      setIsProcessing(false);
    }, 3000);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">OCR Vision</h1>
          <p className="text-text-secondary mt-2">
            Extract data from chromatogram images using advanced AI vision technology
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="success">AI Vision Online</Badge>
          <Badge variant="info">Beta</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Area */}
        <Card variant="elevated">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Upload className="text-accent-500" size={20} />
              <CardTitle>Upload Chromatogram</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {!uploadedImage ? (
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                <Image size={48} className="mx-auto text-text-tertiary mb-4" />
                <h3 className="text-text-primary font-medium mb-2">Upload Chromatogram Image</h3>
                <p className="text-text-secondary text-sm mb-4">
                  Supports JPG, PNG, PDF formats up to 10MB
                </p>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload">
                  <Button variant="primary" className="cursor-pointer">
                    Select File
                  </Button>
                </label>
              </div>
            ) : (
              <div className="space-y-4">
                <img 
                  src={uploadedImage} 
                  alt="Uploaded chromatogram"
                  className="w-full h-64 object-contain bg-surface rounded-lg border border-border"
                />
                <div className="flex space-x-2">
                  <Button 
                    variant="primary" 
                    onClick={processImage}
                    disabled={isProcessing}
                    className="flex-1"
                  >
                    {isProcessing ? 'Processing...' : 'Extract Data'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setUploadedImage(null)}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Area */}
        <Card variant="elevated">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Eye className="text-success-500" size={20} />
              <CardTitle>Extraction Results</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {!results ? (
              <div className="text-center py-8">
                <FileText size={48} className="mx-auto text-text-tertiary mb-4" />
                <p className="text-text-secondary">
                  Upload and process a chromatogram to see extracted data
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-success-600">
                  <CheckCircle size={20} />
                  <span className="font-medium">Data extraction complete</span>
                </div>
                
                {/* Peak Data Table */}
                <div>
                  <h4 className="font-medium text-text-primary mb-2">Detected Peaks</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2">Compound</th>
                          <th className="text-left py-2">RT (min)</th>
                          <th className="text-left py-2">Area</th>
                          <th className="text-left py-2">Height</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.peaks.map((peak: any, index: number) => (
                          <tr key={index} className="border-b border-border">
                            <td className="py-2 text-text-primary">{peak.name}</td>
                            <td className="py-2 text-text-secondary">{peak.retention}</td>
                            <td className="py-2 text-text-secondary">{peak.area}</td>
                            <td className="py-2 text-text-secondary">{peak.height}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Method Info */}
                <div>
                  <h4 className="font-medium text-text-primary mb-2">Method Information</h4>
                  <div className="bg-surface p-3 rounded-lg space-y-1">
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Method:</span>
                      <span className="text-text-primary">{results.metadata.method}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Temperature:</span>
                      <span className="text-text-primary">{results.metadata.temperature}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Column:</span>
                      <span className="text-text-primary">{results.metadata.column}</span>
                    </div>
                  </div>
                </div>

                <Button variant="outline" className="w-full flex items-center space-x-2">
                  <Download size={18} />
                  <span>Export Results</span>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Features */}
      <Card variant="glass">
        <CardHeader>
          <CardTitle>OCR Vision Capabilities</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="p-3 bg-accent-50 rounded-lg w-fit mx-auto mb-3">
                <Eye className="text-accent-600" size={24} />
              </div>
              <h3 className="font-semibold text-text-primary mb-2">Peak Detection</h3>
              <p className="text-sm text-text-secondary">
                Automatically identify and quantify chromatographic peaks
              </p>
            </div>
            <div className="text-center">
              <div className="p-3 bg-success-50 rounded-lg w-fit mx-auto mb-3">
                <FileText className="text-success-600" size={24} />
              </div>
              <h3 className="font-semibold text-text-primary mb-2">Data Extraction</h3>
              <p className="text-sm text-text-secondary">
                Extract retention times, areas, and method parameters
              </p>
            </div>
            <div className="text-center">
              <div className="p-3 bg-info-50 rounded-lg w-fit mx-auto mb-3">
                <Download className="text-info-600" size={24} />
              </div>
              <h3 className="font-semibold text-text-primary mb-2">Export Options</h3>
              <p className="text-sm text-text-secondary">
                Save results in CSV, Excel, or PDF formats
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};