import { useState, useEffect } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import IconButton from '@mui/material/IconButton';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';

import { Iconify } from 'src/components/iconify';
import apiHelper from 'src/utils/apiHelper';

// ----------------------------------------------------------------------

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  nextDose: Date;
  timeUntil: string;
  taken: boolean;
  instructions?: string;
  color: 'primary' | 'warning' | 'error' | 'success';
  prescriptionId?: string;
  category?: string;
  sideEffects?: string[];
}

interface Prescription {
  _id: string;
  diagnosis: string;
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
  }>;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: string;
  validUntil: string;
  notes: string;
}

interface MedicineReminderWidgetProps {
  patientId?: string;
}

export function MedicineReminderWidget({ patientId }: MedicineReminderWidgetProps) {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Fetch prescriptions on mount
  useEffect(() => {
    if (patientId) {
      fetchPrescriptions();
    }
  }, [patientId]);

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      updateTimeUntil();
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const response = await apiHelper.get('/patient/prescriptions');
      
      if (response.success) {
        const activePrescriptions = response.data.prescriptions.filter(
          (p: Prescription) => p.status === 'active' && new Date(p.validUntil) > new Date()
        );
        setPrescriptions(activePrescriptions);
        
        // Convert prescriptions to medications with scheduling
        const allMedications = activePrescriptions.flatMap((prescription: Prescription) =>
          prescription.medications.map((med, index) => ({
            id: `${prescription._id}_${index}`,
            name: med.name,
            dosage: med.dosage,
            frequency: med.frequency,
            duration: med.duration,
            nextDose: calculateNextDose(med.frequency),
            timeUntil: '',
            taken: false,
            instructions: med.instructions,
            color: getColorByFrequency(med.frequency),
            prescriptionId: prescription._id,
            category: getCategoryFromName(med.name)
          }))
        );
        
        setMedications(allMedications);
      }
    } catch (err: any) {
      console.error('Failed to fetch prescriptions:', err);
      setError('Unable to load prescriptions');
      // Fallback to example data if API fails
      setMedications(getExampleMedications());
    } finally {
      setLoading(false);
    }
  };

  const calculateNextDose = (frequency: string): Date => {
    const now = new Date();
    const currentHour = now.getHours();
    
    // Simple logic for common frequencies
    if (frequency.toLowerCase().includes('once daily') || frequency.toLowerCase().includes('once a day')) {
      const nextDose = new Date(now);
      nextDose.setHours(9, 0, 0, 0); // 9 AM
      if (nextDose <= now) {
        nextDose.setDate(nextDose.getDate() + 1);
      }
      return nextDose;
    }
    
    if (frequency.toLowerCase().includes('twice daily') || frequency.toLowerCase().includes('twice a day')) {
      const nextDose = new Date(now);
      if (currentHour < 9) {
        nextDose.setHours(9, 0, 0, 0); // 9 AM
      } else if (currentHour < 21) {
        nextDose.setHours(21, 0, 0, 0); // 9 PM
      } else {
        nextDose.setDate(nextDose.getDate() + 1);
        nextDose.setHours(9, 0, 0, 0);
      }
      return nextDose;
    }
    
    if (frequency.toLowerCase().includes('every 6 hours')) {
      const nextDose = new Date(now);
      const nextHour = Math.ceil(currentHour / 6) * 6;
      nextDose.setHours(nextHour, 0, 0, 0);
      if (nextDose <= now) {
        nextDose.setHours(nextHour + 6, 0, 0, 0);
      }
      return nextDose;
    }
    
    if (frequency.toLowerCase().includes('every 8 hours')) {
      const nextDose = new Date(now);
      const nextHour = Math.ceil(currentHour / 8) * 8;
      nextDose.setHours(nextHour, 0, 0, 0);
      if (nextDose <= now) {
        nextDose.setHours(nextHour + 8, 0, 0, 0);
      }
      return nextDose;
    }
    
    // Default: next medication in 4 hours
    const nextDose = new Date(now.getTime() + 4 * 60 * 60 * 1000);
    return nextDose;
  };

  const getColorByFrequency = (frequency: string): 'primary' | 'warning' | 'error' | 'success' => {
    if (frequency.toLowerCase().includes('every 6 hours') || frequency.toLowerCase().includes('every 8 hours')) {
      return 'warning';
    }
    if (frequency.toLowerCase().includes('twice daily')) {
      return 'primary';
    }
    if (frequency.toLowerCase().includes('once daily')) {
      return 'success';
    }
    return 'primary';
  };

  const getCategoryFromName = (name: string): string => {
    const nameLower = name.toLowerCase();
    if (nameLower.includes('paracetamol') || nameLower.includes('crocin') || nameLower.includes('dolo')) {
      return 'Pain Relief';
    }
    if (nameLower.includes('amoxicillin') || nameLower.includes('azithromycin') || nameLower.includes('augmentin')) {
      return 'Antibiotic';
    }
    if (nameLower.includes('vitamin') || nameLower.includes('calcium')) {
      return 'Supplement';
    }
    if (nameLower.includes('antacid') || nameLower.includes('eno') || nameLower.includes('digene')) {
      return 'Digestive';
    }
    return 'Medicine';
  };

  const getExampleMedications = (): Medication[] => [
    {
      id: '1',
      name: 'Paracetamol',
      dosage: '500mg',
      frequency: 'Every 8 hours',
      duration: '5 days',
      nextDose: new Date(Date.now() + 2 * 60 * 60 * 1000),
      timeUntil: '2h 15m',
      taken: false,
      instructions: 'Take with food',
      color: 'warning',
      category: 'Pain Relief'
    },
    {
      id: '2',
      name: 'Amoxicillin',
      dosage: '500mg',
      frequency: 'Twice daily',
      duration: '7 days',
      nextDose: new Date(Date.now() + 4 * 60 * 60 * 1000),
      timeUntil: '4h 30m',
      taken: false,
      instructions: 'Complete full course',
      color: 'primary',
      category: 'Antibiotic'
    }
  ];

  const updateTimeUntil = () => {
    setMedications(prev => 
      prev.map(med => {
        const diff = med.nextDose.getTime() - Date.now();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        return {
          ...med,
          timeUntil: `${hours}h ${minutes.toString().padStart(2, '0')}m`,
          color: hours < 1 ? 'error' : hours < 2 ? 'warning' : med.color
        };
      })
    );
  };

  const handleTakeMedication = (medicationId: string) => {
    setMedications(prev =>
      prev.map(med =>
        med.id === medicationId
          ? { ...med, taken: true, color: 'success' }
          : med
      )
    );
  };

  const handleSetReminder = (medicationId: string) => {
    // In a real app, this would set a system notification
    alert(`Reminder set for ${medications.find(m => m.id === medicationId)?.name}`);
  };

  const nextMedication = medications
    .filter(med => !med.taken)
    .sort((a, b) => a.nextDose.getTime() - b.nextDose.getTime())[0];

  const overdueMedications = medications.filter(med => 
    !med.taken && med.nextDose.getTime() < Date.now()
  );

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
            <CircularProgress size={40} />
            <Typography variant="body2" sx={{ ml: 2 }}>Loading prescriptions...</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title="My Prescriptions"
        subheader={`${prescriptions.length} active prescription(s) • ${medications.length} medications`}
        avatar={
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            <Iconify icon="solar:pill-bold" />
          </Avatar>
        }
      />
      <CardContent>

        {overdueMedications.length > 0 && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="subtitle2">
              {overdueMedications.length} medication(s) overdue
            </Typography>
          </Alert>
        )}

        {/* Next Medication Highlight */}
        {nextMedication && (
          <Box
            sx={{
              p: 2,
              mb: 2,
              borderRadius: 2,
              bgcolor: nextMedication.color === 'error' ? 'error.lighter' : 'warning.lighter',
              border: '1px solid',
              borderColor: nextMedication.color === 'error' ? 'error.light' : 'warning.light'
            }}
          >
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar sx={{ bgcolor: `${nextMedication.color}.main` }}>
                <Iconify icon="solar:medical-kit-bold" />
              </Avatar>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="subtitle2">
                  {nextMedication.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {nextMedication.dosage} • {nextMedication.frequency}
                </Typography>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: nextMedication.color === 'error' ? 'error.main' : 'warning.main',
                    fontWeight: 'bold'
                  }}
                >
                  {nextMedication.nextDose.getTime() < Date.now() 
                    ? 'OVERDUE' 
                    : `Due in ${nextMedication.timeUntil}`
                  }
                </Typography>
              </Box>
              <Stack spacing={1}>
                <Button
                  variant="contained"
                  color={nextMedication.color}
                  size="small"
                  onClick={() => handleTakeMedication(nextMedication.id)}
                  startIcon={<Iconify icon="solar:check-circle-bold" />}
                >
                  Take Now
                </Button>
                <Button
                  variant="outlined"
                  color={nextMedication.color}
                  size="small"
                  onClick={() => handleSetReminder(nextMedication.id)}
                  startIcon={<Iconify icon="solar:bell-bold" />}
                >
                  Remind Me
                </Button>
              </Stack>
            </Stack>
            {nextMedication.instructions && (
              <Typography 
                variant="caption" 
                color="text.secondary" 
                sx={{ display: 'block', mt: 1, fontStyle: 'italic' }}
              >
                💡 {nextMedication.instructions}
              </Typography>
            )}
          </Box>
        )}

        {/* Prescriptions Section */}
        {prescriptions.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              📋 Active Prescriptions
            </Typography>
            {prescriptions.map((prescription, index) => (
              <Box key={prescription._id} sx={{ mb: 2 }}>
                <Paper sx={{ p: 2, bgcolor: 'grey.50', border: '1px solid', borderColor: 'grey.200' }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                      <Typography variant="body2" fontWeight="bold" color="primary">
                        {prescription.diagnosis}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Prescribed on {new Date(prescription.createdAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                    <Chip 
                      label={`Valid until ${new Date(prescription.validUntil).toLocaleDateString()}`}
                      size="small" 
                      color="success" 
                      variant="outlined" 
                    />
                  </Stack>
                  {prescription.notes && (
                    <Typography variant="caption" sx={{ mt: 1, display: 'block', fontStyle: 'italic' }}>
                      💡 {prescription.notes.split('\n')[0]}
                    </Typography>
                  )}
                </Paper>
                {index < prescriptions.length - 1 && <Divider sx={{ my: 1 }} />}
              </Box>
            ))}
          </Box>
        )}

        {/* All Medications List */}
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          📅 Today's Medication Schedule
        </Typography>
        <List dense>
          {medications.map((med) => (
            <ListItem key={med.id} divider>
              <ListItemAvatar>
                <Avatar 
                  sx={{ 
                    bgcolor: med.taken ? 'success.main' : `${med.color}.main`,
                    width: 32,
                    height: 32
                  }}
                >
                  <Iconify 
                    icon={med.taken ? 'solar:check-circle-bold' : 'solar:pill-bold'} 
                    width={16}
                  />
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography 
                      variant="body2"
                      sx={{
                        textDecoration: med.taken ? 'line-through' : 'none',
                        color: med.taken ? 'text.secondary' : 'text.primary'
                      }}
                    >
                      {med.name} ({med.dosage})
                    </Typography>
                    {med.category && (
                      <Chip 
                        label={med.category} 
                        size="small" 
                        color="info" 
                        variant="outlined" 
                        sx={{ fontSize: '0.65rem', height: 18 }}
                      />
                    )}
                    {med.taken && (
                      <Chip 
                        label="✓ Taken" 
                        size="small" 
                        color="success" 
                        variant="outlined" 
                      />
                    )}
                  </Box>
                }
                secondary={
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {med.taken 
                        ? 'Completed today'
                        : `⏰ ${med.nextDose.toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })} • ${med.frequency} • ${med.duration}`
                      }
                    </Typography>
                    {med.instructions && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontStyle: 'italic' }}>
                        💡 {med.instructions}
                      </Typography>
                    )}
                  </Box>
                }
              />
              {!med.taken && (
                <ListItemSecondaryAction>
                  <IconButton 
                    size="small" 
                    onClick={() => handleTakeMedication(med.id)}
                    color="primary"
                  >
                    <Iconify icon="solar:check-circle-bold" />
                  </IconButton>
                </ListItemSecondaryAction>
              )}
            </ListItem>
          ))}
        </List>

        {/* No Medications State */}
        {medications.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Avatar sx={{ width: 64, height: 64, mx: 'auto', mb: 2, bgcolor: 'grey.100' }}>
              <Iconify icon="solar:pill-bold" width={32} />
            </Avatar>
            <Typography variant="h6" color="text.secondary">
              No Active Prescriptions
            </Typography>
            <Typography variant="body2" color="text.secondary">
              You don't have any active prescriptions at the moment.
            </Typography>
            {error && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </Box>
        )}

        {/* Adherence Summary */}
        {medications.length > 0 && (
          <Box sx={{ mt: 2, p: 1.5, bgcolor: 'success.lighter', borderRadius: 1 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="caption" color="success.dark">
                📊 Today's adherence: {Math.round((medications.filter(m => m.taken).length / medications.length) * 100)}%
              </Typography>
              <Button 
                size="small" 
                variant="outlined" 
                onClick={fetchPrescriptions}
                sx={{ fontSize: '0.7rem', py: 0.5 }}
              >
                Refresh
              </Button>
            </Stack>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}