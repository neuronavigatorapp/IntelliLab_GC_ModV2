import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Chip,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  LinearProgress,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  Refresh as RefreshIcon,
  Assessment as AssessmentIcon,
  Notifications as NotificationsIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import Plot from 'react-plotly.js';
import { toast } from 'react-hot-toast';
import { inventoryAPI } from '../../services/apiService';
import { useMobile } from '../../hooks/useMobile';

interface ConsumableItem {
  id: number;
  name: string;
  category: string;
  subcategory?: string;
  current_stock: number;
  unit_cost: number;
  unit: string;
  supplier?: string;
  part_number?: string;
  threshold_status: {
    status: string;
    needs_reorder: boolean;
    alert?: any;
    current_stock: number;
    reorder_threshold: number;
    critical_threshold: number;
    days_to_empty: number;
  };
  usage_prediction: {
    daily_usage_rate: number;
    weekly_usage_rate: number;
    days_to_empty: number;
    confidence_score: number;
    prediction_method: string;
    data_points: number;
    last_usage_date?: string;
  };
  inventory_value: number;
}

interface InventoryStatus {
  total_items: number;
  low_stock_items: number;
  out_of_stock_items: number;
  items_needing_reorder: number;
  total_inventory_value: number;
  alerts: any[];
  predictions: any;
  inventory_items: ConsumableItem[];
}

interface ThresholdDialogProps {
  open: boolean;
  onClose: () => void;
  consumable: ConsumableItem | null;
  onSave: (thresholds: any) => void;
}

const ThresholdDialog: React.FC<ThresholdDialogProps> = ({ open, onClose, consumable, onSave }) => {
  const [thresholds, setThresholds] = useState({
    reorder_threshold: 10,
    critical_threshold: 5,
    reorder_quantity: 50,
    supplier_lead_time_days: 7,
    auto_reorder_enabled: false,
    alert_email: ''
  });

  useEffect(() => {
    if (consumable) {
      setThresholds({
        reorder_threshold: consumable.threshold_status.reorder_threshold,
        critical_threshold: consumable.threshold_status.critical_threshold,
        reorder_quantity: 50,
        supplier_lead_time_days: 7,
        auto_reorder_enabled: false,
        alert_email: ''
      });
    }
  }, [consumable]);

  const handleSave = () => {
    onSave(thresholds);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Set Reorder Thresholds - {consumable?.name}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Reorder Threshold"
              type="number"
              value={thresholds.reorder_threshold}
              onChange={(e) => setThresholds(prev => ({ ...prev, reorder_threshold: parseInt(e.target.value) }))}
              helperText="Stock level to trigger reorder"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Critical Threshold"
              type="number"
              value={thresholds.critical_threshold}
              onChange={(e) => setThresholds(prev => ({ ...prev, critical_threshold: parseInt(e.target.value) }))}
              helperText="Critical stock level"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Reorder Quantity"
              type="number"
              value={thresholds.reorder_quantity}
              onChange={(e) => setThresholds(prev => ({ ...prev, reorder_quantity: parseInt(e.target.value) }))}
              helperText="Quantity to order"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Supplier Lead Time (days)"
              type="number"
              value={thresholds.supplier_lead_time_days}
              onChange={(e) => setThresholds(prev => ({ ...prev, supplier_lead_time_days: parseInt(e.target.value) }))}
              helperText="Days for delivery"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Alert Email"
              type="email"
              value={thresholds.alert_email}
              onChange={(e) => setThresholds(prev => ({ ...prev, alert_email: e.target.value }))}
              helperText="Email for reorder alerts"
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" color="primary">
          Save Thresholds
        </Button>
      </DialogActions>
    </Dialog>
  );
};

interface UsageDialogProps {
  open: boolean;
  onClose: () => void;
  consumable: ConsumableItem | null;
  onRecord: (usage: any) => void;
}

