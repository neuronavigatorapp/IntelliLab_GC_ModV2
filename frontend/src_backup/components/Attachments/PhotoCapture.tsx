import React, { useState, useRef, useCallback } from 'react';
import { notificationManager } from '../../notifications/notify';

interface PhotoCaptureProps {
  entityType: string;
  entityId: string;
  onPhotoCaptured?: (attachmentMeta: any) => void;
  className?: string;
}

export const PhotoCapture: React.FC<PhotoCaptureProps> = ({
  entityType,
  entityId,
  onPhotoCaptured,
  className = ''
}) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      setIsCapturing(true);
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }, // Use back camera on mobile
        audio: false
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Camera access failed:', err);
      setError('Camera access denied. Please use file upload instead.');
      setIsCapturing(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCapturing(false);
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to blob
    canvas.toBlob((blob) => {
      if (blob) {
        const photoUrl = URL.createObjectURL(blob);
        setCapturedPhoto(photoUrl);
        stopCamera();
      }
    }, 'image/jpeg', 0.8);
  }, [stopCamera]);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const photoUrl = URL.createObjectURL(file);
      setCapturedPhoto(photoUrl);
    }
  }, []);

  const uploadPhoto = useCallback(async () => {
    if (!capturedPhoto) return;

    try {
      setIsUploading(true);
      setError(null);

      // Convert data URL to blob
      const response = await fetch(capturedPhoto);
      const blob = await response.blob();

      // Create form data
      const formData = new FormData();
      formData.append('file', blob, 'photo.jpg');
      formData.append('entity_type', entityType);
      formData.append('entity_id', entityId);

      // Upload to server
      const uploadResponse = await fetch('/api/v1/attachments/upload', {
        method: 'POST',
        body: formData
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.statusText}`);
      }

      const attachmentMeta = await uploadResponse.json();
      
      // Notify success
      await notificationManager.showToast({
        title: 'Photo Uploaded',
        message: 'Photo has been successfully uploaded.',
        type: 'success'
      });

      // Call callback
      onPhotoCaptured?.(attachmentMeta);

      // Reset
      setCapturedPhoto(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (err) {
      console.error('Upload failed:', err);
      setError('Upload failed. Please try again.');
      
      await notificationManager.showToast({
        title: 'Upload Failed',
        message: 'Failed to upload photo. Please try again.',
        type: 'error'
      });
    } finally {
      setIsUploading(false);
    }
  }, [capturedPhoto, entityType, entityId, onPhotoCaptured]);

  const retakePhoto = useCallback(() => {
    setCapturedPhoto(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const openFileDialog = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className={`space-y-4 ${className}`}>
      {error && (
        <div className="p-3 bg-red-100 border border-red-300 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {!capturedPhoto && !isCapturing && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <button
              onClick={startCamera}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              disabled={isUploading}
            >
              📷 Take Photo
            </button>
            <button
              onClick={openFileDialog}
              className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
              disabled={isUploading}
            >
              📁 Choose File
            </button>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      )}

      {isCapturing && (
        <div className="space-y-3">
          <div className="relative bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-64 object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={capturePhoto}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              📸 Capture
            </button>
            <button
              onClick={stopCamera}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              ❌ Cancel
            </button>
          </div>
        </div>
      )}

      {capturedPhoto && (
        <div className="space-y-3">
          <div className="relative bg-black rounded-lg overflow-hidden">
            <img
              src={capturedPhoto}
              alt="Captured photo"
              className="w-full h-64 object-cover"
            />
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={uploadPhoto}
              disabled={isUploading}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {isUploading ? '⏳ Uploading...' : '📤 Upload'}
            </button>
            <button
              onClick={retakePhoto}
              disabled={isUploading}
              className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
            >
              🔄 Retake
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
