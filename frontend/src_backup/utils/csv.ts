/**
 * CSV utilities for chromatogram data parsing and export
 */

export interface CSVData {
  headers: string[];
  rows: (string | number)[][];
}

export interface ChromatogramData {
  time: number[];
  signal: number[];
}

/**
 * Parse CSV content into structured data
 */
export function parseCSV(content: string): CSVData {
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  const rows = lines.slice(1).map(line => 
    line.split(',').map(cell => {
      const trimmed = cell.trim();
      const num = parseFloat(trimmed);
      return isNaN(num) ? trimmed : num;
    })
  );
  
  return { headers, rows };
}

/**
 * Parse chromatogram CSV data
 */
export function parseChromatogramCSV(content: string): ChromatogramData {
  const { headers, rows } = parseCSV(content);
  
  // Find time and signal columns
  const timeIndex = headers.findIndex(h => 
    h.toLowerCase().includes('time') || h.toLowerCase().includes('rt')
  );
  const signalIndex = headers.findIndex(h => 
    h.toLowerCase().includes('signal') || h.toLowerCase().includes('intensity') || 
    h.toLowerCase().includes('response') || h.toLowerCase().includes('fid')
  );
  
  if (timeIndex === -1 || signalIndex === -1) {
    throw new Error('Could not find time and signal columns in CSV');
  }
  
  const time: number[] = [];
  const signal: number[] = [];
  
  for (const row of rows) {
    if (row.length >= Math.max(timeIndex, signalIndex) + 1) {
      const timeVal = Number(row[timeIndex]);
      const signalVal = Number(row[signalIndex]);
      
      if (!isNaN(timeVal) && !isNaN(signalVal)) {
        time.push(timeVal);
        signal.push(signalVal);
      }
    }
  }
  
  if (time.length === 0) {
    throw new Error('No valid data points found in CSV');
  }
  
  return { time, signal };
}

/**
 * Export chromatogram data to CSV
 */
export function exportChromatogramCSV(
  time: number[], 
  signal: number[], 
  peaks?: Array<{rt: number, name?: string, area?: number, height?: number}>
): string {
  const lines = ['Time,Signal'];
  
  // Add data points
  for (let i = 0; i < time.length; i++) {
    lines.push(`${time[i]},${signal[i]}`);
  }
  
  // Add peak annotations if provided
  if (peaks && peaks.length > 0) {
    lines.push(''); // Empty line
    lines.push('Peak Data');
    lines.push('Retention Time,Name,Area,Height');
    for (const peak of peaks) {
      lines.push(`${peak.rt},${peak.name || ''},${peak.area || ''},${peak.height || ''}`);
    }
  }
  
  return lines.join('\n');
}

/**
 * Validate CSV data for chromatogram import
 */
export function validateChromatogramCSV(content: string): { valid: boolean; error?: string } {
  try {
    const data = parseChromatogramCSV(content);
    
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
    return { valid: false, error: error instanceof Error ? error.message : 'Invalid CSV format' };
  }
}

/**
 * Create a download link for CSV data
 */
export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