const UsageDialog: React.FC<UsageDialogProps> = ({ open, onClose, consumable, onRecord }) => {
  const [usage, setUsage] = useState({
    quantity_used: 1,
    analysis_count: 1,
    instrument_id: '',
    method_type: '',
    notes: ''
  });

  const handleRecord = () => {
    onRecord(usage);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Record Usage - {consumable?.name}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Quantity Used"
              type="number"
              value={usage.quantity_used}
              onChange={(e) => setUsage(prev => ({ ...prev, quantity_used: parseFloat(e.target.value) }))}
              helperText={`Current stock: ${consumable?.current_stock} ${consumable?.unit}`}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Analysis Count"
              type="number"
              value={usage.analysis_count}
              onChange={(e) => setUsage(prev => ({ ...prev, analysis_count: parseInt(e.target.value) }))}
              helperText="Number of analyses"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Instrument ID"
              value={usage.instrument_id}
              onChange={(e) => setUsage(prev => ({ ...prev, instrument_id: e.target.value }))}
              helperText="Optional instrument ID"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Method Type"
              value={usage.method_type}
              onChange={(e) => setUsage(prev => ({ ...prev, method_type: e.target.value }))}
              helperText="Optional method type"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Notes"
              multiline
              rows={3}
              value={usage.notes}
              onChange={(e) => setUsage(prev => ({ ...prev, notes: e.target.value }))}
              helperText="Additional notes"
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleRecord} variant="contained" color="primary">
          Record Usage
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export const ConsumableInventory: React.FC = () => {
  const { isMobile, isTablet, isTouchDevice } = useMobile();
  
  const [inventoryStatus, setInventoryStatus] = useState<InventoryStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [thresholdDialogOpen, setThresholdDialogOpen] = useState(false);
  const [usageDialogOpen, setUsageDialogOpen] = useState(false);
  const [selectedConsumable, setSelectedConsumable] = useState<ConsumableItem | null>(null);
  const [trendsData, setTrendsData] = useState<any>(null);
  const [showTrends, setShowTrends] = useState(false);

  // Load inventory data
  const loadInventoryData = async () => {
    try {
      setLoading(true);
      const response = await inventoryAPI.getStatus();
      setInventoryStatus(response.data);
      
      // Load trends data
      const trendsResponse = await inventoryAPI.getTrends();
      setTrendsData(trendsResponse.data);
    } catch (error) {
      console.error('Error loading inventory data:', error);
      toast.error('Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventoryData();
  }, []);

  // Handle threshold updates
  const handleThresholdUpdate = async (thresholds: any) => {
    if (!selectedConsumable) return;
    
    try {
      await inventoryAPI.setThresholds(selectedConsumable.id, thresholds);
      toast.success('Thresholds updated successfully');
      loadInventoryData();
    } catch (error) {
      console.error('Error updating thresholds:', error);
      toast.error('Failed to update thresholds');
    }
  };

  // Handle usage recording
  const handleUsageRecord = async (usage: any) => {
    if (!selectedConsumable) return;
    
    try {
      await inventoryAPI.recordUsage(selectedConsumable.id, usage);
      toast.success('Usage recorded successfully');
      loadInventoryData();
    } catch (error) {
      console.error('Error recording usage:', error);
      toast.error('Failed to record usage');
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'adequate_stock': return 'success';
      case 'low_stock': return 'warning';
      case 'critical_stock': return 'error';
      case 'out_of_stock': return 'error';
      default: return 'default';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'adequate_stock': return <CheckCircleIcon />;
      case 'low_stock': return <WarningIcon />;
      case 'critical_stock': return <ErrorIcon />;
      case 'out_of_stock': return <ErrorIcon />;
      default: return <InfoIcon />;
    }
  };

  // Calculate stock percentage
  const getStockPercentage = (item: ConsumableItem) => {
    const threshold = item.threshold_status.reorder_threshold;
    const current = item.threshold_status.current_stock;
    return Math.min(100, (current / threshold) * 100);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%)', color: 'white' }}>
        <CardContent sx={{ p: isMobile ? 2 : 3 }}>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <InventoryIcon sx={{ fontSize: isMobile ? 32 : 40 }} />
            <Box>
              <Typography variant={isMobile ? "h5" : "h4"} fontWeight={600}>
                Consumable Inventory
              </Typography>
              <Typography variant={isMobile ? "body2" : "subtitle1"} sx={{ opacity: 0.9 }}>
                {isMobile ? "Inventory Management" : "Track consumables with predictive alerts and reorder thresholds"}
              </Typography>
            </Box>
          </Box>
          
          <Box display="flex" gap={1} alignItems="center" flexWrap="wrap">
            <Chip 
              label={`${inventoryStatus?.total_items || 0} Items`} 
              color="secondary"
              size={isMobile ? "small" : "medium"}
            />
                        {inventoryStatus?.items_needing_reorder && inventoryStatus.items_needing_reorder > 0 && (
              <Chip
                label={`${inventoryStatus.items_needing_reorder} Need Reorder`} 
                color="error"
                size={isMobile ? "small" : "medium"}
              />
            )}
            <Typography variant="body2" sx={{ ml: 'auto' }}>
              Total Value: ${inventoryStatus?.total_inventory_value?.toFixed(2) || '0.00'}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Alerts */}
      {inventoryStatus?.alerts && inventoryStatus.alerts.length > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Box display="flex" alignItems="center" gap={1}>
            <NotificationsIcon />
            <Typography variant="subtitle2">
              {inventoryStatus.alerts.length} inventory alert(s) require attention
            </Typography>
          </Box>
          <List dense sx={{ mt: 1 }}>
            {inventoryStatus.alerts.slice(0, 3).map((alert, index) => (
              <ListItem key={index} sx={{ py: 0 }}>
                <ListItemIcon>
                  <WarningIcon color="warning" />
                </ListItemIcon>
                <ListItemText 
                  primary={alert.message}
                  secondary={`Severity: ${alert.severity}`}
                />
              </ListItem>
            ))}
          </List>
        </Alert>
      )}

      <Grid container spacing={isMobile ? 2 : 3}>
        {/* Inventory Summary */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Inventory Summary
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Total Items
                </Typography>
                <Typography variant="h4" color="primary">
                  {inventoryStatus?.total_items || 0}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Low Stock Items
                </Typography>
                <Typography variant="h6" color="warning.main">
                  {inventoryStatus?.low_stock_items || 0}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Out of Stock
                </Typography>
                <Typography variant="h6" color="error.main">
                  {inventoryStatus?.out_of_stock_items || 0}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Total Value
                </Typography>
                <Typography variant="h6" color="success.main">
                  ${inventoryStatus?.total_inventory_value?.toFixed(2) || '0.00'}
                </Typography>
              </Box>

              <Button
                variant="outlined"
                startIcon={<TrendingUpIcon />}
                onClick={() => setShowTrends(!showTrends)}
                fullWidth
                sx={{ mt: 2 }}
              >
                {showTrends ? 'Hide' : 'Show'} Usage Trends
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Inventory Table */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Consumable Items
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={loadInventoryData}
                  size={isMobile ? "small" : "medium"}
                >
                  Refresh
                </Button>
              </Box>
              
              <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
                <Table stickyHeader size={isMobile ? "small" : "medium"}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Item</TableCell>
                      <TableCell>Stock</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Days Left</TableCell>
                      <TableCell>Value</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {inventoryStatus?.inventory_items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Box>
                            <Typography variant="subtitle2" fontWeight={600}>
                              {item.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {item.category} • {item.unit}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2">
                              {item.current_stock} {item.unit}
                            </Typography>
                            <LinearProgress 
                              variant="determinate" 
                              value={getStockPercentage(item)}
                              color={getStatusColor(item.threshold_status.status) as any}
                              sx={{ mt: 0.5, height: 4 }}
                            />
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={getStatusIcon(item.threshold_status.status)}
                            label={item.threshold_status.status.replace('_', ' ')}
                            color={getStatusColor(item.threshold_status.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {item.usage_prediction.days_to_empty === Infinity 
                              ? '∞' 
                              : `${item.usage_prediction.days_to_empty.toFixed(1)} days`
                            }
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            ${item.inventory_value.toFixed(2)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" gap={0.5}>
                            <Tooltip title="Record Usage">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setSelectedConsumable(item);
                                  setUsageDialogOpen(true);
                                }}
                              >
                                <AddIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Set Thresholds">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setSelectedConsumable(item);
                                  setThresholdDialogOpen(true);
                                }}
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  // TODO: Implement detail view
                                  toast('Detail view coming soon');
                                }}
                              >
                                <VisibilityIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Usage Trends */}
      {showTrends && trendsData && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Usage Trends & Predictions
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Weekly Cost Analysis
                </Typography>
                {trendsData.high_usage_items && trendsData.high_usage_items.length > 0 ? (
                  <List dense>
                    {trendsData.high_usage_items.slice(0, 5).map((item: any, index: number) => (
                      <ListItem key={index}>
                        <ListItemText
                          primary={item.name}
                          secondary={`$${item.weekly_cost.toFixed(2)}/week • ${item.daily_usage.toFixed(2)}/day`}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No high-usage items detected
                  </Typography>
                )}
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Recommendations
                </Typography>
                {trendsData.recommendations && trendsData.recommendations.length > 0 ? (
                  <List dense>
                    {trendsData.recommendations.map((rec: string, index: number) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <InfoIcon color="info" />
                        </ListItemIcon>
                        <ListItemText primary={rec} />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No recommendations at this time
                  </Typography>
                )}
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <ThresholdDialog
        open={thresholdDialogOpen}
        onClose={() => setThresholdDialogOpen(false)}
        consumable={selectedConsumable}
        onSave={handleThresholdUpdate}
      />
      
      <UsageDialog
        open={usageDialogOpen}
        onClose={() => setUsageDialogOpen(false)}
        consumable={selectedConsumable}
        onRecord={handleUsageRecord}
      />
    </Box>
  );
};

export default ConsumableInventory;
