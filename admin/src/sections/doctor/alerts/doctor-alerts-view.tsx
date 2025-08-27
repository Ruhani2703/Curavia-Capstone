import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Badge from '@mui/material/Badge';

import { DashboardContent } from 'src/layouts/dashboard';
import { Iconify } from 'src/components/iconify';
import apiHelper from 'src/utils/apiHelper';
import { setupDevAuth, checkDevAuth } from 'src/utils/devAuth';

// ----------------------------------------------------------------------

const ALERT_TYPES = ['All', 'Critical', 'High', 'Medium', 'Low', 'ML Anomaly', 'Vital Sign'];
const ALERT_STATUS = ['All', 'Pending', 'Acknowledged', 'Resolved'];

interface Alert {
  _id: string;
  userId: { name: string; patientId: string; _id: string };
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  message: string;
  status: 'pending' | 'acknowledged' | 'resolved';
  createdAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  details?: any;
}

export function DoctorAlertsView() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [detailDialog, setDetailDialog] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Fetch alerts data
  const fetchAlerts = useCallback(async () => {
    try {
      setError('');
      
      // Check if authenticated
      if (!checkDevAuth()) {
        const authSuccess = await setupDevAuth('doctor');
        if (!authSuccess) {
          setError('Failed to authenticate. Please check your credentials.');
          setLoading(false);
          return;
        }
      }
      
      const response = await apiHelper.get('/alert');
      if (response.alerts) {
        setAlerts(response.alerts);
        setFilteredAlerts(response.alerts);
      } else {
        throw new Error('Failed to fetch alerts');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch alerts');
      console.error('Error fetching alerts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Filter alerts based on type and status
  useEffect(() => {
    let filtered = alerts;

    if (filterType !== 'All') {
      filtered = filtered.filter(alert => {
        if (filterType === 'ML Anomaly') return alert.type === 'ml_anomaly';
        if (filterType === 'Vital Sign') return alert.type === 'vital_breach';
        return alert.severity === filterType.toLowerCase();
      });
    }

    if (filterStatus !== 'All') {
      filtered = filtered.filter(alert => alert.status === filterStatus.toLowerCase());
    }

    setFilteredAlerts(filtered);
  }, [alerts, filterType, filterStatus]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return 'solar:danger-triangle-bold';
      case 'high': return 'solar:shield-warning-bold';
      case 'medium': return 'solar:info-circle-bold';
      case 'low': return 'solar:shield-check-bold';
      default: return 'solar:info-circle-bold';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'success';
      case 'acknowledged': return 'info';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  const handleUpdateAlert = async (alertId: string, updates: { status?: string; acknowledgedAt?: string; resolvedAt?: string }) => {
    setUpdating(true);
    try {
      const response = await apiHelper.put(`/alert/${alertId}`, updates);
      if (response.success) {
        await fetchAlerts();
        if (selectedAlert && selectedAlert._id === alertId) {
          setDetailDialog(false);
          setSelectedAlert(null);
        }
      } else {
        throw new Error('Failed to update alert');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update alert');
    } finally {
      setUpdating(false);
    }
  };

  const criticalCount = alerts.filter(a => a.severity === 'critical' && a.status === 'pending').length;
  const pendingCount = alerts.filter(a => a.status === 'pending').length;

  if (loading) {
    return (
      <DashboardContent>
        <Box sx={{ mb: 5 }}>
          <Typography variant="h4" sx={{ mb: 1 }}>
            Patient Alerts 🚨
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Monitor and manage patient alerts and notifications
          </Typography>
        </Box>

        <Stack spacing={3}>
          <CircularProgress />
          <Typography variant="body2" color="text.secondary">
            Loading alerts...
          </Typography>
        </Stack>
      </DashboardContent>
    );
  }

  if (error) {
    return (
      <DashboardContent>
        <Box sx={{ mb: 5 }}>
          <Typography variant="h4" sx={{ mb: 1 }}>
            Patient Alerts 🚨
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Monitor and manage patient alerts and notifications
          </Typography>
        </Box>

        <Alert severity="error" action={
          <Button size="small" onClick={fetchAlerts}>
            Retry
          </Button>
        }>
          <Typography variant="subtitle2">Failed to load alerts</Typography>
          <Typography variant="body2">{error}</Typography>
        </Alert>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 5 }}>
        <Box>
          <Typography variant="h4" sx={{ mb: 1 }}>
            Patient Alerts 🚨
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Monitor and manage patient alerts and notifications
          </Typography>
        </Box>
        <Button
          variant="outlined"
          size="small"
          onClick={fetchAlerts}
          disabled={loading}
          startIcon={<Iconify icon="solar:refresh-bold" />}
        >
          Refresh
        </Button>
      </Stack>

      {/* Alert Statistics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid xs={12} sm={6} md={3}>
          <Card sx={{ py: 3, textAlign: 'center' }}>
            <Typography variant="h3" color="error.main">
              {criticalCount}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Critical Alerts
            </Typography>
          </Card>
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <Card sx={{ py: 3, textAlign: 'center' }}>
            <Typography variant="h3" color="warning.main">
              {pendingCount}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Pending Alerts
            </Typography>
          </Card>
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <Card sx={{ py: 3, textAlign: 'center' }}>
            <Typography variant="h3" color="success.main">
              {alerts.filter(a => a.status === 'resolved').length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Resolved Today
            </Typography>
          </Card>
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <Card sx={{ py: 3, textAlign: 'center' }}>
            <Typography variant="h3" color="primary.main">
              {alerts.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Alerts
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Alerts Management */}
      <Card sx={{ p: 3 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
          <Typography variant="h6">Recent Alerts</Typography>
          <Stack direction="row" spacing={2}>
            <TextField
              select
              size="small"
              label="Type"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              sx={{ minWidth: 120 }}
            >
              {ALERT_TYPES.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              size="small"
              label="Status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              sx={{ minWidth: 120 }}
            >
              {ALERT_STATUS.map((status) => (
                <MenuItem key={status} value={status}>
                  {status}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </Stack>

        {filteredAlerts.length === 0 ? (
          <Box sx={{ py: 5, textAlign: 'center' }}>
            <Iconify icon="solar:shield-check-bold" width={48} sx={{ color: 'success.main', mb: 2 }} />
            <Typography variant="h6">No alerts found</Typography>
            <Typography variant="body2" color="text.secondary">
              {filterType !== 'All' || filterStatus !== 'All' 
                ? 'Try adjusting your filters to see more alerts'
                : 'All patients are stable with no active alerts'
              }
            </Typography>
          </Box>
        ) : (
          <List>
            {filteredAlerts.map((alert, index) => (
              <Box key={alert._id}>
                <ListItem
                  sx={{ 
                    px: 0, 
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover' }
                  }}
                  onClick={() => {
                    setSelectedAlert(alert);
                    setDetailDialog(true);
                  }}
                >
                  <ListItemAvatar>
                    <Badge
                      variant="dot"
                      color={alert.status === 'pending' ? 'error' : 'success'}
                    >
                      <Avatar 
                        sx={{ 
                          bgcolor: `${getSeverityColor(alert.severity)}.main`,
                          color: 'white'
                        }}
                      >
                        <Iconify icon={getSeverityIcon(alert.severity)} />
                      </Avatar>
                    </Badge>
                  </ListItemAvatar>
                  
                  <ListItemText
                    primary={
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography variant="subtitle2">
                          {alert.title}
                        </Typography>
                        <Chip
                          size="small"
                          label={alert.severity}
                          color={getSeverityColor(alert.severity) as any}
                          variant="soft"
                        />
                        <Chip
                          size="small"
                          label={alert.status}
                          color={getStatusColor(alert.status) as any}
                          variant="outlined"
                        />
                      </Stack>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Patient: {alert.userId?.name || 'Unknown'} ({alert.userId?.patientId || 'N/A'})
                        </Typography>
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {alert.message}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(alert.createdAt).toLocaleString()}
                        </Typography>
                      </Box>
                    }
                  />
                  
                  <ListItemSecondaryAction>
                    <Stack direction="row" spacing={1}>
                      {alert.status === 'pending' && (
                        <IconButton 
                          size="small"
                          color="primary"
                          title="Acknowledge"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateAlert(alert._id, { 
                              status: 'acknowledged',
                              acknowledgedAt: new Date().toISOString()
                            });
                          }}
                          disabled={updating}
                        >
                          <Iconify icon="solar:check-circle-bold" />
                        </IconButton>
                      )}
                      {alert.status !== 'resolved' && (
                        <IconButton 
                          size="small"
                          color="success"
                          title="Resolve"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateAlert(alert._id, { 
                              status: 'resolved',
                              resolvedAt: new Date().toISOString()
                            });
                          }}
                          disabled={updating}
                        >
                          <Iconify icon="solar:shield-check-bold" />
                        </IconButton>
                      )}
                    </Stack>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < filteredAlerts.length - 1 && <Divider />}
              </Box>
            ))}
          </List>
        )}
      </Card>

      {/* Alert Detail Dialog */}
      <Dialog 
        open={detailDialog} 
        onClose={() => setDetailDialog(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar 
              sx={{ 
                bgcolor: `${getSeverityColor(selectedAlert?.severity || 'low')}.main`,
                color: 'white'
              }}
            >
              <Iconify icon={getSeverityIcon(selectedAlert?.severity || 'low')} />
            </Avatar>
            <Box>
              <Typography variant="h6">{selectedAlert?.title}</Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedAlert?.severity.toUpperCase()} ALERT
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>

        <DialogContent>
          {selectedAlert && (
            <Stack spacing={3}>
              <Alert severity={getSeverityColor(selectedAlert.severity) as any}>
                <Typography variant="subtitle2">
                  Patient: {selectedAlert.userId?.name} ({selectedAlert.userId?.patientId})
                </Typography>
                <Typography variant="body2">
                  {selectedAlert.message}
                </Typography>
              </Alert>

              <Grid container spacing={2}>
                <Grid xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Status</Typography>
                  <Chip
                    label={selectedAlert.status}
                    color={getStatusColor(selectedAlert.status) as any}
                    variant="soft"
                  />
                </Grid>
                <Grid xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Severity</Typography>
                  <Chip
                    label={selectedAlert.severity}
                    color={getSeverityColor(selectedAlert.severity) as any}
                  />
                </Grid>
                <Grid xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Created</Typography>
                  <Typography variant="body1">
                    {new Date(selectedAlert.createdAt).toLocaleString()}
                  </Typography>
                </Grid>
                {selectedAlert.resolvedAt && (
                  <Grid xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Resolved</Typography>
                    <Typography variant="body1">
                      {new Date(selectedAlert.resolvedAt).toLocaleString()}
                    </Typography>
                  </Grid>
                )}
              </Grid>

              {selectedAlert.details && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Additional Details
                  </Typography>
                  <Box 
                    sx={{ 
                      p: 2, 
                      bgcolor: 'grey.100', 
                      borderRadius: 1,
                      fontFamily: 'monospace',
                      fontSize: '0.875rem'
                    }}
                  >
                    <pre>{JSON.stringify(selectedAlert.details, null, 2)}</pre>
                  </Box>
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setDetailDialog(false)}>Close</Button>
          {selectedAlert && selectedAlert.status === 'pending' && (
            <Button 
              variant="outlined" 
              onClick={() => {
                if (selectedAlert) {
                  handleUpdateAlert(selectedAlert._id, { 
                    status: 'acknowledged',
                    acknowledgedAt: new Date().toISOString()
                  });
                }
              }}
              disabled={updating}
            >
              Acknowledge
            </Button>
          )}
          {selectedAlert && selectedAlert.status !== 'resolved' && (
            <Button 
              variant="contained" 
              onClick={() => {
                if (selectedAlert) {
                  handleUpdateAlert(selectedAlert._id, { 
                    status: 'resolved',
                    resolvedAt: new Date().toISOString()
                  });
                }
              }}
              disabled={updating}
            >
              Resolve
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </DashboardContent>
  );
}