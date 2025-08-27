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
import Tooltip from '@mui/material/Tooltip';
import LinearProgress from '@mui/material/LinearProgress';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';
import Skeleton from '@mui/material/Skeleton';

import { Iconify } from 'src/components/iconify';
import thingSpeakService, { ThingSpeakChannel, SystemHealth } from 'src/services/thingspeak.service';

// ----------------------------------------------------------------------

interface ThingSpeakStatusWidgetProps {
  onRefresh?: () => void;
}

export function ThingSpeakStatusWidget({ onRefresh }: ThingSpeakStatusWidgetProps) {
  const [channels, setChannels] = useState<ThingSpeakChannel[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch dashboard data
  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [channelsData, systemHealthData] = await Promise.all([
        thingSpeakService.getAllChannels(),
        thingSpeakService.getSystemHealth()
      ]);
      
      setChannels(channelsData);
      setSystemHealth(systemHealthData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch ThingSpeak data');
      console.error('Error fetching ThingSpeak data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial data load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchData();
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Error during manual refresh:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Helper function to format time ago
  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hr ago`;
    return date.toLocaleDateString();
  };

  const getStatusColor = (status: ThingSpeakChannel['status']) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: ThingSpeakChannel['status']) => {
    switch (status) {
      case 'active':
        return 'solar:wifi-router-bold';
      case 'inactive':
        return 'solar:wifi-router-minimalistic-bold';
      case 'error':
        return 'solar:close-circle-bold';
      default:
        return 'solar:question-circle-bold';
    }
  };

  const activeChannels = channels.filter(c => c.status === 'active').length;
  const errorChannels = channels.filter(c => c.status === 'error').length;

  // Loading state
  if (loading) {
    return (
      <Card>
        <CardHeader
          title="ThingSpeak Integration Status"
          action={
            <CircularProgress size={20} />
          }
        />
        <CardContent>
          <Stack spacing={2}>
            <Skeleton variant="rectangular" width="100%" height={60} />
            <Skeleton variant="rectangular" width="100%" height={100} />
            <Skeleton variant="rectangular" width="100%" height={200} />
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
          title="ThingSpeak Integration Status"
          action={
            <Tooltip title="Retry">
              <IconButton onClick={handleRefresh} disabled={isRefreshing}>
                <Iconify icon="solar:refresh-bold" />
              </IconButton>
            </Tooltip>
          }
        />
        <CardContent>
          <Alert severity="error" action={
            <Button size="small" onClick={handleRefresh}>
              Retry
            </Button>
          }>
            <Typography variant="subtitle2">Failed to load ThingSpeak data</Typography>
            <Typography variant="body2">{error}</Typography>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title="ThingSpeak Integration Status"
        action={
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              label={systemHealth?.apiStatus === 'online' ? 'API Online' : 'API Offline'}
              color={systemHealth?.apiStatus === 'online' ? 'success' : 'error'}
              size="small"
              icon={<Iconify icon="solar:wifi-router-bold" />}
            />
            <Tooltip title="Refresh Data">
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
        {/* System Overview */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary.main">
                {systemHealth?.totalChannels || 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total Channels
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main">
                {systemHealth?.activeChannels || 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Active
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="error.main">
                {systemHealth?.errorChannels || 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Errors
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="info.main">
                {systemHealth?.responseTime || 0}ms
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Response Time
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Bandwidth Usage */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2">Bandwidth Usage</Typography>
            <Typography variant="body2" color="primary.main">
              {systemHealth?.bandwidth || 0}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={systemHealth?.bandwidth || 0}
            sx={{ height: 6, borderRadius: 3 }}
          />
        </Box>

        {/* Error Channels Alert */}
        {errorChannels > 0 && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="subtitle2">
              {errorChannels} channel(s) require attention
            </Typography>
            <Typography variant="body2">
              Patients may not be receiving proper monitoring. Check device connections and battery levels.
            </Typography>
          </Alert>
        )}

        {/* Individual Channels */}
        <Typography variant="h6" sx={{ mb: 2 }}>
          Recent Channel Activity
        </Typography>
        <List>
          {channels.slice(0, 5).map((channel) => (
            <ListItem key={channel.id} divider>
              <ListItemAvatar>
                <Avatar
                  sx={{
                    bgcolor: `${getStatusColor(channel.status)}.main`,
                    width: 40,
                    height: 40
                  }}
                >
                  <Iconify icon={getStatusIcon(channel.status)} width={20} />
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="subtitle2">
                      {channel.patientName}
                    </Typography>
                    <Chip
                      label={`Ch. ${channel.channelId}`}
                      size="small"
                      variant="outlined"
                    />
                  </Stack>
                }
                secondary={
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {channel.patientId} • Last update: {formatTimeAgo(channel.lastUpdate)}
                    </Typography>
                    {channel.status === 'active' && (
                      <Box sx={{ mt: 0.5 }}>
                        <Typography variant="caption">
                          HR: {Math.round(channel.currentValues.field1)} • 
                          BP: {Math.round(channel.currentValues.field2)}/{Math.round(channel.currentValues.field3)} • 
                          Temp: {channel.currentValues.field4.toFixed(1)}°F • 
                          SpO2: {Math.round(channel.currentValues.field5)}%
                        </Typography>
                      </Box>
                    )}
                    {channel.status === 'error' && (
                      <Box sx={{ mt: 0.5 }}>
                        <Typography variant="caption" color="error.main">
                          Battery: {channel.currentValues.field8 || 0}% • Device offline
                        </Typography>
                      </Box>
                    )}
                  </Box>
                }
              />
              <ListItemSecondaryAction>
                <Stack spacing={1} alignItems="center">
                  <Chip
                    label={channel.status}
                    size="small"
                    color={getStatusColor(channel.status) as any}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {channel.dataPoints.toLocaleString()} pts
                  </Typography>
                </Stack>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>

        {/* Quick Actions */}
        <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Iconify icon="solar:add-circle-bold" />}
          >
            Add Channel
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Iconify icon="solar:settings-bold" />}
          >
            Configure
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Iconify icon="solar:download-bold" />}
          >
            Export Data
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}