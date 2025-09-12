import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  IconButton,
  Tooltip,
  Chip,
  Alert,
  TableSortLabel
} from '@mui/material';
import {
  Edit,
  Save,
  Cancel,
  Sort,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';
import { useMobile } from '../../hooks/useMobile';

interface Peak {
  id: string;
  rt: number;
  area: number;
  height: number;
  width: number;
  name?: string;
  snr?: number;
}

interface PeakTableProps {
  peaks: Peak[];
  selectedPeakId?: string;
  onPeakSelect?: (peak: Peak) => void;
  onPeakUpdate?: (peakId: string, updates: Partial<Peak>) => void;
  showSNR?: boolean;
  onSNRToggle?: (show: boolean) => void;
}

type SortField = 'rt' | 'area' | 'height' | 'width' | 'name' | 'snr';
type SortDirection = 'asc' | 'desc';

export const PeakTable: React.FC<PeakTableProps> = ({
  peaks,
  selectedPeakId,
  onPeakSelect,
  onPeakUpdate,
  showSNR = false,
  onSNRToggle
}) => {
  const { isMobile } = useMobile();
  const [editingPeakId, setEditingPeakId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<Peak>>({});
  const [sortField, setSortField] = useState<SortField>('rt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Sort peaks
  const sortedPeaks = useMemo(() => {
    return [...peaks].sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];
      
      // Handle string comparison
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      // Handle undefined values
      if (aValue === undefined) aValue = sortDirection === 'asc' ? Infinity : -Infinity;
      if (bValue === undefined) bValue = sortDirection === 'asc' ? Infinity : -Infinity;
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [peaks, sortField, sortDirection]);

  // Handle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Start editing
  const handleEdit = (peak: Peak) => {
    setEditingPeakId(peak.id);
    setEditValues({
      name: peak.name || '',
      rt: peak.rt,
      area: peak.area,
      height: peak.height,
      width: peak.width
    });
  };

  // Save edits
  const handleSave = () => {
    if (editingPeakId && onPeakUpdate) {
      onPeakUpdate(editingPeakId, editValues);
    }
    setEditingPeakId(null);
    setEditValues({});
  };

  // Cancel editing
  const handleCancel = () => {
    setEditingPeakId(null);
    setEditValues({});
  };

  // Handle edit field change
  const handleEditChange = (field: keyof Peak, value: any) => {
    setEditValues(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Calculate statistics
  const stats = useMemo(() => {
    if (peaks.length === 0) return null;
    
    const areas = peaks.map(p => p.area);
    const heights = peaks.map(p => p.height);
    const widths = peaks.map(p => p.width);
    const snrs = peaks.filter(p => p.snr !== undefined).map(p => p.snr!);
    
    return {
      totalPeaks: peaks.length,
      avgArea: areas.reduce((a, b) => a + b, 0) / areas.length,
      avgHeight: heights.reduce((a, b) => a + b, 0) / heights.length,
      avgWidth: widths.reduce((a, b) => a + b, 0) / widths.length,
      avgSNR: snrs.length > 0 ? snrs.reduce((a, b) => a + b, 0) / snrs.length : 0,
      totalArea: areas.reduce((a, b) => a + b, 0)
    };
  }, [peaks]);

  if (peaks.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Peak Table
          </Typography>
          <Alert severity="info">
            No peaks detected. Run peak detection to see results.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" component="h2">
            Peak Table ({peaks.length} peaks)
          </Typography>
          
          <Box display="flex" gap={1} alignItems="center">
            {onSNRToggle && (
              <Tooltip title={showSNR ? "Hide SNR" : "Show SNR"}>
                <IconButton 
                  onClick={() => onSNRToggle(!showSNR)}
                  size="small"
                >
                  {showSNR ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>

        {/* Statistics */}
        {stats && (
          <Box display="flex" gap={2} mb={2} flexWrap="wrap">
            <Chip label={`Total Area: ${stats.totalArea.toFixed(0)}`} size="small" />
            <Chip label={`Avg Area: ${stats.avgArea.toFixed(0)}`} size="small" />
            <Chip label={`Avg Height: ${stats.avgHeight.toFixed(1)}`} size="small" />
            <Chip label={`Avg Width: ${stats.avgWidth.toFixed(3)} min`} size="small" />
            {showSNR && (
              <Chip label={`Avg SNR: ${stats.avgSNR.toFixed(1)}`} size="small" />
            )}
          </Box>
        )}

        {/* Table */}
        <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
          <Table size={isMobile ? "small" : "medium"} stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>
                  <TableSortLabel
                    active={sortField === 'rt'}
                    direction={sortField === 'rt' ? sortDirection : 'asc'}
                    onClick={() => handleSort('rt')}
                  >
                    RT (min)
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortField === 'name'}
                    direction={sortField === 'name' ? sortDirection : 'asc'}
                    onClick={() => handleSort('name')}
                  >
                    Name
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortField === 'area'}
                    direction={sortField === 'area' ? sortDirection : 'asc'}
                    onClick={() => handleSort('area')}
                  >
                    Area
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortField === 'height'}
                    direction={sortField === 'height' ? sortDirection : 'asc'}
                    onClick={() => handleSort('height')}
                  >
                    Height
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortField === 'width'}
                    direction={sortField === 'width' ? sortDirection : 'asc'}
                    onClick={() => handleSort('width')}
                  >
                    Width (min)
                  </TableSortLabel>
                </TableCell>
                {showSNR && (
                  <TableCell>
                    <TableSortLabel
                      active={sortField === 'snr'}
                      direction={sortField === 'snr' ? sortDirection : 'asc'}
                      onClick={() => handleSort('snr')}
                    >
                      SNR
                    </TableSortLabel>
                  </TableCell>
                )}
                {onPeakUpdate && (
                  <TableCell>Actions</TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedPeaks.map((peak) => {
                const isEditing = editingPeakId === peak.id;
                const isSelected = selectedPeakId === peak.id;
                
                return (
                  <TableRow
                    key={peak.id}
                    hover
                    selected={isSelected}
                    onClick={() => onPeakSelect?.(peak)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell>
                      {isEditing ? (
                        <TextField
                          size="small"
                          type="number"
                          value={editValues.rt || peak.rt}
                          onChange={(e) => handleEditChange('rt', parseFloat(e.target.value))}
                          inputProps={{ step: 0.01, min: 0 }}
                        />
                      ) : (
                        peak.rt.toFixed(2)
                      )}
                    </TableCell>
                    
                    <TableCell>
                      {isEditing ? (
                        <TextField
                          size="small"
                          value={editValues.name || peak.name || ''}
                          onChange={(e) => handleEditChange('name', e.target.value)}
                          placeholder="Compound name"
                        />
                      ) : (
                        peak.name || 'Unknown'
                      )}
                    </TableCell>
                    
                    <TableCell>
                      {isEditing ? (
                        <TextField
                          size="small"
                          type="number"
                          value={editValues.area || peak.area}
                          onChange={(e) => handleEditChange('area', parseFloat(e.target.value))}
                          inputProps={{ step: 1, min: 0 }}
                        />
                      ) : (
                        peak.area.toFixed(0)
                      )}
                    </TableCell>
                    
                    <TableCell>
                      {isEditing ? (
                        <TextField
                          size="small"
                          type="number"
                          value={editValues.height || peak.height}
                          onChange={(e) => handleEditChange('height', parseFloat(e.target.value))}
                          inputProps={{ step: 0.1, min: 0 }}
                        />
                      ) : (
                        peak.height.toFixed(1)
                      )}
                    </TableCell>
                    
                    <TableCell>
                      {isEditing ? (
                        <TextField
                          size="small"
                          type="number"
                          value={editValues.width || peak.width}
                          onChange={(e) => handleEditChange('width', parseFloat(e.target.value))}
                          inputProps={{ step: 0.001, min: 0 }}
                        />
                      ) : (
                        peak.width.toFixed(3)
                      )}
                    </TableCell>
                    
                    {showSNR && (
                      <TableCell>
                        {peak.snr ? peak.snr.toFixed(1) : 'N/A'}
                      </TableCell>
                    )}
                    
                    {onPeakUpdate && (
                      <TableCell>
                        {isEditing ? (
                          <Box display="flex" gap={0.5}>
                            <Tooltip title="Save">
                              <IconButton size="small" onClick={handleSave}>
                                <Save />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Cancel">
                              <IconButton size="small" onClick={handleCancel}>
                                <Cancel />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        ) : (
                          <Tooltip title="Edit">
                            <IconButton 
                              size="small" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(peak);
                              }}
                            >
                              <Edit />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};
