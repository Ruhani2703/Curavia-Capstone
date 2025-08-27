import { useState, useEffect, useCallback } from 'react';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Badge from '@mui/material/Badge';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Skeleton from '@mui/material/Skeleton';

import { Iconify } from 'src/components/iconify';
import alertsService, { CriticalAlert } from 'src/services/alerts.service';

// ----------------------------------------------------------------------

interface CriticalAlertsWidgetProps {
  onAlertAction?: (alertId: string, action: 'acknowledge' | 'resolve' | 'escalate') => void;
}

export function CriticalAlertsWidget({ onAlertAction }: CriticalAlertsWidgetProps) {
  const [alerts, setAlerts] = useState<CriticalAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedAlert, setSelectedAlert] = useState<CriticalAlert | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionNotes, setActionNotes] = useState('');

  // Fetch alerts data
  const fetchAlerts = useCallback(async () => {
    try {
      setError(null);
      
      // Try ThingSpeak critical alerts first, then fallback to all alerts
      let alertsResponse = await alertsService.getCriticalAlerts({ limit: 10 });
      
      if (!alertsResponse || alertsResponse.alerts.length === 0) {
        // Fallback to regular alerts from database
        const allAlerts = await alertsService.getAllAlerts({ 
          status: 'pending',
          limit: 10 
        });
        setAlerts(allAlerts);
      } else {
        setAlerts(alertsResponse.alerts);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch alerts');
      console.error('Error fetching alerts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial data load
  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAlerts();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchAlerts]);

  const handleAlertClick = (alert: CriticalAlert) => {
    setSelectedAlert(alert);
    setDialogOpen(true);
  };

  const handleAction = async (action: 'acknowledge' | 'resolve' | 'escalate') => {
    if (!selectedAlert) return;

    try {
      let success = false;
      
      switch (action) {
        case 'acknowledge':
          success = await alertsService.acknowledgeAlert(selectedAlert.id, actionNotes);
          break;
        case 'resolve':
          success = await alertsService.resolveAlert(selectedAlert.id, actionNotes);
          break;
        case 'escalate':
          // In a real app, this would escalate to higher medical authority
          // For now, just acknowledge it
          success = await alertsService.acknowledgeAlert(selectedAlert.id, 'Escalated to medical authority');
          break;
      }

      if (success) {
        // Update local state optimistically
        const updatedAlert = { ...selectedAlert };
        const currentTime = new Date();

        switch (action) {
          case 'acknowledge':
          case 'escalate':
            updatedAlert.acknowledged = true;
            updatedAlert.acknowledgedBy = 'Current Admin';
            updatedAlert.acknowledgedAt = currentTime;
            break;
          case 'resolve':
            updatedAlert.resolved = true;
            updatedAlert.resolvedBy = 'Current Admin';
            updatedAlert.resolvedAt = currentTime;
            updatedAlert.notes = actionNotes;
            break;
        }

        setAlerts(prev => 
          prev.map(alert => 
            alert.id === selectedAlert.id ? updatedAlert : alert
          )
        );

        if (onAlertAction) {
          onAlertAction(selectedAlert.id, action);
        }

        // Refresh alerts to get updated data
        setTimeout(() => fetchAlerts(), 1000);
      } else {
        console.error(`Failed to ${action} alert`);
      }
    } catch (err) {
      console.error(`Error during ${action} action:`, err);
    }

    setDialogOpen(false);
    setActionNotes('');
    setSelectedAlert(null);
  };

  const getAlertIcon = (type: CriticalAlert['type']) => {
    const iconMap = {
      high_bp: 'solar:heart-pulse-bold',
      low_bp: 'solar:heart-pulse-bold',
      irregular_heartbeat: 'solar:heart-broken-bold',
      low_oxygen: 'solar:lung-bold',
      high_temp: 'solar:thermometer-bold',
      fall_detected: 'solar:danger-bold',
      device_offline: 'solar:wifi-router-minimalistic-bold',
      battery_low: 'solar:battery-low-bold'
    };
    return iconMap[type] || 'solar:danger-triangle-bold';
  };

  const getSeverityColor = (severity: CriticalAlert['severity']) => {
    const colorMap = {
      low: 'info',
      medium: 'warning', 
      high: 'error',
      critical: 'error'
    };
    return colorMap[severity];
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    
    if (diffMins < 60) {
      return `${diffMins} min ago`;
    } else {
      return `${diffHours} hr ago`;
    }
  };

  const unacknowledgedCount = alerts.filter(alert => !alert.acknowledged).length;
  const criticalCount = alerts.filter(alert => alert.severity === 'critical' && !alert.resolved).length;

  // Loading state
  if (loading) {
    return (
      <Card>
        <CardHeader
          title={
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="h6">Critical Alerts</Typography>
              <CircularProgress size={16} />
            </Stack>
          }
        />
        <CardContent>
          <Stack spacing={2}>
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} variant="rectangular" width="100%" height={80} />
            ))}
          </Stack>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardHeader
          title={
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="h6">Critical Alerts</Typography>
            </Stack>
          }
          action={
            <Tooltip title="Retry">
              <IconButton size="small" onClick={fetchAlerts}>
                <Iconify icon="solar:refresh-bold" />
              </IconButton>
            </Tooltip>
          }
        />
        <CardContent>
          <Alert severity="error" action={
            <Button size="small" onClick={fetchAlerts}>
              Retry
            </Button>
          }>
            <Typography variant="subtitle2">Failed to load alerts</Typography>
            <Typography variant="body2">{error}</Typography>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader
          title={
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="h6">Critical Alerts</Typography>
              {unacknowledgedCount > 0 && (
                <Badge badgeContent={unacknowledgedCount} color="error">
                  <Iconify icon="solar:notification-bold" />
                </Badge>
              )}
            </Stack>
          }
          action={
            <Stack direction="row" spacing={1}>
              {criticalCount > 0 && (
                <Chip
                  label={`${criticalCount} Critical`}
                  color="error"
                  size="small"
                  icon={<Iconify icon="solar:danger-bold" />}
                />
              )}
              <Tooltip title="Refresh Alerts">
                <IconButton size="small" onClick={fetchAlerts}>
                  <Iconify icon="solar:refresh-bold" />
                </IconButton>
              </Tooltip>
            </Stack>
          }
        />
        <CardContent>
          {criticalCount > 0 && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <Typography variant="subtitle2">
                {criticalCount} critical alert(s) require immediate attention
              </Typography>
            </Alert>
          )}

          <List>
            {alerts.slice(0, 8).map((alert) => (
              <ListItem
                key={alert.id}
                button
                onClick={() => handleAlertClick(alert)}
                divider
                sx={{
                  bgcolor: alert.acknowledged ? 
                    (alert.resolved ? 'success.lighter' : 'warning.lighter') : 
                    (alert.severity === 'critical' ? 'error.lighter' : 'background.paper'),
                  borderRadius: 1,
                  mb: 1
                }}
              >
                <ListItemAvatar>
                  <Avatar
                    sx={{
                      bgcolor: alert.resolved ? 'success.main' : `${getSeverityColor(alert.severity)}.main`,
                      width: 40,
                      height: 40
                    }}
                  >
                    <Iconify 
                      icon={alert.resolved ? 'solar:check-circle-bold' : getAlertIcon(alert.type)} 
                      width={20} 
                    />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography variant="subtitle2">
                        {alert.patientName}
                      </Typography>
                      <Chip
                        label={alert.severity}
                        size="small"
                        color={getSeverityColor(alert.severity) as any}
                      />
                      {!alert.acknowledged && (
                        <Chip
                          label="New"
                          size="small"
                          color="error"
                          variant="outlined"
                        />
                      )}
                    </Stack>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        {alert.message}
                      </Typography>
                      <Stack direction="row" spacing={2}>
                        <Typography variant="caption" color="text.secondary">
                          {alert.patientId} • {formatTimeAgo(alert.timestamp)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          📍 {alert.location}
                        </Typography>
                      </Stack>
                      {alert.value && (
                        <Typography variant="caption" color="error.main">
                          Value: {alert.value} {alert.normalRange ? `(Normal: ${alert.normalRange.min}-${alert.normalRange.max} ${alert.normalRange.unit || ''})` : ''}
                        </Typography>
                      )}
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <Stack alignItems="center" spacing={0.5}>
                    {alert.resolved ? (
                      <Chip label="Resolved" size="small" color="success" />
                    ) : alert.acknowledged ? (
                      <Chip label="Acknowledged" size="small" color="warning" />
                    ) : (
                      <Chip label="Pending" size="small" color="error" />
                    )}
                  </Stack>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>

          <Button
            variant="outlined"
            fullWidth
            sx={{ mt: 2 }}
            startIcon={<Iconify icon="solar:list-bold" />}
          >
            View All Alerts ({alerts.length})
          </Button>
        </CardContent>
      </Card>

      {/* Alert Detail Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        {selectedAlert && (
          <>
            <DialogTitle>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Iconify icon={getAlertIcon(selectedAlert.type)} />
                <Typography variant="h6">
                  Alert Details - {selectedAlert.patientName}
                </Typography>
                <Chip
                  label={selectedAlert.severity}
                  size="small"
                  color={getSeverityColor(selectedAlert.severity) as any}
                />
              </Stack>
            </DialogTitle>
            <DialogContent>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>Alert Information</Typography>
                  <Typography variant="body2">{selectedAlert.message}</Typography>
                  {selectedAlert.value && (
                    <Typography variant="body2" color="error.main" sx={{ mt: 0.5 }}>
                      Current Value: {selectedAlert.value} {selectedAlert.normalRange ? `(Normal Range: ${selectedAlert.normalRange.min}-${selectedAlert.normalRange.max} ${selectedAlert.normalRange.unit || ''})` : ''}
                    </Typography>
                  )}
                </Box>

                <Box>
                  <Typography variant="subtitle2" gutterBottom>Patient Details</Typography>
                  <Typography variant="body2">
                    ID: {selectedAlert.patientId}<br/>
                    Location: {selectedAlert.location}<br/>
                    Time: {selectedAlert.timestamp.toLocaleString()}
                  </Typography>
                </Box>

                {selectedAlert.acknowledged && (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>Acknowledgment</Typography>
                    <Typography variant="body2">
                      By: {selectedAlert.acknowledgedBy}<br/>
                      At: {selectedAlert.acknowledgedAt?.toLocaleString()}
                    </Typography>
                  </Box>
                )}

                {selectedAlert.resolved && (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>Resolution</Typography>
                    <Typography variant="body2">
                      By: {selectedAlert.resolvedBy}<br/>
                      At: {selectedAlert.resolvedAt?.toLocaleString()}<br/>
                      {selectedAlert.notes && `Notes: ${selectedAlert.notes}`}
                    </Typography>
                  </Box>
                )}

                {!selectedAlert.resolved && (
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Action Notes"
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    placeholder="Add notes about the action taken..."
                  />
                )}
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDialogOpen(false)}>Close</Button>
              {!selectedAlert.resolved && (
                <>
                  {!selectedAlert.acknowledged && (
                    <Button 
                      onClick={() => handleAction('acknowledge')}
                      color="warning"
                      variant="outlined"
                    >
                      Acknowledge
                    </Button>
                  )}
                  <Button 
                    onClick={() => handleAction('resolve')}
                    color="success"
                    variant="contained"
                  >
                    Resolve
                  </Button>
                  <Button 
                    onClick={() => handleAction('escalate')}
                    color="error"
                    variant="outlined"
                  >
                    Escalate
                  </Button>
                </>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
    </>
  );
}