import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import MenuItem from '@mui/material/MenuItem';
import Chip from '@mui/material/Chip';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Alert from '@mui/material/Alert';
import LinearProgress from '@mui/material/LinearProgress';
import CircularProgress from '@mui/material/CircularProgress';
import CardHeader from '@mui/material/CardHeader';

import { DashboardContent } from 'src/layouts/dashboard';
import { Iconify } from 'src/components/iconify';
import apiHelper from 'src/utils/apiHelper';
import { setupDevAuth, checkDevAuth } from 'src/utils/devAuth';

// Import chart components
import { Chart, useChart } from 'src/components/chart';

// ----------------------------------------------------------------------

const REPORT_TYPES = ['All', 'Medical', 'Technical', 'Operational', 'Financial', 'Compliance'];
const TIME_RANGES = [
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 3 Months' },
  { value: '1y', label: 'Last Year' },
  { value: 'custom', label: 'Custom Range' }
];

const REPORT_TEMPLATES = [
  {
    name: 'Patient Recovery Analysis',
    description: 'Detailed analysis of patient recovery patterns and outcomes',
    category: 'Medical',
    estimatedTime: '5-10 minutes'
  },
  {
    name: 'System Performance Report',
    description: 'Technical performance metrics and system health status',
    category: 'Technical',
    estimatedTime: '3-5 minutes'
  },
  {
    name: 'Emergency Response Analytics',
    description: 'Emergency alert response times and effectiveness analysis',
    category: 'Operational',
    estimatedTime: '8-12 minutes'
  },
  {
    name: 'HIPAA Compliance Report',
    description: 'Security and privacy compliance audit report',
    category: 'Compliance',
    estimatedTime: '10-15 minutes'
  },
  {
    name: 'Revenue Analytics',
    description: 'Financial performance and subscription analytics',
    category: 'Financial',
    estimatedTime: '5-8 minutes'
  }
];

// ----------------------------------------------------------------------

