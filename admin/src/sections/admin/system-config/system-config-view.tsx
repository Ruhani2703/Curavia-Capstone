import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import Slider from '@mui/material/Slider';

import { DashboardContent } from 'src/layouts/dashboard';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

// Mock system configuration data
const mockSystemConfig = {
  thingspeak: {
    apiKey: 'ABCD1234EFGH5678',
    channelId: '2034567',
    readApiKey: 'WXYZ9876MNOP5432',
    writeApiKey: 'QRST1357UVWX2468',
    status: 'connected',
    lastSync: '30 seconds ago',
    dataFields: {
      field1: 'Heart Rate',
      field2: 'Blood Pressure Systolic',
      field3: 'Blood Pressure Diastolic', 
      field4: 'Temperature',
      field5: 'Oxygen Saturation',
      field6: 'Activity Level',
      field7: 'Battery Level',
      field8: 'Device Status'
    }
  },
  email: {
    service: 'smtp',
    host: 'smtp.curavia.com',
    port: 587,
    secure: false,
    username: 'notifications@curavia.com',
    authenticated: true,
    lastTest: '2 hours ago',
    dailyLimit: 10000,
    sentToday: 1247
  },
  security: {
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    passwordMinLength: 8,
    twoFactorEnabled: true,
    encryptionLevel: 'AES-256',
    sslEnabled: true,
    firewallEnabled: true,
    lastSecurityScan: '1 day ago'
  },
  database: {
    host: 'curavia-db-cluster.amazonaws.com',
    status: 'healthy',
    connections: 45,
    maxConnections: 100,
    storageUsed: 68.5,
    lastBackup: '6 hours ago',
    backupSchedule: 'Daily at 2:00 AM',
    replication: 'enabled'
  },
  performance: {
    cpuUsage: 45,
    memoryUsage: 72,
    diskUsage: 38,
    networkLatency: 23,
    apiResponseTime: 245,
    uptime: 99.97
  }
};

// ----------------------------------------------------------------------

