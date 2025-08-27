import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import LinearProgress from '@mui/material/LinearProgress';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Badge from '@mui/material/Badge';
import CircularProgress from '@mui/material/CircularProgress';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { Iconify } from 'src/components/iconify';
import apiHelper from 'src/utils/apiHelper';

// ----------------------------------------------------------------------

interface MLPrediction {
  patientId: string;
  patientName: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  predictions: {
    heartRateSpike: { probability: number; timeWindow: string; };
    bpSpike: { probability: number; timeWindow: string; };
    temperatureSpike: { probability: number; timeWindow: string; };
    oxygenDrop: { probability: number; timeWindow: string; };
  };
  recommendations: string[];
  lastAnalysis: string;
  confidence: number;
  anomalyTypes: string[];
  vitalTrends: {
    heartRate: 'stable' | 'increasing' | 'decreasing' | 'volatile';
    bloodPressure: 'stable' | 'increasing' | 'decreasing' | 'volatile';
    temperature: 'stable' | 'increasing' | 'decreasing' | 'volatile';
    spO2: 'stable' | 'increasing' | 'decreasing' | 'volatile';
  };
}

interface MLAnomalyWidgetProps {
  maxItems?: number;
}

export function MLAnomalyWidget({ maxItems = 8 }: MLAnomalyWidgetProps) {
  const [predictions, setPredictions] = useState<MLPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<MLPrediction | null>(null);
  const [detailDialog, setDetailDialog] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMLPredictions = async () => {
    try {
      setError(null);
      const response = await apiHelper.get('/ml/anomaly-predictions');
      
      if (response.success) {
        setPredictions(response.predictions || []);
      } else {
        throw new Error(response.message || 'Failed to fetch ML predictions');
      }
    } catch (err) {
      console.error('Error fetching ML predictions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch ML data');
      // Generate mock data for demonstration
      setPredictions(generateMockMLPredictions());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMLPredictions();
    
    // Refresh predictions every 2 minutes
    const interval = setInterval(fetchMLPredictions, 120000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMLPredictions();
    setRefreshing(false);
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      default: return 'success';
    }
  };

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return 'solar:danger-triangle-bold';
      case 'high': return 'solar:shield-warning-bold';
      case 'medium': return 'solar:info-circle-bold';
      default: return 'solar:shield-check-bold';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return 'solar:arrow-up-bold';
      case 'decreasing': return 'solar:arrow-down-bold';
      case 'volatile': return 'solar:pulse-bold';
      default: return 'solar:minus-bold';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'increasing': return 'warning.main';
      case 'decreasing': return 'error.main';
      case 'volatile': return 'error.main';
      default: return 'success.main';
    }
  };

  const criticalPatients = predictions.filter(p => p.riskLevel === 'critical').length;
  const highRiskPatients = predictions.filter(p => p.riskLevel === 'high').length;

  if (loading) {
    return (
      <Card>
        <CardHeader title="🤖 ML Anomaly Detection" />
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <CircularProgress />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Analyzing patient data patterns...
          </Typography>
        </Box>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader
          title="🤖 ML Anomaly Detection"
          subheader={`AI-powered risk assessment for ${predictions.length} patients`}
          action={
            <Stack direction="row" spacing={1} alignItems="center">
              <Badge badgeContent={criticalPatients} color="error">
                <Chip 
                  size="small" 
                  label={`${highRiskPatients} High Risk`}
                  color="warning"
                  variant="soft"
                />
              </Badge>
              <IconButton 
                size="small" 
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <Iconify 
                  icon={refreshing ? 'solar:loading-bold' : 'solar:refresh-bold'}
                  sx={{ 
                    animation: refreshing ? 'spin 1s linear infinite' : 'none',
                    '@keyframes spin': {
                      '0%': { transform: 'rotate(0deg)' },
                      '100%': { transform: 'rotate(360deg)' }
                    }
                  }}
                />
              </IconButton>
            </Stack>
          }
        />

        {error && (
          <Box sx={{ px: 3, pb: 2 }}>
            <Alert severity="warning" size="small">
              Using demo ML predictions. {error}
            </Alert>
          </Box>
        )}

        {predictions.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Iconify icon="solar:shield-check-bold" width={48} sx={{ color: 'success.main', mb: 2 }} />
            <Typography variant="h6">All Patients Stable</Typography>
            <Typography variant="body2" color="text.secondary">
              No anomalies detected by ML analysis
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {predictions.slice(0, maxItems).map((prediction, index) => (
              <Box key={prediction.patientId}>
                <ListItem
                  sx={{ 
                    py: 2, 
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover' }
                  }}
                  onClick={() => {
                    setSelectedPatient(prediction);
                    setDetailDialog(true);
                  }}
                >
                  <ListItemAvatar>
                    <Avatar 
                      sx={{ 
                        bgcolor: `${getRiskColor(prediction.riskLevel)}.main`,
                        color: 'white'
                      }}
                    >
                      <Iconify icon={getRiskIcon(prediction.riskLevel)} />
                    </Avatar>
                  </ListItemAvatar>
                  
                  <ListItemText
                    primary={
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography variant="subtitle2">
                          {prediction.patientName}
                        </Typography>
                        <Chip
                          size="small"
                          label={`${prediction.riskScore}% risk`}
                          color={getRiskColor(prediction.riskLevel) as any}
                          variant="soft"
                        />
                      </Stack>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {prediction.anomalyTypes.join(', ')}
                        </Typography>
                        <Box sx={{ mt: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={prediction.riskScore}
                            color={getRiskColor(prediction.riskLevel) as any}
                            sx={{ height: 6, borderRadius: 3 }}
                          />
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          Next spike risk: {prediction.lastAnalysis}
                        </Typography>
                      </Box>
                    }
                  />

                  <ListItemSecondaryAction>
                    <Stack alignItems="flex-end" spacing={0.5}>
                      <Typography variant="caption" color="text.secondary">
                        Confidence: {prediction.confidence}%
                      </Typography>
                      <Stack direction="row" spacing={0.5}>
                        {Object.entries(prediction.vitalTrends).slice(0, 3).map(([vital, trend]) => (
                          <Iconify
                            key={vital}
                            icon={getTrendIcon(trend)}
                            width={12}
                            sx={{ color: getTrendColor(trend) }}
                          />
                        ))}
                      </Stack>
                    </Stack>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < Math.min(predictions.length - 1, maxItems - 1) && <Divider />}
              </Box>
            ))}
          </List>
        )}

        {predictions.length > maxItems && (
          <Box sx={{ p: 2, textAlign: 'center', borderTop: 1, borderColor: 'divider' }}>
            <Button size="small" variant="text">
              View {predictions.length - maxItems} More Predictions
            </Button>
          </Box>
        )}
      </Card>

      {/* Patient Detail Dialog */}
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
                bgcolor: `${getRiskColor(selectedPatient?.riskLevel || 'low')}.main`,
                color: 'white'
              }}
            >
              <Iconify icon={getRiskIcon(selectedPatient?.riskLevel || 'low')} />
            </Avatar>
            <Box>
              <Typography variant="h6">{selectedPatient?.patientName}</Typography>
              <Typography variant="body2" color="text.secondary">
                ML Risk Analysis - {selectedPatient?.riskLevel.toUpperCase()} RISK
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>

        <DialogContent>
          {selectedPatient && (
            <Stack spacing={3}>
              <Alert 
                severity={getRiskColor(selectedPatient.riskLevel) === 'error' ? 'error' : 'warning'}
                icon={<Iconify icon="solar:danger-triangle-bold" />}
              >
                <Typography variant="subtitle2">
                  Risk Score: {selectedPatient.riskScore}% ({selectedPatient.confidence}% confidence)
                </Typography>
                <Typography variant="body2">
                  Anomaly types detected: {selectedPatient.anomalyTypes.join(', ')}
                </Typography>
              </Alert>

              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Predicted Spike Probabilities
                </Typography>
                <Stack spacing={2}>
                  {Object.entries(selectedPatient.predictions).map(([type, pred]) => (
                    <Box key={type}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2">
                          {type.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {Math.round(pred.probability)}% in {pred.timeWindow}
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={pred.probability}
                        color={pred.probability > 70 ? 'error' : pred.probability > 40 ? 'warning' : 'success'}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>
                  ))}
                </Stack>
              </Box>

              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Vital Sign Trends
                </Typography>
                <Stack direction="row" spacing={2} flexWrap="wrap">
                  {Object.entries(selectedPatient.vitalTrends).map(([vital, trend]) => (
                    <Chip
                      key={vital}
                      size="small"
                      label={`${vital}: ${trend}`}
                      color={trend === 'stable' ? 'success' : 'warning'}
                      variant="soft"
                      icon={<Iconify icon={getTrendIcon(trend)} />}
                    />
                  ))}
                </Stack>
              </Box>

              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  AI Recommendations
                </Typography>
                <List dense>
                  {selectedPatient.recommendations.map((rec, index) => (
                    <ListItem key={index} sx={{ py: 0.5 }}>
                      <ListItemAvatar sx={{ minWidth: 32 }}>
                        <Iconify icon="solar:check-circle-bold" width={16} sx={{ color: 'success.main' }} />
                      </ListItemAvatar>
                      <ListItemText 
                        primary={<Typography variant="body2">{rec}</Typography>}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>

              <Typography variant="caption" color="text.secondary">
                Last Analysis: {selectedPatient.lastAnalysis} | Model Version: v2.1.3
              </Typography>
            </Stack>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setDetailDialog(false)}>Close</Button>
          <Button variant="outlined" startIcon={<Iconify icon="solar:bell-bold" />}>
            Create Alert
          </Button>
          <Button variant="contained" startIcon={<Iconify icon="solar:user-bold" />}>
            Contact Patient
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

// Generate mock ML predictions for demonstration
function generateMockMLPredictions(): MLPrediction[] {
  const names = ['John Smith', 'Sarah Johnson', 'Michael Chen', 'Emily Davis', 'Robert Wilson', 'Lisa Anderson', 'David Brown', 'Jennifer Taylor'];
  const anomalyTypes = [
    ['Heart Rate Irregularity', 'Stress Indicators'],
    ['Blood Pressure Volatility', 'Dehydration Signs'],
    ['Temperature Fluctuations', 'Infection Risk'],
    ['Oxygen Saturation Drops', 'Respiratory Issues'],
    ['Cardiac Rhythm Changes', 'Medication Effects'],
    ['Blood Sugar Spikes', 'Dietary Issues'],
    ['Sleep Pattern Disruption', 'Recovery Delays']
  ];

  const recommendations = [
    'Increase monitoring frequency to every 15 minutes',
    'Consider medication adjustment consultation',
    'Schedule immediate physician review',
    'Implement hydration protocol',
    'Monitor for signs of infection',
    'Consider stress management intervention',
    'Adjust activity level restrictions',
    'Review current medications for interactions'
  ];

  return names.slice(0, 6).map((name, index) => {
    const riskLevels: ('low' | 'medium' | 'high' | 'critical')[] = ['critical', 'high', 'high', 'medium', 'medium', 'low'];
    const riskLevel = riskLevels[index];
    const riskScore = riskLevel === 'critical' ? 85 + Math.random() * 10 : 
                    riskLevel === 'high' ? 65 + Math.random() * 15 :
                    riskLevel === 'medium' ? 35 + Math.random() * 25 : 15 + Math.random() * 15;

    return {
      patientId: `CRV2024${String(index + 100).padStart(3, '0')}`,
      patientName: name,
      riskLevel,
      riskScore: Math.round(riskScore),
      predictions: {
        heartRateSpike: { 
          probability: Math.round(60 + Math.random() * 35), 
          timeWindow: '2-4 hours'
        },
        bpSpike: { 
          probability: Math.round(40 + Math.random() * 45), 
          timeWindow: '1-3 hours'
        },
        temperatureSpike: { 
          probability: Math.round(20 + Math.random() * 30), 
          timeWindow: '4-8 hours'
        },
        oxygenDrop: { 
          probability: Math.round(25 + Math.random() * 35), 
          timeWindow: '1-2 hours'
        }
      },
      recommendations: recommendations.slice(0, 2 + Math.floor(Math.random() * 3)),
      lastAnalysis: `${Math.floor(Math.random() * 30) + 5} minutes ago`,
      confidence: Math.round(82 + Math.random() * 15),
      anomalyTypes: anomalyTypes[index] || ['General Risk Factors'],
      vitalTrends: {
        heartRate: (['stable', 'increasing', 'volatile', 'decreasing'] as const)[Math.floor(Math.random() * 4)],
        bloodPressure: (['stable', 'increasing', 'volatile'] as const)[Math.floor(Math.random() * 3)],
        temperature: (['stable', 'increasing', 'decreasing'] as const)[Math.floor(Math.random() * 3)],
        spO2: (['stable', 'decreasing', 'volatile'] as const)[Math.floor(Math.random() * 3)]
      }
    };
  });
}