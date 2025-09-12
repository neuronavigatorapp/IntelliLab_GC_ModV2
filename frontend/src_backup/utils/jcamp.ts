/**
 * JCAMP-DX utilities for chromatogram data parsing
 */

export interface JCAMPData {
  time: number[];
  signal: number[];
  metadata: Record<string, string>;
}

/**
 * Parse JCAMP-DX content into structured data
 */
export function parseJCAMP(content: string): JCAMPData {
  const lines = content.split('\n');
  const metadata: Record<string, string> = {};
  const time: number[] = [];
  const signal: number[] = [];
  
  let inXYData = false;
  let xFactor = 1;
  let yFactor = 1;
  let xOffset = 0;
  let yOffset = 0;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (trimmedLine.startsWith('##')) {
      // Parse metadata
      const colonIndex = trimmedLine.indexOf('=');
      if (colonIndex > 2) {
        const key = trimmedLine.substring(2, colonIndex);
        const value = trimmedLine.substring(colonIndex + 1);
        metadata[key] = value;
        
        // Parse scaling factors
        if (key === 'XUNITS') {
          // Handle time units
        } else if (key === 'YUNITS') {
          // Handle signal units
        } else if (key === 'XFACTOR') {
          xFactor = parseFloat(value) || 1;
        } else if (key === 'YFACTOR') {
          yFactor = parseFloat(value) || 1;
        } else if (key === 'XOFFSET') {
          xOffset = parseFloat(value) || 0;
        } else if (key === 'YOFFSET') {
          yOffset = parseFloat(value) || 0;
        }
      }
    } else if (trimmedLine.startsWith('##XYDATA')) {
      inXYData = true;
      continue;
    } else if (trimmedLine.startsWith('##END')) {
      break;
    } else if (inXYData && trimmedLine) {
      // Parse XY data
      try {
        const parts = trimmedLine.split(/\s+/);
        for (let i = 0; i < parts.length; i += 2) {
          if (i + 1 < parts.length) {
            const xVal = parseFloat(parts[i]);
            const yVal = parseFloat(parts[i + 1]);
            
            if (!isNaN(xVal) && !isNaN(yVal)) {
              // Apply scaling and offset
              const scaledX = xVal * xFactor + xOffset;
              const scaledY = yVal * yFactor + yOffset;
              
              time.push(scaledX);
              signal.push(scaledY);
            }
          }
        }
      } catch (error) {
        console.warn('Failed to parse JCAMP line:', trimmedLine);
      }
    }
  }
  
  if (time.length === 0) {
    throw new Error('No valid XY data found in JCAMP file');
  }
  
  return { time, signal, metadata };
}

/**
 * Validate JCAMP data for chromatogram import
 */
export function validateJCAMP(content: string): { valid: boolean; error?: string } {
  try {
    const data = parseJCAMP(content);
    
    if (data.time.length < 10) {
      return { valid: false, error: 'Insufficient data points (minimum 10 required)' };
    }
    
    if (data.time.length !== data.signal.length) {
      return { valid: false, error: 'Time and signal arrays have different lengths' };
    }
    
    // Check for reasonable time values
    const timeRange = Math.max(...data.time) - Math.min(...data.time);
    if (timeRange < 0.1) {
      return { valid: false, error: 'Time range too small (minimum 0.1 minutes)' };
    }
    
    if (timeRange > 1000) {
      return { valid: false, error: 'Time range too large (maximum 1000 minutes)' };
    }
    
    return { valid: true };
  } catch (error) {
    return { valid: false, error: error instanceof Error ? error.message : 'Invalid JCAMP format' };
  }
}

/**
 * Convert JCAMP data to CSV format
 */
export function jcampToCSV(content: string): string {
  const data = parseJCAMP(content);
  const lines = ['Time,Signal'];
  
  for (let i = 0; i < data.time.length; i++) {
    lines.push(`${data.time[i]},${data.signal[i]}`);
  }
  
  return lines.join('\n');
}
