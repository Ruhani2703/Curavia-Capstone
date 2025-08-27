import { useState, useEffect } from 'react';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

interface SystemMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  maxValue: number;
  status: 'normal' | 'warning' | 'critical';
  icon: string;
  color: string;
  description: string;
}

interface ServiceStatus {
  name: string;
  status: 'online' | 'offline' | 'degraded';
  uptime: number;
  responseTime: number;
  lastCheck: string;
  url?: string;
  version?: string;
}

interface SystemHealthWidgetProps {
  onRefresh?: () => void;
}

export function SystemHealthWidget({ onRefresh }: SystemHealthWidgetProps) {
  const [systemMetrics, setSystemMetrics] = useState<SystemMetric[]>([
    {
      id: 'cpu',
      name: 'CPU Usage',
      value: 68,
      unit: '%',
      maxValue: 100,
      status: 'normal',
      icon: 'solar:cpu-bolt-bold',
      color: 'primary',
      description: 'Server processing load'
    },
    {
      id: 'memory',
      name: 'Memory Usage',
      value: 74,
      unit: '%', 
      maxValue: 100,
      status: 'warning',
      icon: 'solar:database-bold',
      color: 'warning',
      description: 'RAM utilization'
    },
    {
      id: 'disk',
      name: 'Disk Usage',
      value: 45,
      unit: '%',
      maxValue: 100,
      status: 'normal',
      icon: 'solar:hard-drive-bold',
      color: 'success',
      description: 'Storage capacity used'
    },
    {
      id: 'network',
      name: 'Network Latency',
      value: 23,
      unit: 'ms',
      maxValue: 100,
      status: 'normal',
      icon: 'solar:global-bold',
      color: 'info',
      description: 'Network response time'
    }
  ]);

  const [services, setServices] = useState<ServiceStatus[]>([
    {
      name: 'ThingSpeak API',
      status: 'online',
      uptime: 99.97,
      responseTime: 245,
      lastCheck: '30 sec ago',
      url: 'api.thingspeak.com',
      version: 'v2.0'
    },
    {
      name: 'Database Server',
      status: 'online',
      uptime: 99.99,
      responseTime: 12,
      lastCheck: '15 sec ago',
      version: 'MongoDB 6.0'
    },
    {
      name: 'Notification Service',
      status: 'online',
      uptime: 98.5,
      responseTime: 156,
      lastCheck: '1 min ago',
      version: 'v1.2'
    },
    {
      name: 'ML Processing',
      status: 'degraded',
      uptime: 97.2,
      responseTime: 2340,
      lastCheck: '2 min ago',
      version: 'v0.8-beta'
    },
    {
      name: 'Email Service',
      status: 'online',
      uptime: 99.1,
      responseTime: 890,
      lastCheck: '45 sec ago',
      version: 'v2.1'
    }
  ]);

  const [systemInfo, setSystemInfo] = useState({
    serverUptime: '15 days, 8 hours',
    totalRequests: 2847592,
    activeConnections: 1247,
    errorRate: 0.03,
    dataProcessed: '2.4 TB',
    lastBackup: '2 hours ago',
    securityScan: '1 day ago'
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setSystemMetrics(prev =>
        prev.map(metric => {
          let newValue = metric.value + (Math.random() - 0.5) * 10;
          newValue = Math.max(0, Math.min(metric.maxValue, newValue));
          
          let status: SystemMetric['status'] = 'normal';
          if (metric.id === 'cpu' || metric.id === 'memory') {
            if (newValue > 85) status = 'critical';
            else if (newValue > 70) status = 'warning';
          } else if (metric.id === 'disk') {
            if (newValue > 90) status = 'critical';
            else if (newValue > 80) status = 'warning';
          } else if (metric.id === 'network') {
            if (newValue > 50) status = 'critical';
            else if (newValue > 30) status = 'warning';
          }

          return {
            ...metric,
            value: Math.round(newValue),
            status,
            color: status === 'critical' ? 'error' : 
                   status === 'warning' ? 'warning' : 
                   'success'
          };
        })
      );

      // Update system info
      setSystemInfo(prev => ({
        ...prev,
        totalRequests: prev.totalRequests + Math.floor(Math.random() * 50),
        activeConnections: Math.max(1000, prev.activeConnections + Math.floor((Math.random() - 0.5) * 100))
      }));
    }, 15000); // Update every 15 seconds

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      if (onRefresh) onRefresh();
    }, 1500);
  };

  const getServiceStatusColor = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'online':
        return 'success';
      case 'degraded':
        return 'warning';
      case 'offline':
        return 'error';
      default:
        return 'default';
    }
  };

  const getServiceStatusIcon = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'online':
        return 'solar:check-circle-bold';
      case 'degraded':
        return 'solar:shield-warning-bold';
      case 'offline':
        return 'solar:close-circle-bold';
      default:
        return 'solar:question-circle-bold';
    }
  };

  const criticalServices = services.filter(s => s.status === 'offline').length;
  const degradedServices = services.filter(s => s.status === 'degraded').length;
  const overallHealth = services.filter(s => s.status === 'online').length / services.length * 100;

  return (
    <Card>
      <CardHeader
        title="System Health Monitor"
        action={
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              label={`${Math.round(overallHealth)}% Healthy`}
              color={overallHealth > 95 ? 'success' : overallHealth > 80 ? 'warning' : 'error'}
              size="small"
              icon={<Iconify icon="solar:shield-check-bold" />}
            />
            <Tooltip title="Refresh Status">
              <IconButton onClick={handleRefresh} disabled={isRefreshing}>
                <Iconify 
                  icon="solar:refresh-bold" 
                  sx={{ 
                    animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
                    '@keyframes spin': {
                      '0%': { transform: 'rotate(0deg)' },
                      '100%': { transform: 'rotate(360deg)' }
                    }
                  }}
                />
              </IconButton>
            </Tooltip>
          </Stack>
        }
      />
      <CardContent>
        {/* Critical Alerts */}
        {criticalServices > 0 && (
          <Alert severity="error" sx={{ mb: 3 }}>
            <Typography variant="subtitle2">
              {criticalServices} critical service(s) offline
            </Typography>
            <Typography variant="body2">
              System functionality may be impaired. Check service status immediately.
            </Typography>
          </Alert>
        )}

        {degradedServices > 0 && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="subtitle2">
              {degradedServices} service(s) experiencing issues
            </Typography>
            <Typography variant="body2">
              Performance may be affected. Monitor closely.
            </Typography>
          </Alert>
        )}

        {/* System Metrics */}
        <Typography variant="h6" sx={{ mb: 2 }}>
          Resource Usage
        </Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {systemMetrics.map((metric) => (
            <Grid item xs={6} sm={3} key={metric.id}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: 'background.neutral',
                  textAlign: 'center'
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: `${metric.color}.main`,
                    width: 40,
                    height: 40,
                    mx: 'auto',
                    mb: 1
                  }}
                >
                  <Iconify icon={metric.icon} width={20} />
                </Avatar>
                <Typography variant="h6" sx={{ mb: 0.5 }}>
                  {metric.value}{metric.unit}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  {metric.name}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={metric.value}
                  color={metric.color as any}
                  sx={{ height: 4, borderRadius: 2 }}
                />
              </Box>
            </Grid>
          ))}
        </Grid>

        {/* Service Status */}
        <Typography variant="h6" sx={{ mb: 2 }}>
          Service Status
        </Typography>
        <Stack spacing={2} sx={{ mb: 3 }}>
          {services.map((service, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                alignItems: 'center',
                p: 2,
                borderRadius: 1,
                bgcolor: service.status === 'online' ? 'success.lighter' : 
                         service.status === 'degraded' ? 'warning.lighter' : 
                         'error.lighter'
              }}
            >
              <Avatar
                sx={{
                  bgcolor: `${getServiceStatusColor(service.status)}.main`,
                  width: 32,
                  height: 32,
                  mr: 2
                }}
              >
                <Iconify icon={getServiceStatusIcon(service.status)} width={16} />
              </Avatar>
              <Box sx={{ flexGrow: 1 }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                  <Typography variant="subtitle2">
                    {service.name}
                  </Typography>
                  <Chip
                    label={service.status}
                    size="small"
                    color={getServiceStatusColor(service.status) as any}
                  />
                  {service.version && (
                    <Chip
                      label={service.version}
                      size="small"
                      variant="outlined"
                    />
                  )}
                </Stack>
                <Stack direction="row" spacing={2}>
                  <Typography variant="caption" color="text.secondary">
                    Uptime: {service.uptime}%
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Response: {service.responseTime}ms
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Checked: {service.lastCheck}
                  </Typography>
                  {service.url && (
                    <Typography variant="caption" color="text.secondary">
                      {service.url}
                    </Typography>
                  )}
                </Stack>
              </Box>
            </Box>
          ))}
        </Stack>

        {/* System Information */}
        <Typography variant="h6" sx={{ mb: 2 }}>
          System Information
        </Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="primary.main">
                {systemInfo.serverUptime}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Server Uptime
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="info.main">
                {systemInfo.totalRequests.toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total Requests
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="success.main">
                {systemInfo.activeConnections}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Active Connections
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="warning.main">
                {systemInfo.errorRate}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Error Rate
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="primary.main">
                {systemInfo.dataProcessed}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Data Processed
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="success.main">
                {systemInfo.lastBackup}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Last Backup
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Quick Actions */}
        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Iconify icon="solar:chart-bold" />}
          >
            View Logs
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Iconify icon="solar:settings-bold" />}
          >
            System Config
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Iconify icon="solar:restart-bold" />}
          >
            Restart Services
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Iconify icon="solar:download-bold" />}
          >
            Download Report
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}