export function ReportsAnalyticsView() {
  const [filterType, setFilterType] = useState('All');
  const [timeRange, setTimeRange] = useState('30d');
  const [generateDialog, setGenerateDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reports, setReports] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [viewDialog, setViewDialog] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [reportConfig, setReportConfig] = useState({
    includeCharts: true,
    includeRawData: false,
    sendEmail: true,
    emailRecipients: ['admin@curavia.com']
  });

  // Fetch reports data
  const fetchReportsData = useCallback(async () => {
    try {
      setError('');
      
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
      
      // Fetch reports and analytics
      const [reportsResponse, analyticsResponse] = await Promise.all([
        apiHelper.get('/report/admin/dashboard-reports', { 
          params: { limit: 20, type: filterType.toLowerCase(), timeRange } 
        }),
        apiHelper.get('/report/admin/analytics', { 
          params: { timeRange } 
        })
      ]);
      
      if (reportsResponse.success) {
        setReports(reportsResponse.reports || []);
      }
      
      if (analyticsResponse.success) {
        setAnalytics(analyticsResponse.analytics);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch reports data');
      console.error('Error fetching reports data:', err);
    } finally {
      setLoading(false);
    }
  }, [filterType, timeRange]);

  useEffect(() => {
    fetchReportsData();
  }, [fetchReportsData]);

  // Filter reports
  const filteredReports = reports.filter((report) => {
    return filterType === 'All' || report.type === filterType;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'generating': return 'warning';
      case 'scheduled': return 'info';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  const handleGenerateReport = async () => {
    if (!selectedTemplate) return;
    
    setGenerating(true);
    try {
      const response = await apiHelper.post('/report/admin/generate', {
        reportType: selectedTemplate.name,
        timeRange,
        includeCharts: reportConfig.includeCharts,
        includeRawData: reportConfig.includeRawData,
        emailRecipients: reportConfig.sendEmail ? reportConfig.emailRecipients : []
      });
      
      if (response.success) {
        // Refresh reports list
        await fetchReportsData();
        setGenerateDialog(false);
        setSelectedTemplate(null);
      } else {
        throw new Error(response.message || 'Failed to generate report');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const handleViewReport = async (report: any) => {
    setSelectedReport(report);
    setLoadingReport(true);
    setViewDialog(true);
    
    try {
      const response = await apiHelper.get(`/report/${report.id}`);
      if (response.success) {
        setReportData(response.report);
      } else {
        throw new Error(response.message || 'Failed to fetch report data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load report');
      setReportData(null);
    } finally {
      setLoadingReport(false);
    }
  };

  const handleDownloadReport = async (report: any, format = 'json') => {
    try {
      // Create download link
      const token = localStorage.getItem('token');
      const url = `${process.env.VITE_API_URL || 'http://localhost:4000/api'}/report/${report.id}/download?format=${format}`;
      
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', ''); // This will use the filename from the server
      link.style.display = 'none';
      
      // Add authorization header by fetching the file first
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Download failed');
      }
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      
      link.href = downloadUrl;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download report');
    }
  };

  const handleShareReport = (report: any) => {
    // Copy report URL to clipboard
    const reportUrl = `${window.location.origin}/admin/reports/${report.id}`;
    navigator.clipboard.writeText(reportUrl).then(() => {
      // You could add a toast notification here
      console.log('Report URL copied to clipboard');
    });
  };

  // Mock analytics data for charts
  const reportTrendsData = {
    categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    series: [
      { name: 'Medical Reports', data: [12, 15, 18, 14, 20, 16] },
      { name: 'Technical Reports', data: [8, 10, 12, 9, 14, 11] },
      { name: 'Financial Reports', data: [4, 6, 5, 7, 6, 8] }
    ]
  };

  const chartOptions = useChart({
    xaxis: { categories: reportTrendsData.categories },
    stroke: { width: 3 },
    markers: { size: 4 }
  });

  if (loading) {
    return (
      <DashboardContent>
        <Box sx={{ mb: 5 }}>
          <Typography variant="h4" sx={{ mb: 1 }}>
            Reports & Analytics 📊
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Comprehensive system and medical reporting dashboard
          </Typography>
        </Box>

        <Stack spacing={3}>
          <Stack direction="row" spacing={1} alignItems="center">
            <CircularProgress size={20} />
            <Typography variant="body2" color="text.secondary">
              Loading reports data...
            </Typography>
          </Stack>
          
          <Grid container spacing={3}>
            {Array.from({ length: 4 }).map((_, index) => (
              <Grid key={index} xs={12} sm={6} md={3}>
                <Card sx={{ p: 3 }}>
                  <CircularProgress size={24} />
                </Card>
              </Grid>
            ))}
          </Grid>
        </Stack>
      </DashboardContent>
    );
  }

  if (error) {
    return (
      <DashboardContent>
        <Box sx={{ mb: 5 }}>
          <Typography variant="h4" sx={{ mb: 1 }}>
            Reports & Analytics 📊
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Comprehensive system and medical reporting dashboard
          </Typography>
        </Box>

        <Alert severity="error" action={
          <Button size="small" onClick={fetchReportsData}>
            Retry
          </Button>
        }>
          <Typography variant="subtitle2">Failed to load reports data</Typography>
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
            Reports & Analytics 📊
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Comprehensive system and medical reporting dashboard
          </Typography>
        </Box>
        <Button
          variant="outlined"
          size="small"
          onClick={fetchReportsData}
          disabled={loading}
          startIcon={<Iconify icon="solar:refresh-bold" />}
        >
          Refresh
        </Button>
      </Stack>

      {/* Analytics Overview */}
      <Grid container spacing={3} sx={{ mb: 5 }}>
        <Grid xs={12} sm={6} md={3}>
          <Card sx={{ py: 3, textAlign: 'center' }}>
            <Typography variant="h3" color="primary.main">
              {analytics?.totalReports?.total || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Reports
            </Typography>
          </Card>
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <Card sx={{ py: 3, textAlign: 'center' }}>
            <Typography variant="h3" color="success.main">
              {reports.filter(r => r.status === 'completed').length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Completed
            </Typography>
          </Card>
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <Card sx={{ py: 3, textAlign: 'center' }}>
            <Typography variant="h3" color="warning.main">
              {analytics?.totalPatients?.active || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Active Patients
            </Typography>
          </Card>
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <Card sx={{ py: 3, textAlign: 'center' }}>
            <Typography variant="h3" color="info.main">
              {Math.round(analytics?.systemHealth?.healthScore || 0)}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              System Health
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* System Analytics Cards */}
      <Grid container spacing={3} sx={{ mb: 5 }}>
        <Grid xs={12} md={6}>
          <Card sx={{ p: 3 }}>
            <CardHeader title="📈 ML Insights" subheader="AI/ML model performance metrics" />
            <Stack spacing={2}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">Model Accuracy</Typography>
                <Typography variant="body2" color="success.main">
                  {analytics?.mlInsights?.accuracy || 0}%
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">Anomalies Detected</Typography>
                <Typography variant="body2" color="warning.main">
                  {analytics?.mlInsights?.anomaliesDetected || 0}
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">Total Predictions</Typography>
                <Typography variant="body2">
                  {analytics?.mlInsights?.totalPredictions || 0}
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">Model Version</Typography>
                <Chip size="small" label={analytics?.mlInsights?.modelVersion || 'v2.1.3'} />
              </Stack>
            </Stack>
          </Card>
        </Grid>

        <Grid xs={12} md={6}>
          <Card sx={{ p: 3 }}>
            <CardHeader title="🚨 Alert Analytics" subheader="Emergency response and alert metrics" />
            <Stack spacing={2}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">Total Alerts</Typography>
                <Typography variant="body2">
                  {analytics?.alertAnalytics?.total || 0}
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">Critical Alerts</Typography>
                <Typography variant="body2" color="error.main">
                  {analytics?.alertAnalytics?.severityBreakdown?.critical || 0}
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">Resolved</Typography>
                <Typography variant="body2" color="success.main">
                  {analytics?.alertAnalytics?.resolved || 0}
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">Avg Resolution Time</Typography>
                <Typography variant="body2">
                  {analytics?.alertAnalytics?.averageResolutionTime || 0} min
                </Typography>
              </Stack>
            </Stack>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Report Templates */}
        <Grid xs={12} lg={4}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Generate New Report
            </Typography>
            <List>
              {REPORT_TEMPLATES.map((template, index) => (
                <Box key={index}>
                  <ListItem
                    sx={{ px: 0, cursor: 'pointer' }}
                    onClick={() => {
                      setSelectedTemplate(template);
                      setGenerateDialog(true);
                    }}
                  >
                    <ListItemIcon>
                      <Iconify icon="solar:document-text-bold" />
                    </ListItemIcon>
                    <ListItemText
                      primary={template.name}
                      secondary={template.description}
                    />
                    <ListItemSecondaryAction>
                      <Chip size="small" label={template.category} variant="soft" />
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < REPORT_TEMPLATES.length - 1 && <Divider />}
                </Box>
              ))}
            </List>
          </Card>
        </Grid>

        {/* Recent Reports & Analytics */}
        <Grid xs={12} lg={8}>
          {/* Report Trends Chart */}
          <Card sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Report Generation Trends
            </Typography>
            <Chart
              type="line"
              series={reportTrendsData.series}
              options={chartOptions}
              height={300}
            />
          </Card>

          {/* Recent Reports List */}
          <Card sx={{ p: 3 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
              <Typography variant="h6">Recent Reports</Typography>
              <Stack direction="row" spacing={2}>
                <TextField
                  select
                  size="small"
                  label="Type"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  sx={{ minWidth: 120 }}
                >
                  {REPORT_TYPES.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  size="small"
                  label="Time Range"
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  sx={{ minWidth: 140 }}
                >
                  {TIME_RANGES.map((range) => (
                    <MenuItem key={range.value} value={range.value}>
                      {range.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Stack>
            </Stack>

            {filteredReports.length === 0 ? (
              <Box sx={{ py: 5, textAlign: 'center' }}>
                <Iconify icon="solar:document-text-bold" width={48} sx={{ color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">No reports found</Typography>
                <Typography variant="body2" color="text.secondary">
                  Generate your first report using the templates on the left
                </Typography>
              </Box>
            ) : (
              <List>
                {filteredReports.map((report, index) => (
                  <Box key={report.id}>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon>
                        <Iconify 
                          icon={
                            report.format === 'PDF' ? 'solar:file-text-bold' : 'solar:document-bold'
                          } 
                          sx={{ color: 'primary.main' }}
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Stack direction="row" alignItems="center" spacing={2}>
                            <Typography variant="subtitle2">{report.name}</Typography>
                            <Chip
                              size="small"
                              label={report.status}
                              color={getStatusColor(report.status) as any}
                              variant="soft"
                            />
                          </Stack>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {report.description}
                            </Typography>
                            <Stack direction="row" spacing={2} sx={{ mt: 0.5 }}>
                              <Typography variant="caption" color="text.secondary">
                                Created by {report.createdBy}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Size: {report.size}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {new Date(report.createdAt).toLocaleDateString()}
                              </Typography>
                              {report.patient && (
                                <Typography variant="caption" color="primary.main">
                                  Patient: {report.patient.name}
                                </Typography>
                              )}
                            </Stack>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Stack direction="row" spacing={1}>
                          <IconButton 
                            size="small" 
                            title="Download JSON"
                            onClick={() => handleDownloadReport(report, 'json')}
                          >
                            <Iconify icon="solar:download-bold" />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            title="Download CSV"
                            onClick={() => handleDownloadReport(report, 'csv')}
                          >
                            <Iconify icon="solar:document-bold" />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            title="Share Report"
                            onClick={() => handleShareReport(report)}
                          >
                            <Iconify icon="solar:share-bold" />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            title="View Report"
                            onClick={() => handleViewReport(report)}
                          >
                            <Iconify icon="solar:eye-bold" />
                          </IconButton>
                        </Stack>
                      </ListItemSecondaryAction>
                    </ListItem>
                    {index < filteredReports.length - 1 && <Divider />}
                  </Box>
                ))}
              </List>
            )}
          </Card>
        </Grid>
      </Grid>

      {/* Generate Report Dialog */}
      <Dialog open={generateDialog} onClose={() => setGenerateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Generate Report: {selectedTemplate?.name}
        </DialogTitle>
        <DialogContent>
          {generating ? (
            <Stack spacing={2} sx={{ py: 3 }}>
              <LinearProgress />
              <Typography variant="body2" color="text.secondary" align="center">
                Generating report... This may take {selectedTemplate?.estimatedTime}
              </Typography>
            </Stack>
          ) : (
            <Stack spacing={3} sx={{ pt: 2 }}>
              <Alert severity="info">
                {selectedTemplate?.description}
              </Alert>

              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Report Configuration
                </Typography>
                <Stack spacing={1}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={reportConfig.includeCharts}
                        onChange={(e) => setReportConfig({...reportConfig, includeCharts: e.target.checked})}
                      />
                    }
                    label="Include charts and visualizations"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={reportConfig.includeRawData}
                        onChange={(e) => setReportConfig({...reportConfig, includeRawData: e.target.checked})}
                      />
                    }
                    label="Include raw data tables"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={reportConfig.sendEmail}
                        onChange={(e) => setReportConfig({...reportConfig, sendEmail: e.target.checked})}
                      />
                    }
                    label="Email report when completed"
                  />
                </Stack>
              </Box>

              <TextField
                select
                fullWidth
                label="Time Range"
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
              >
                {TIME_RANGES.map((range) => (
                  <MenuItem key={range.value} value={range.value}>
                    {range.label}
                  </MenuItem>
                ))}
              </TextField>

              {reportConfig.sendEmail && (
                <TextField
                  fullWidth
                  label="Email Recipients"
                  value={reportConfig.emailRecipients.join(', ')}
                  onChange={(e) => setReportConfig({
                    ...reportConfig, 
                    emailRecipients: e.target.value.split(', ')
                  })}
                  helperText="Separate multiple emails with commas"
                />
              )}

              <Typography variant="body2" color="text.secondary">
                Estimated generation time: {selectedTemplate?.estimatedTime}
              </Typography>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          {!generating && (
            <>
              <Button onClick={() => setGenerateDialog(false)}>Cancel</Button>
              <Button 
                variant="contained" 
                onClick={handleGenerateReport}
                startIcon={<Iconify icon="solar:play-bold" />}
              >
                Generate Report
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Report Viewing Dialog */}
      <Dialog 
        open={viewDialog} 
        onClose={() => setViewDialog(false)} 
        maxWidth="lg" 
        fullWidth
        scroll="paper"
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Box>
              <Typography variant="h6">
                {selectedReport?.name || 'Report Details'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Generated: {selectedReport ? new Date(selectedReport.createdAt).toLocaleString() : 'N/A'}
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Button
                size="small"
                variant="outlined"
                startIcon={<Iconify icon="solar:download-bold" />}
                onClick={() => selectedReport && handleDownloadReport(selectedReport, 'json')}
              >
                JSON
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<Iconify icon="solar:document-bold" />}
                onClick={() => selectedReport && handleDownloadReport(selectedReport, 'csv')}
              >
                CSV
              </Button>
            </Stack>
          </Stack>
        </DialogTitle>

        <DialogContent>
          {loadingReport ? (
            <Box sx={{ py: 5, textAlign: 'center' }}>
              <CircularProgress />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Loading report data...
              </Typography>
            </Box>
          ) : reportData ? (
            <Stack spacing={3}>
              {/* Report Metadata */}
              <Card sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Report Information</Typography>
                <Grid container spacing={2}>
                  <Grid xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Report Type</Typography>
                    <Typography variant="body1">{reportData.type || 'N/A'}</Typography>
                  </Grid>
                  <Grid xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Generated By</Typography>
                    <Typography variant="body1">{reportData.generatedBy?.name || 'System'}</Typography>
                  </Grid>
                  {reportData.period && (
                    <>
                      <Grid xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">Period Start</Typography>
                        <Typography variant="body1">
                          {new Date(reportData.period.startDate).toLocaleDateString()}
                        </Typography>
                      </Grid>
                      <Grid xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">Period End</Typography>
                        <Typography variant="body1">
                          {new Date(reportData.period.endDate).toLocaleDateString()}
                        </Typography>
                      </Grid>
                    </>
                  )}
                </Grid>
              </Card>

              {/* Report Data */}
              {reportData.data && (
                <Card sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>Report Data</Typography>
                  
                  {/* Summary Section */}
                  {reportData.data.summary && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle1" gutterBottom>Summary</Typography>
                      <Grid container spacing={2}>
                        {Object.entries(reportData.data.summary).map(([key, value]) => (
                          <Grid xs={12} sm={6} md={4} key={key}>
                            <Box sx={{ p: 2, bgcolor: 'background.neutral', borderRadius: 1 }}>
                              <Typography variant="body2" color="text.secondary">
                                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                              </Typography>
                              <Typography variant="h6">
                                {typeof value === 'number' ? 
                                  (key.includes('Rate') || key.includes('Progress') ? `${value}%` : value) : 
                                  String(value)
                                }
                              </Typography>
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  )}

                  {/* Charts Section */}
                  {reportData.data.charts && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle1" gutterBottom>Charts & Visualizations</Typography>
                      <Alert severity="info">
                        Chart data is available in the downloaded report files
                      </Alert>
                    </Box>
                  )}

                  {/* Raw Data Preview */}
                  <Box>
                    <Typography variant="subtitle1" gutterBottom>Raw Data (Preview)</Typography>
                    <Box 
                      sx={{ 
                        p: 2, 
                        bgcolor: 'grey.100', 
                        borderRadius: 1,
                        maxHeight: 400,
                        overflow: 'auto',
                        fontFamily: 'monospace',
                        fontSize: '0.75rem'
                      }}
                    >
                      <pre>{JSON.stringify(reportData.data, null, 2)}</pre>
                    </Box>
                  </Box>
                </Card>
              )}
            </Stack>
          ) : (
            <Box sx={{ py: 5, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary">
                Failed to load report data
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Please try refreshing or contact support if the issue persists.
              </Typography>
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setViewDialog(false)}>Close</Button>
          {selectedReport && (
            <Button 
              variant="contained" 
              startIcon={<Iconify icon="solar:share-bold" />}
              onClick={() => handleShareReport(selectedReport)}
            >
              Share Report
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </DashboardContent>
  );
}