export function SystemConfigView() {
  const [thingspeakConfig, setThingspeakConfig] = useState(mockSystemConfig.thingspeak);
  const [emailConfig, setEmailConfig] = useState(mockSystemConfig.email);
  const [securityConfig, setSecurityConfig] = useState(mockSystemConfig.security);
  const [backupDialog, setBackupDialog] = useState(false);
  const [testDialog, setTestDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSaveThingSpeak = () => {
    setLoading(true);
    // Mock save functionality
    setTimeout(() => {
      setLoading(false);
      // Show success message
    }, 2000);
  };

  const handleTestConnection = (service: string) => {
    setTestDialog(true);
    // Mock test functionality
    setTimeout(() => {
      setTestDialog(false);
    }, 3000);
  };

  const handleBackup = () => {
    setBackupDialog(true);
    // Mock backup functionality
    setTimeout(() => {
      setBackupDialog(false);
    }, 5000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
      case 'healthy':
      case 'enabled': return 'success';
      case 'disconnected':
      case 'error': return 'error';
      case 'warning': return 'warning';
      default: return 'default';
    }
  };

  return (
    <DashboardContent>
      <Typography variant="h4" sx={{ mb: 5 }}>
        System Configuration ⚙️
      </Typography>

      {/* System Status Overview */}
      <Card sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          System Status Overview
        </Typography>
        <Grid container spacing={3}>
          <Grid xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main">
                {mockSystemConfig.performance.uptime}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                System Uptime
              </Typography>
            </Box>
          </Grid>
          <Grid xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary.main">
                {mockSystemConfig.database.connections}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active Connections
              </Typography>
            </Box>
          </Grid>
          <Grid xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="info.main">
                {mockSystemConfig.performance.apiResponseTime}ms
              </Typography>
              <Typography variant="body2" color="text.secondary">
                API Response Time
              </Typography>
            </Box>
          </Grid>
          <Grid xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="warning.main">
                {mockSystemConfig.performance.memoryUsage}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Memory Usage
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Card>

      <Grid container spacing={3}>
        {/* ThingSpeak Configuration */}
        <Grid xs={12} lg={6}>
          <Card sx={{ p: 3, mb: 3 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
              <Typography variant="h6">ThingSpeak API Configuration</Typography>
              <Chip
                icon={<Iconify icon="solar:server-bold" />}
                label={thingspeakConfig.status}
                color={getStatusColor(thingspeakConfig.status) as any}
                variant="soft"
              />
            </Stack>

            <Stack spacing={3}>
              <TextField
                fullWidth
                label="Channel ID"
                value={thingspeakConfig.channelId}
                onChange={(e) => setThingspeakConfig({...thingspeakConfig, channelId: e.target.value})}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Iconify icon="solar:hashtag-bold" />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                label="Read API Key"
                type="password"
                value={thingspeakConfig.readApiKey}
                onChange={(e) => setThingspeakConfig({...thingspeakConfig, readApiKey: e.target.value})}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Iconify icon="solar:key-bold" />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                label="Write API Key"
                type="password"
                value={thingspeakConfig.writeApiKey}
                onChange={(e) => setThingspeakConfig({...thingspeakConfig, writeApiKey: e.target.value})}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Iconify icon="solar:key-bold" />
                    </InputAdornment>
                  ),
                }}
              />

              <Alert severity="info">
                Last sync: {thingspeakConfig.lastSync}
              </Alert>

              <Stack direction="row" spacing={2}>
                <Button
                  variant="outlined"
                  onClick={() => handleTestConnection('thingspeak')}
                  startIcon={<Iconify icon="solar:play-bold" />}
                >
                  Test Connection
                </Button>
                <Button
                  variant="contained"
                  onClick={handleSaveThingSpeak}
                  loading={loading}
                  startIcon={<Iconify icon="solar:diskette-bold" />}
                >
                  Save Changes
                </Button>
              </Stack>
            </Stack>
          </Card>
        </Grid>

        {/* Email Service Configuration */}
        <Grid xs={12} lg={6}>
          <Card sx={{ p: 3, mb: 3 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
              <Typography variant="h6">Email Service Configuration</Typography>
              <Chip
                icon={<Iconify icon="solar:letter-bold" />}
                label={emailConfig.authenticated ? 'Connected' : 'Disconnected'}
                color={emailConfig.authenticated ? 'success' : 'error'}
                variant="soft"
              />
            </Stack>

            <Stack spacing={3}>
              <TextField
                fullWidth
                label="SMTP Host"
                value={emailConfig.host}
                onChange={(e) => setEmailConfig({...emailConfig, host: e.target.value})}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Iconify icon="solar:server-bold" />
                    </InputAdornment>
                  ),
                }}
              />

              <Grid container spacing={2}>
                <Grid xs={6}>
                  <TextField
                    fullWidth
                    label="Port"
                    type="number"
                    value={emailConfig.port}
                    onChange={(e) => setEmailConfig({...emailConfig, port: parseInt(e.target.value)})}
                  />
                </Grid>
                <Grid xs={6}>
                  <TextField
                    select
                    fullWidth
                    label="Security"
                    value={emailConfig.secure ? 'SSL' : 'TLS'}
                  >
                    <MenuItem value="TLS">TLS</MenuItem>
                    <MenuItem value="SSL">SSL</MenuItem>
                  </TextField>
                </Grid>
              </Grid>

              <TextField
                fullWidth
                label="Username"
                value={emailConfig.username}
                onChange={(e) => setEmailConfig({...emailConfig, username: e.target.value})}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Iconify icon="solar:user-bold" />
                    </InputAdornment>
                  ),
                }}
              />

              <Box>
                <Typography variant="body2" gutterBottom>
                  Daily Email Usage: {emailConfig.sentToday.toLocaleString()} / {emailConfig.dailyLimit.toLocaleString()}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={(emailConfig.sentToday / emailConfig.dailyLimit) * 100}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>

              <Stack direction="row" spacing={2}>
                <Button
                  variant="outlined"
                  onClick={() => handleTestConnection('email')}
                  startIcon={<Iconify icon="solar:letter-bold" />}
                >
                  Send Test Email
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Iconify icon="solar:diskette-bold" />}
                >
                  Save Changes
                </Button>
              </Stack>
            </Stack>
          </Card>
        </Grid>

        {/* Security Settings */}
        <Grid xs={12} lg={6}>
          <Card sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Security Settings
            </Typography>

            <Stack spacing={3}>
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Session Timeout (minutes): {securityConfig.sessionTimeout}
                </Typography>
                <Slider
                  value={securityConfig.sessionTimeout}
                  onChange={(e, value) => setSecurityConfig({...securityConfig, sessionTimeout: value as number})}
                  min={5}
                  max={120}
                  valueLabelDisplay="auto"
                />
              </Box>

              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Max Login Attempts: {securityConfig.maxLoginAttempts}
                </Typography>
                <Slider
                  value={securityConfig.maxLoginAttempts}
                  onChange={(e, value) => setSecurityConfig({...securityConfig, maxLoginAttempts: value as number})}
                  min={3}
                  max={10}
                  valueLabelDisplay="auto"
                />
              </Box>

              <FormControlLabel
                control={
                  <Switch
                    checked={securityConfig.twoFactorEnabled}
                    onChange={(e) => setSecurityConfig({...securityConfig, twoFactorEnabled: e.target.checked})}
                  />
                }
                label="Two-Factor Authentication"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={securityConfig.sslEnabled}
                    onChange={(e) => setSecurityConfig({...securityConfig, sslEnabled: e.target.checked})}
                  />
                }
                label="Force SSL/TLS"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={securityConfig.firewallEnabled}
                    onChange={(e) => setSecurityConfig({...securityConfig, firewallEnabled: e.target.checked})}
                  />
                }
                label="Web Application Firewall"
              />

              <Alert severity="success">
                Last security scan: {securityConfig.lastSecurityScan}
              </Alert>

              <Button
                variant="contained"
                startIcon={<Iconify icon="solar:shield-check-bold" />}
              >
                Run Security Scan
              </Button>
            </Stack>
          </Card>
        </Grid>

        {/* Database & Backup */}
        <Grid xs={12} lg={6}>
          <Card sx={{ p: 3, mb: 3 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
              <Typography variant="h6">Database & Backup</Typography>
              <Chip
                icon={<Iconify icon="solar:database-bold" />}
                label={mockSystemConfig.database.status}
                color={getStatusColor(mockSystemConfig.database.status) as any}
                variant="soft"
              />
            </Stack>

            <Stack spacing={3}>
              <Box>
                <Typography variant="body2" gutterBottom>
                  Database Host: {mockSystemConfig.database.host}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  Active Connections: {mockSystemConfig.database.connections} / {mockSystemConfig.database.maxConnections}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={(mockSystemConfig.database.connections / mockSystemConfig.database.maxConnections) * 100}
                  sx={{ height: 8, borderRadius: 4, mb: 2 }}
                />
              </Box>

              <Box>
                <Typography variant="body2" gutterBottom>
                  Storage Usage: {mockSystemConfig.database.storageUsed}%
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={mockSystemConfig.database.storageUsed}
                  color="warning"
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>

              <Divider />

              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Backup Information
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Last backup: {mockSystemConfig.database.lastBackup}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Schedule: {mockSystemConfig.database.backupSchedule}
                </Typography>
              </Box>

              <Stack direction="row" spacing={2}>
                <Button
                  variant="outlined"
                  onClick={handleBackup}
                  startIcon={<Iconify icon="solar:download-bold" />}
                >
                  Manual Backup
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Iconify icon="solar:settings-bold" />}
                >
                  Configure Schedule
                </Button>
              </Stack>
            </Stack>
          </Card>
        </Grid>
      </Grid>

      {/* Test Connection Dialog */}
      <Dialog open={testDialog} onClose={() => setTestDialog(false)}>
        <DialogTitle>Testing Connection...</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ minWidth: 300, py: 2 }}>
            <LinearProgress />
            <Typography variant="body2" color="text.secondary">
              Verifying connection parameters and testing connectivity...
            </Typography>
          </Stack>
        </DialogContent>
      </Dialog>

      {/* Backup Dialog */}
      <Dialog open={backupDialog} onClose={() => setBackupDialog(false)}>
        <DialogTitle>Creating Database Backup</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ minWidth: 300, py: 2 }}>
            <LinearProgress />
            <Typography variant="body2" color="text.secondary">
              Creating full database backup. This may take a few minutes...
            </Typography>
          </Stack>
        </DialogContent>
      </Dialog>
    </DashboardContent>
  );
}