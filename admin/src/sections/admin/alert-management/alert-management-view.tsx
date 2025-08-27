import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableBody from '@mui/material/TableBody';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Slider from '@mui/material/Slider';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';

import { DashboardContent } from 'src/layouts/dashboard';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import apiHelper from 'src/utils/apiHelper';

// ----------------------------------------------------------------------

const ALERT_TYPES = [
  'All Types',
  'High Blood Pressure',
  'Low Blood Pressure', 
  'High Heart Rate',
  'Low Heart Rate',
  'High Temperature',
  'Low Temperature',
  'Low Oxygen Saturation',
  'Sensor Disconnected',
  'Medication Missed',
  'Fall Detection'
];

const SEVERITY_LEVELS = ['All', 'Critical', 'High', 'Medium', 'Low'];
const STATUS_OPTIONS = ['All', 'Active', 'Acknowledged', 'Resolved'];

// ----------------------------------------------------------------------

export function AlertManagementView() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All Types');
  const [filterSeverity, setFilterSeverity] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [configDialog, setConfigDialog] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    heartRateMin: 60,
    heartRateMax: 100,
    bloodPressureMax: 140,
    temperatureMax: 99.0,
    oxygenMin: 94,
    autoAcknowledge: false,
    escalationTime: 5
  });
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [alertStats, setAlertStats] = useState({
    active: 0,
    critical: 0,
    unacknowledged: 0,
    resolved: 0
  });

  // Fetch alerts on component mount and set up real-time updates
  useEffect(() => {
    fetchAlerts();
    
    // Set up real-time updates every 30 seconds
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await apiHelper.get('/alert/active');
      
      if (response.alerts) {
        // Flatten grouped alerts into a single array
        const allAlerts = [
          ...response.alerts.critical,
          ...response.alerts.high,
          ...response.alerts.medium,
          ...response.alerts.low
        ];
        
        setAlerts(allAlerts);
        setAlertStats({
          active: allAlerts.filter(a => !a.isResolved).length,
          critical: response.summary?.critical || 0,
          unacknowledged: allAlerts.filter(a => !a.acknowledgedAt).length,
          resolved: allAlerts.filter(a => a.isResolved).length
        });
        setError('');
      }
    } catch (error: any) {
      console.error('Error fetching alerts:', error);
      setError('Failed to load alerts');
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter alerts
  const filteredAlerts = alerts.filter((alert) => {
    const matchesSearch = (alert.userId?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (alert._id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (alert.title || alert.type || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'All Types' || alert.type === filterType;
    const matchesSeverity = filterSeverity === 'All' || alert.severity === filterSeverity.toLowerCase();
    const alertStatus = alert.isResolved ? 'resolved' : (alert.acknowledgedAt ? 'acknowledged' : 'active');
    const matchesStatus = filterStatus === 'All' || alertStatus === filterStatus.toLowerCase();
    
    return matchesSearch && matchesType && matchesSeverity && matchesStatus;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'error';
      case 'acknowledged': return 'warning';
      case 'resolved': return 'success';
      default: return 'default';
    }
  };

  const handleAcknowledge = async (alertId: string) => {
    try {
      await apiHelper.put(`/alert/${alertId}/acknowledge`, {
        notes: 'Alert acknowledged from management dashboard'
      });
      
      fetchAlerts(); // Refresh alerts
    } catch (error: any) {
      console.error('Error acknowledging alert:', error);
    }
  };

  const handleResolve = async (alertId: string) => {
    try {
      await apiHelper.put(`/alert/${alertId}/resolve`, {
        resolution: 'Resolved from management dashboard'
      });
      
      fetchAlerts(); // Refresh alerts
    } catch (error: any) {
      console.error('Error resolving alert:', error);
    }
  };

  const handleConfigSave = () => {
    setConfigDialog(false);
    // TODO: Implement real configuration save to backend
    console.log('Saving alert configuration:', alertConfig);
  };

  return (
    <DashboardContent>
      <Typography variant="h4" sx={{ mb: 5 }}>
        Alert Management System 🚨
      </Typography>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Alert Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 5 }}>
        <Grid xs={12} sm={6} md={3}>
          <Card sx={{ py: 3, textAlign: 'center' }}>
            <Typography variant="h3" color="error.main">
              {alertStats.active}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Active Alerts
            </Typography>
          </Card>
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <Card sx={{ py: 3, textAlign: 'center' }}>
            <Typography variant="h3" color="error.main">
              {alertStats.critical}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Critical Alerts
            </Typography>
          </Card>
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <Card sx={{ py: 3, textAlign: 'center' }}>
            <Typography variant="h3" color="warning.main">
              {alertStats.unacknowledged}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Unacknowledged
            </Typography>
          </Card>
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <Card sx={{ py: 3, textAlign: 'center' }}>
            <Typography variant="h3" color="success.main">
              {alertStats.resolved}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Resolved Today
            </Typography>
          </Card>
        </Grid>
      </Grid>

      <Card>
        {/* Search and Filters */}
        <Box sx={{ p: 3 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              fullWidth
              placeholder="Search alerts by patient, ID, or type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="solar:magnifer-bold" width={20} />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              select
              label="Alert Type"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              sx={{ minWidth: 160 }}
            >
              {ALERT_TYPES.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Severity"
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              sx={{ minWidth: 120 }}
            >
              {SEVERITY_LEVELS.map((level) => (
                <MenuItem key={level} value={level}>
                  {level}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              sx={{ minWidth: 120 }}
            >
              {STATUS_OPTIONS.map((status) => (
                <MenuItem key={status} value={status}>
                  {status}
                </MenuItem>
              ))}
            </TextField>
            <Button
              variant="contained"
              startIcon={<Iconify icon="solar:settings-bold" />}
              onClick={() => setConfigDialog(true)}
              sx={{ minWidth: 140 }}
            >
              Configure
            </Button>
          </Stack>
        </Box>

        {/* Alerts Table */}
        <Scrollbar>
          <TableContainer sx={{ overflow: 'unset' }}>
            <Table sx={{ minWidth: 800 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Alert Details</TableCell>
                  <TableCell>Patient</TableCell>
                  <TableCell>Severity</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Value/Threshold</TableCell>
                  <TableCell>Time</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredAlerts
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((alert) => (
                    <TableRow
                      key={alert._id}
                      hover
                      sx={{ cursor: 'pointer' }}
                      onClick={() => setSelectedAlert(alert)}
                    >
                      <TableCell>
                        <Box>
                          <Typography variant="subtitle2">{alert.title || alert.type}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {alert._id}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">{alert.userId?.name || 'Unknown Patient'}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {alert.userId?.patientId || 'N/A'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={alert.severity}
                          color={getSeverityColor(alert.severity) as any}
                          variant="soft"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={alert.isResolved ? 'resolved' : 'active'}
                          color={getStatusColor(alert.isResolved ? 'resolved' : 'active') as any}
                          variant="soft"
                        />
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" color="error.main">
                            {alert.details?.currentValue || 'N/A'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {alert.message}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(alert.createdAt).toLocaleString()}
                        </Typography>
                        {alert.acknowledgedAt && (
                          <Typography variant="caption" color="success.main">
                            Ack: {new Date(alert.acknowledgedAt).toLocaleTimeString()}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={1}>
                          {!alert.acknowledgedAt && (
                            <IconButton 
                              size="small" 
                              color="warning"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAcknowledge(alert._id);
                              }}
                            >
                              <Iconify icon="solar:check-circle-bold" />
                            </IconButton>
                          )}
                          {!alert.isResolved && (
                            <IconButton 
                              size="small" 
                              color="success"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleResolve(alert._id);
                              }}
                            >
                              <Iconify icon="solar:check-square-bold" />
                            </IconButton>
                          )}
                          <IconButton size="small">
                            <Iconify icon="solar:eye-bold" />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Scrollbar>

        <TablePagination
          page={page}
          component="div"
          count={filteredAlerts.length}
          rowsPerPage={rowsPerPage}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPageOptions={[5, 10, 25]}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </Card>

      {/* Alert Configuration Dialog */}
      <Dialog open={configDialog} onClose={() => setConfigDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Iconify icon="solar:settings-bold" />
            Alert Configuration
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={4} sx={{ pt: 2 }}>
            <Alert severity="info">
              Configure threshold values and escalation rules for automated alert generation.
            </Alert>

            {/* Heart Rate Thresholds */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Heart Rate Thresholds (bpm)
              </Typography>
              <Grid container spacing={2} alignItems="center">
                <Grid xs={6}>
                  <Typography variant="body2">Minimum: {alertConfig.heartRateMin}</Typography>
                  <Slider
                    value={alertConfig.heartRateMin}
                    onChange={(e, value) => setAlertConfig({...alertConfig, heartRateMin: value as number})}
                    min={30}
                    max={80}
                    valueLabelDisplay="auto"
                  />
                </Grid>
                <Grid xs={6}>
                  <Typography variant="body2">Maximum: {alertConfig.heartRateMax}</Typography>
                  <Slider
                    value={alertConfig.heartRateMax}
                    onChange={(e, value) => setAlertConfig({...alertConfig, heartRateMax: value as number})}
                    min={80}
                    max={150}
                    valueLabelDisplay="auto"
                  />
                </Grid>
              </Grid>
            </Box>

            <Divider />

            {/* Blood Pressure */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Blood Pressure Maximum (Systolic)
              </Typography>
              <Typography variant="body2">Maximum: {alertConfig.bloodPressureMax} mmHg</Typography>
              <Slider
                value={alertConfig.bloodPressureMax}
                onChange={(e, value) => setAlertConfig({...alertConfig, bloodPressureMax: value as number})}
                min={120}
                max={180}
                valueLabelDisplay="auto"
              />
            </Box>

            <Divider />

            {/* Temperature */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Temperature Maximum (°F)
              </Typography>
              <Typography variant="body2">Maximum: {alertConfig.temperatureMax}°F</Typography>
              <Slider
                value={alertConfig.temperatureMax}
                onChange={(e, value) => setAlertConfig({...alertConfig, temperatureMax: value as number})}
                min={98.0}
                max={102.0}
                step={0.1}
                valueLabelDisplay="auto"
              />
            </Box>

            <Divider />

            {/* Oxygen Saturation */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Oxygen Saturation Minimum (%)
              </Typography>
              <Typography variant="body2">Minimum: {alertConfig.oxygenMin}%</Typography>
              <Slider
                value={alertConfig.oxygenMin}
                onChange={(e, value) => setAlertConfig({...alertConfig, oxygenMin: value as number})}
                min={85}
                max={98}
                valueLabelDisplay="auto"
              />
            </Box>

            <Divider />

            {/* Advanced Settings */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Advanced Settings
              </Typography>
              <Stack spacing={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={alertConfig.autoAcknowledge}
                      onChange={(e) => setAlertConfig({...alertConfig, autoAcknowledge: e.target.checked})}
                    />
                  }
                  label="Auto-acknowledge low severity alerts"
                />
                <Box>
                  <Typography variant="body2">
                    Escalation Time: {alertConfig.escalationTime} minutes
                  </Typography>
                  <Slider
                    value={alertConfig.escalationTime}
                    onChange={(e, value) => setAlertConfig({...alertConfig, escalationTime: value as number})}
                    min={1}
                    max={15}
                    valueLabelDisplay="auto"
                  />
                </Box>
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfigDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleConfigSave}>
            Save Configuration
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardContent>
  );
}