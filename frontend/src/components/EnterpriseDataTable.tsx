import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Typography,
  Box,
} from '@mui/material';
import { styled } from '@mui/material/styles';

// Enterprise-grade table styling matching Agilent/Thermo standards
const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  backgroundColor: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
  '& .MuiTable-root': {
    borderCollapse: 'separate',
    borderSpacing: 0,
  },
}));

const StyledTableHead = styled(TableHead)(({ theme }) => ({
  backgroundColor: '#f8fafc',
  '& .MuiTableCell-head': {
    backgroundColor: '#f8fafc',
    color: '#374151',
    fontWeight: 600,
    fontSize: '0.875rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    padding: '16px 24px',
    borderBottom: '2px solid #e5e7eb',
    '&:first-of-type': {
      borderTopLeftRadius: '8px',
    },
    '&:last-of-type': {
      borderTopRightRadius: '8px',
    },
  },
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  padding: '16px 24px',
  fontSize: '0.875rem',
  color: '#374151',
  borderBottom: '1px solid #f3f4f6',
  '&:first-of-type': {
    fontWeight: 500,
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:hover': {
    backgroundColor: '#f9fafb',
    transition: 'background-color 0.15s ease-in-out',
  },
  '&:last-child .MuiTableCell-root': {
    borderBottom: 'none',
  },
}));

interface DataRow {
  id: string;
  parameter: string;
  value: string | number;
  unit?: string;
  status?: 'pass' | 'fail' | 'warning' | 'info';
  uncertainty?: string;
  method?: string;
}

interface EnterpriseDataTableProps {
  title: string;
  subtitle?: string;
  data: DataRow[];
  showStatus?: boolean;
  showUncertainty?: boolean;
}

const getStatusColor = (status?: string) => {
  switch (status) {
    case 'pass': return '#10b981';
    case 'fail': return '#ef4444';
    case 'warning': return '#f59e0b';
    case 'info': return '#3b82f6';
    default: return '#6b7280';
  }
};

const getStatusLabel = (status?: string) => {
  switch (status) {
    case 'pass': return 'PASS';
    case 'fail': return 'FAIL';
    case 'warning': return 'CHECK';
    case 'info': return 'INFO';
    default: return 'N/A';
  }
};

export const EnterpriseDataTable: React.FC<EnterpriseDataTableProps> = ({
  title,
  subtitle,
  data,
  showStatus = false,
  showUncertainty = false,
}) => {
  return (
    <Box sx={{ mb: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 2 }}>
        <Typography 
          variant="h6" 
          sx={{ 
            color: '#1a365d',
            fontWeight: 600,
            fontSize: '1.125rem',
            mb: 0.5,
          }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography 
            variant="body2" 
            sx={{ 
              color: '#64748b',
              fontSize: '0.875rem',
            }}
          >
            {subtitle}
          </Typography>
        )}
      </Box>

      {/* Enterprise Data Table */}
      <StyledTableContainer>
        <Table>
          <StyledTableHead>
            <TableRow>
              <TableCell>Parameter</TableCell>
              <TableCell align="right">Value</TableCell>
              {showUncertainty && <TableCell align="right">Uncertainty</TableCell>}
              {showStatus && <TableCell align="center">Status</TableCell>}
              <TableCell>Method</TableCell>
            </TableRow>
          </StyledTableHead>
          <TableBody>
            {data.map((row) => (
              <StyledTableRow key={row.id}>
                <StyledTableCell>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontWeight: 500,
                      color: '#1f2937',
                    }}
                  >
                    {row.parameter}
                  </Typography>
                </StyledTableCell>
                <StyledTableCell align="right">
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontFamily: 'Monaco, "Lucida Console", monospace',
                        fontWeight: 500,
                        color: '#1f2937',
                      }}
                    >
                      {typeof row.value === 'number' ? row.value.toFixed(4) : row.value}
                    </Typography>
                    {row.unit && (
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: '#64748b',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                        }}
                      >
                        {row.unit}
                      </Typography>
                    )}
                  </Box>
                </StyledTableCell>
                {showUncertainty && (
                  <StyledTableCell align="right">
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontFamily: 'Monaco, "Lucida Console", monospace',
                        color: '#64748b',
                        fontSize: '0.8125rem',
                      }}
                    >
                      {row.uncertainty || '—'}
                    </Typography>
                  </StyledTableCell>
                )}
                {showStatus && (
                  <StyledTableCell align="center">
                    <Chip
                      label={getStatusLabel(row.status)}
                      size="small"
                      sx={{
                        backgroundColor: getStatusColor(row.status),
                        color: 'white',
                        fontWeight: 600,
                        fontSize: '0.6875rem',
                        letterSpacing: '0.05em',
                        minWidth: '60px',
                        height: '24px',
                      }}
                    />
                  </StyledTableCell>
                )}
                <StyledTableCell>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: '#64748b',
                      fontSize: '0.75rem',
                    }}
                  >
                    {row.method || 'Standard'}
                  </Typography>
                </StyledTableCell>
              </StyledTableRow>
            ))}
          </TableBody>
        </Table>
      </StyledTableContainer>
    </Box>
  );
};

export default EnterpriseDataTable;



