import { useState } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';
import Alert from '@mui/material/Alert';
import LinearProgress from '@mui/material/LinearProgress';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  type: 'primary' | 'secondary' | 'medical';
  available: boolean;
}

interface EmergencyService {
  name: string;
  phone: string;
  icon: string;
  color: string;
  description: string;
}

interface EmergencySOSWidgetProps {
  patientLocation?: string;
  emergencyContacts?: EmergencyContact[];
}

export function EmergencySOSWidget({ 
  patientLocation = 'Home',
  emergencyContacts = []
}: EmergencySOSWidgetProps) {
  const [sosDialogOpen, setSosDialogOpen] = useState(false);
  const [emergencyType, setEmergencyType] = useState<string | null>(null);
  const [isEmergencyActive, setIsEmergencyActive] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const defaultEmergencyContacts: EmergencyContact[] = [
    {
      id: '1',
      name: 'Dr. Sarah Johnson',
      relationship: 'Primary Surgeon',
      phone: '+1 (555) 123-4567',
      type: 'medical',
      available: true
    },
    {
      id: '2',
      name: 'John Smith',
      relationship: 'Emergency Contact',
      phone: '+1 (555) 987-6543',
      type: 'primary',
      available: true
    },
    {
      id: '3',
      name: 'Mary Smith',
      relationship: 'Spouse',
      phone: '+1 (555) 456-7890',
      type: 'primary',
      available: false
    },
    {
      id: '4',
      name: 'Hospital Nursing Station',
      relationship: 'Care Team',
      phone: '+1 (555) 111-2222',
      type: 'medical',
      available: true
    }
  ];

  const emergencyServices: EmergencyService[] = [
    {
      name: 'Emergency Services',
      phone: '911',
      icon: 'solar:siren-bold',
      color: 'error',
      description: 'Fire, Police, Ambulance'
    },
    {
      name: 'Poison Control',
      phone: '1-800-222-1222',
      icon: 'solar:medical-kit-bold',
      color: 'warning',
      description: 'Poison emergency hotline'
    },
    {
      name: 'Mental Health Crisis',
      phone: '988',
      icon: 'solar:heart-bold',
      color: 'info',
      description: 'Suicide & Crisis Lifeline'
    }
  ];

  const emergencyTypes = [
    { id: 'medical', label: 'Medical Emergency', icon: 'solar:heart-pulse-bold', color: 'error' },
    { id: 'fall', label: 'Fall/Accident', icon: 'solar:danger-bold', color: 'warning' },
    { id: 'chest_pain', label: 'Chest Pain', icon: 'solar:heart-broken-bold', color: 'error' },
    { id: 'breathing', label: 'Breathing Issues', icon: 'solar:lung-bold', color: 'error' },
    { id: 'severe_pain', label: 'Severe Pain', icon: 'solar:shield-warning-bold', color: 'warning' },
    { id: 'other', label: 'Other Emergency', icon: 'solar:danger-triangle-bold', color: 'error' }
  ];

  const contacts = emergencyContacts.length > 0 ? emergencyContacts : defaultEmergencyContacts;

  const handleSOSPress = () => {
    setSosDialogOpen(true);
  };

  const handleEmergencyTypeSelect = (type: string) => {
    setEmergencyType(type);
    setIsEmergencyActive(true);
    setSosDialogOpen(false);
    
    // Start countdown
    setCountdown(10);
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          handleEmergencyAlert();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleEmergencyAlert = () => {
    // In a real app, this would:
    // 1. Send location to emergency contacts
    // 2. Call emergency services
    // 3. Alert medical team
    // 4. Send push notifications
    console.log('Emergency alert sent!', {
      type: emergencyType,
      location: patientLocation,
      timestamp: new Date().toISOString()
    });

    // Simulate emergency response
    setTimeout(() => {
      setIsEmergencyActive(false);
      setEmergencyType(null);
      alert('Emergency services have been notified. Help is on the way.');
    }, 3000);
  };

  const handleCancelEmergency = () => {
    setIsEmergencyActive(false);
    setEmergencyType(null);
    setCountdown(0);
  };

  const getContactTypeColor = (type: EmergencyContact['type']) => {
    switch (type) {
      case 'medical':
        return 'success';
      case 'primary':
        return 'primary';
      case 'secondary':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <>
      <Card sx={{ border: '2px solid', borderColor: 'error.main' }}>
        <CardContent>
          <Typography variant="h6" color="error.main" sx={{ mb: 2 }}>
            Emergency SOS
          </Typography>

          {/* Active Emergency Alert */}
          {isEmergencyActive && (
            <Alert 
              severity="error" 
              sx={{ mb: 2, animation: 'pulse 1s infinite' }}
              action={
                <Button 
                  color="inherit" 
                  size="small" 
                  onClick={handleCancelEmergency}
                >
                  CANCEL
                </Button>
              }
            >
              <Typography variant="subtitle2">
                Emergency Alert Active
              </Typography>
              <Typography variant="body2">
                Notifying emergency contacts in {countdown} seconds...
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={(10 - countdown) / 10 * 100}
                color="error"
                sx={{ mt: 1 }}
              />
            </Alert>
          )}

          {/* SOS Button */}
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Button
              variant="contained"
              color="error"
              size="large"
              onClick={handleSOSPress}
              disabled={isEmergencyActive}
              sx={{
                width: 120,
                height: 120,
                borderRadius: '50%',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                boxShadow: 4,
                '&:hover': {
                  boxShadow: 6,
                  transform: 'scale(1.05)'
                }
              }}
            >
              <Stack alignItems="center">
                <Iconify icon="solar:siren-bold" width={40} />
                <Typography variant="h6" sx={{ mt: 1 }}>
                  SOS
                </Typography>
              </Stack>
            </Button>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Press for immediate emergency assistance
            </Typography>
          </Box>

          {/* Quick Emergency Services */}
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Emergency Services
          </Typography>
          <Stack spacing={1} sx={{ mb: 3 }}>
            {emergencyServices.map((service) => (
              <Box
                key={service.name}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  p: 1,
                  borderRadius: 1,
                  bgcolor: 'background.neutral'
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: `${service.color}.main`,
                    width: 32,
                    height: 32,
                    mr: 1.5
                  }}
                >
                  <Iconify icon={service.icon} width={16} />
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="body2" fontWeight="medium">
                    {service.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {service.description}
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  color={service.color as any}
                  size="small"
                  href={`tel:${service.phone}`}
                >
                  {service.phone}
                </Button>
              </Box>
            ))}
          </Stack>

          {/* Emergency Contacts */}
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Emergency Contacts
          </Typography>
          <List dense>
            {contacts.slice(0, 3).map((contact) => (
              <ListItem 
                key={contact.id}
                divider
                secondaryAction={
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip
                      label={contact.available ? 'Available' : 'Unavailable'}
                      size="small"
                      color={contact.available ? 'success' : 'default'}
                      variant="outlined"
                    />
                    <IconButton 
                      size="small" 
                      href={`tel:${contact.phone}`}
                      disabled={!contact.available}
                    >
                      <Iconify icon="solar:phone-bold" />
                    </IconButton>
                  </Stack>
                }
              >
                <ListItemAvatar>
                  <Avatar
                    sx={{
                      bgcolor: `${getContactTypeColor(contact.type)}.main`,
                      width: 32,
                      height: 32
                    }}
                  >
                    <Iconify 
                      icon={contact.type === 'medical' ? 'solar:medical-kit-bold' : 'solar:user-bold'} 
                      width={16}
                    />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={contact.name}
                  secondary={`${contact.relationship} • ${contact.phone}`}
                  primaryTypographyProps={{ variant: 'body2' }}
                  secondaryTypographyProps={{ variant: 'caption' }}
                />
              </ListItem>
            ))}
          </List>

          {/* Current Location */}
          <Box sx={{ mt: 2, p: 1.5, bgcolor: 'info.lighter', borderRadius: 1 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Iconify icon="solar:map-point-bold" color="info.main" />
              <Typography variant="body2" color="info.dark">
                Current location: {patientLocation}
              </Typography>
            </Stack>
          </Box>
        </CardContent>
      </Card>

      {/* Emergency Type Selection Dialog */}
      <Dialog 
        open={sosDialogOpen} 
        onClose={() => setSosDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Iconify icon="solar:danger-bold" color="error.main" />
            <Typography variant="h6" color="error.main">
              Select Emergency Type
            </Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Please select the type of emergency you're experiencing:
          </Typography>
          <Stack spacing={1}>
            {emergencyTypes.map((type) => (
              <Button
                key={type.id}
                variant="outlined"
                color={type.color as any}
                size="large"
                onClick={() => handleEmergencyTypeSelect(type.id)}
                startIcon={<Iconify icon={type.icon} />}
                sx={{ justifyContent: 'flex-start', p: 2 }}
              >
                {type.label}
              </Button>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSosDialogOpen(false)}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}