import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Skeleton from '@mui/material/Skeleton';
import Button from '@mui/material/Button';
import { DashboardContent } from 'src/layouts/dashboard';
import { useState, useEffect, useCallback } from 'react';

import { AnalyticsNews } from '../analytics-news';
import { AnalyticsTasks } from '../analytics-tasks';
import { AnalyticsCurrentVisits } from '../analytics-current-visits';
import { AnalyticsOrderTimeline } from '../analytics-order-timeline';
import { AnalyticsWebsiteVisits } from '../analytics-website-visits';
import { AnalyticsWidgetSummary } from '../analytics-widget-summary';
import { AnalyticsTrafficBySite } from '../analytics-traffic-by-site';
import { AnalyticsCurrentSubject } from '../analytics-current-subject';
import { AnalyticsConversionRates } from '../analytics-conversion-rates';
import { 
  ThingSpeakStatusWidget,
  CriticalAlertsWidget,
  SystemHealthWidget,
  MLAnomalyWidget
} from 'src/sections/admin/widgets';
import { Iconify } from 'src/components/iconify';
import dashboardService, { DashboardData } from 'src/services/dashboard.service';
import { setupDevAuth, checkDevAuth } from 'src/utils/devAuth';

// ----------------------------------------------------------------------

export function OverviewAnalyticsView() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      setError(null);
      
      // Check if authenticated, if not, try to setup dev auth
      if (!checkDevAuth()) {
        console.log('⚠️ Not authenticated, attempting dev login...');
        const authSuccess = await setupDevAuth();
        if (!authSuccess) {
          setError('Failed to authenticate. Please check your credentials.');
          setLoading(false);
          return;
        }
      }
      
      const data = await dashboardService.getDashboardData();
      setDashboardData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    
    // Start auto-refresh
    dashboardService.startAutoRefresh(30000);
    
    // Subscribe to updates
    const unsubscribe = dashboardService.subscribe((data) => {
      setDashboardData(data);
    });

    return () => {
      dashboardService.stopAutoRefresh();
      unsubscribe();
    };
  }, [fetchDashboardData]);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    try {
      await dashboardService.refreshData();
    } catch (err) {
      console.error('Manual refresh failed:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const quickStats = dashboardService.getQuickStats() || {
    totalPatients: 0,
    activeMonitoring: 0,
    systemUptime: 0,
    criticalAlerts: 0,
    systemHealth: 0
  };

  if (loading && !dashboardData) {
    return (
      <DashboardContent maxWidth="xl">
        <Box sx={{ mb: 5 }}>
          <Typography variant="h4" sx={{ mb: 1 }}>
            Curavia Super Admin Dashboard 👋
          </Typography>
          <Typography variant="body2" color="text.secondary">
            System overview and patient monitoring control center
          </Typography>
        </Box>

        <Stack spacing={3}>
          <Stack direction="row" spacing={1} alignItems="center">
            <CircularProgress size={20} />
            <Typography variant="body2" color="text.secondary">
              Loading dashboard data...
            </Typography>
          </Stack>
          
          <Grid container spacing={3}>
            {Array.from({ length: 4 }).map((_, index) => (
              <Grid key={index} size={{ xs: 12, sm: 6, md: 3 }}>
                <Skeleton variant="rectangular" width="100%" height={140} />
              </Grid>
            ))}
            <Grid size={{ xs: 12, lg: 6 }}>
              <Skeleton variant="rectangular" width="100%" height={300} />
            </Grid>
            <Grid size={{ xs: 12, lg: 6 }}>
              <Skeleton variant="rectangular" width="100%" height={300} />
            </Grid>
          </Grid>
        </Stack>
      </DashboardContent>
    );
  }

  if (error) {
    return (
      <DashboardContent maxWidth="xl">
        <Box sx={{ mb: 5 }}>
          <Typography variant="h4" sx={{ mb: 1 }}>
            Curavia Super Admin Dashboard 👋
          </Typography>
          <Typography variant="body2" color="text.secondary">
            System overview and patient monitoring control center
          </Typography>
        </Box>

        <Alert severity="error" action={
          <Button size="small" onClick={fetchDashboardData}>
            Retry
          </Button>
        }>
          <Typography variant="subtitle2">Failed to load dashboard</Typography>
          <Typography variant="body2">{error}</Typography>
        </Alert>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent maxWidth="xl">
      <Box sx={{ mb: 5 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h4" sx={{ mb: 1 }}>
              Curavia Super Admin Dashboard 👋
            </Typography>
            <Typography variant="body2" color="text.secondary">
              System overview and patient monitoring control center
            </Typography>
          </Box>
          <Button
            variant="outlined"
            size="small"
            onClick={handleManualRefresh}
            disabled={refreshing}
            startIcon={
              refreshing ? (
                <CircularProgress size={16} />
              ) : (
                <Iconify icon="solar:refresh-bold" />
              )
            }
          >
            Refresh
          </Button>
        </Stack>
      </Box>

      {/* System Status Alert */}
      <Alert 
        severity={dashboardData?.systemHealth.overall && dashboardData.systemHealth.overall > 80 ? "success" : "warning"}
        sx={{ mb: 3 }}
        icon={<Iconify icon="solar:shield-check-bold" />}
        action={
          <Stack direction="row" spacing={1}>
            <Chip 
              label={dashboardData?.systemHealth.overall && dashboardData.systemHealth.overall > 80 ? "Systems Healthy" : "Systems Degraded"} 
              size="small" 
              color={dashboardData?.systemHealth.overall && dashboardData.systemHealth.overall > 80 ? "success" : "warning"} 
            />
            <Chip 
              label={`${dashboardData?.thingspeak?.channels.summary.active || 0}/${dashboardData?.thingspeak?.channels.summary.total || 0} Channels Active`} 
              size="small" 
              color="info" 
            />
          </Stack>
        }
      >
        <Typography variant="subtitle2">
          System Status: {dashboardData?.systemHealth.overall && dashboardData.systemHealth.overall > 80 ? "Healthy" : "Requires Attention"}
        </Typography>
        <Typography variant="body2">
          {dashboardData?.thingspeak?.systemHealth?.apiStatus === 'online' 
            ? "All critical services operational. ThingSpeak API responding normally."
            : "Some services may be experiencing issues. Check system health panel."}
        </Typography>
      </Alert>

      <Grid container spacing={3}>
        {/* Top Row - Main Statistics */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AnalyticsWidgetSummary
            title="Total Patients"
            percent={8.2}
            total={quickStats.totalPatients}
            icon={<img alt="Total Patients" src="/assets/icons/glass/ic-glass-users.svg" />}
            chart={{
              categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
              series: [quickStats.totalPatients * 0.95, quickStats.totalPatients * 0.96, quickStats.totalPatients * 0.97, quickStats.totalPatients * 0.98, quickStats.totalPatients * 0.99, quickStats.totalPatients * 0.995, quickStats.totalPatients * 0.998, quickStats.totalPatients],
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AnalyticsWidgetSummary
            title="Active Monitoring"
            percent={5.4}
            total={quickStats.activeMonitoring}
            color="secondary"
            icon={<img alt="Active Patients" src="/assets/icons/glass/ic-glass-users.svg" />}
            chart={{
              categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
              series: [quickStats.activeMonitoring * 0.85, quickStats.activeMonitoring * 0.87, quickStats.activeMonitoring * 0.90, quickStats.activeMonitoring * 0.93, quickStats.activeMonitoring * 0.96, quickStats.activeMonitoring * 0.98, quickStats.activeMonitoring * 0.99, quickStats.activeMonitoring],
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AnalyticsWidgetSummary
            title="System Uptime"
            percent={0.1}
            total={quickStats.systemUptime}
            color="warning"
            icon={<img alt="System Health" src="/assets/icons/glass/ic-glass-buy.svg" />}
            chart={{
              categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
              series: [99.8, 99.9, 99.95, 99.92, 99.96, 99.98, 99.97, quickStats.systemUptime],
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AnalyticsWidgetSummary
            title="ThingSpeak Channels"
            percent={12.5}
            total={dashboardData?.thingspeak?.channels.summary.total || 0}
            color="success"
            icon={<img alt="ThingSpeak" src="/assets/icons/glass/ic-glass-message.svg" />}
            chart={{
              categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
              series: [
                (dashboardData?.thingspeak?.channels.summary.total || 0) * 0.77, 
                (dashboardData?.thingspeak?.channels.summary.total || 0) * 0.80, 
                (dashboardData?.thingspeak?.channels.summary.total || 0) * 0.87, 
                (dashboardData?.thingspeak?.channels.summary.total || 0) * 0.90, 
                (dashboardData?.thingspeak?.channels.summary.total || 0) * 0.93, 
                (dashboardData?.thingspeak?.channels.summary.total || 0) * 0.96, 
                (dashboardData?.thingspeak?.channels.summary.total || 0) * 0.99, 
                dashboardData?.thingspeak?.channels.summary.total || 0
              ],
            }}
          />
        </Grid>

        {/* ML Anomaly Detection - Top Priority */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <MLAnomalyWidget maxItems={6} />
        </Grid>

        {/* System Health Monitoring */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <SystemHealthWidget />
        </Grid>

        {/* Critical Alerts Widget */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <CriticalAlertsWidget />
        </Grid>

        {/* Patient Activity Trends */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <AnalyticsWebsiteVisits
            title="Patient Activity Trends"
            subheader="Real-time patient monitoring activity"
            chart={{
              categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
              series: [
                { name: 'Active Monitoring', data: [11800, 12000, 12100, 12150, 12200, 12250, 12300, 12334, 12400] },
                { name: 'Inactive Patients', data: [3200, 3300, 3350, 3400, 3450, 3480, 3500, 3513, 3520] },
                { name: 'New Registrations', data: [200, 250, 180, 220, 190, 240, 210, 189, 225] },
              ],
            }}
          />
        </Grid>

        {/* ThingSpeak Integration Status */}
        <Grid size={{ xs: 12 }}>
          <ThingSpeakStatusWidget />
        </Grid>

        {/* Patient Demographics */}
        <Grid size={{ xs: 12, md: 4 }}>
          <AnalyticsCurrentSubject
            title="Patient Demographics"
            chart={{
              categories: ['Age 18-30', 'Age 31-50', 'Age 51-70', 'Age 70+', 'Critical Care', 'Recovery'],
              series: [
                { name: 'Active Monitoring', data: [2500, 4200, 3800, 1834, 500, 11834] },
                { name: 'New This Month', data: [300, 450, 350, 147, 50, 1197] },
              ],
            }}
          />
        </Grid>

        {/* Surgery Types Distribution */}
        <Grid size={{ xs: 12, md: 6 }}>
          <AnalyticsCurrentVisits
            title="Surgery Types Distribution"
            chart={{
              series: [
                { label: 'Cardiac Surgery', value: 3245 },
                { label: 'Orthopedic Surgery', value: 2890 },
                { label: 'Neurological Surgery', value: 1876 },
                { label: 'Abdominal Surgery', value: 2234 },
                { label: 'Thoracic Surgery', value: 1456 },
                { label: 'Vascular Surgery', value: 987 },
                { label: 'General Surgery', value: 2359 },
                { label: 'Other', value: 800 },
              ],
            }}
          />
        </Grid>

        {/* System Performance Metrics */}
        <Grid size={{ xs: 12, md: 6 }}>
          <AnalyticsConversionRates
            title="API Performance Metrics"
            subheader="Response times and throughput"
            chart={{
              categories: ['ThingSpeak API', 'Database', 'Auth Service', 'ML Processing', 'Notifications'],
              series: [
                { name: 'Response Time (ms)', data: [245, 12, 89, 2340, 156] },
                { name: 'Success Rate (%)', data: [99.8, 99.9, 99.7, 97.2, 98.5] },
              ],
            }}
          />
        </Grid>

        {/* Recent System Activities */}
        <Grid size={{ xs: 12, md: 8 }}>
          <AnalyticsOrderTimeline 
            title="System Activities Timeline" 
            list={[
              {
                id: '1',
                title: 'New Patient Registration',
                description: '47 new patients registered today',
                time: '2 hours ago',
                type: 'order1'
              },
              {
                id: '2', 
                title: 'ThingSpeak Channel Created',
                description: 'Channel 2631237 created for patient CRV2024156',
                time: '4 hours ago',
                type: 'order2'
              },
              {
                id: '3',
                title: 'System Backup Completed',
                description: 'Daily backup completed successfully - 2.4TB',
                time: '6 hours ago',
                type: 'order3'
              },
              {
                id: '4',
                title: 'ML Model Updated',
                description: 'Recovery prediction model updated to v2.1',
                time: '1 day ago',
                type: 'order4'
              },
              {
                id: '5',
                title: 'Security Scan',
                description: 'Weekly security scan completed - no issues found',
                time: '2 days ago',
                type: 'order1'
              }
            ]} 
          />
        </Grid>

        {/* Quick Actions & System Management */}
        <Grid size={{ xs: 12, md: 4 }}>
          <AnalyticsTasks
            title="System Management"
            list={[
              { id: '1', name: 'Review Critical Alerts', checked: false },
              { id: '2', name: 'Update Patient Channel Mappings', checked: false },
              { id: '3', name: 'Monitor System Performance', checked: true },
              { id: '4', name: 'Backup Database', checked: true },
              { id: '5', name: 'Update ML Models', checked: false },
              { id: '6', name: 'Generate Monthly Report', checked: false },
            ]}
          />
        </Grid>
      </Grid>
    </DashboardContent>
  );
}