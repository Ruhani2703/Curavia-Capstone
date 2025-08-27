import { useState } from 'react';
import { useRouter } from 'src/routes/hooks';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Alert from '@mui/material/Alert';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import InputAdornment from '@mui/material/InputAdornment';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';

import { Iconify } from 'src/components/iconify';
import { API_ENDPOINTS, apiRequest, authHelper } from 'src/config/api';

// ----------------------------------------------------------------------

const SURGERY_TYPES = [
  { value: 'Cardiac Surgery', label: 'Cardiac Surgery' },
  { value: 'Orthopedic Surgery', label: 'Orthopedic Surgery' },
  { value: 'Neurological Surgery', label: 'Neurological Surgery' },
  { value: 'Abdominal Surgery', label: 'Abdominal Surgery' },
  { value: 'Thoracic Surgery', label: 'Thoracic Surgery' },
  { value: 'Vascular Surgery', label: 'Vascular Surgery' },
  { value: 'Transplant Surgery', label: 'Transplant Surgery' },
  { value: 'General Surgery', label: 'General Surgery' },
  { value: 'Other', label: 'Other' },
];

const steps = ['Personal Information', 'Medical Details', 'Band Pairing'];

export function SignupView() {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bandPairing, setBandPairing] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    patientId: '',
    email: '',
    password: '',
    confirmPassword: '',
    surgeryType: '',
    surgeryDate: '',
    isWearingBand: false,
    bandId: '',
    termsAccepted: false,
  });

  const handleChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [field]: event.target.value });
    setError('');
  };

  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, termsAccepted: event.target.checked });
  };

  const handleNext = () => {
    if (activeStep === 0) {
      // Validate personal info
      if (!formData.name || !formData.patientId || !formData.email || !formData.password || !formData.confirmPassword) {
        setError('Please fill in all fields');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }
    } else if (activeStep === 1) {
      // Validate medical details
      if (!formData.surgeryType || !formData.surgeryDate) {
        setError('Please fill in all medical details');
        return;
      }
    }
    
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleBandPairing = () => {
    setBandPairing(true);
    // Simulate band pairing
    setTimeout(() => {
      setFormData({ 
        ...formData, 
        isWearingBand: true,
        bandId: `CRV-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`
      });
      setBandPairing(false);
    }, 2000);
  };

  const handleSubmit = async () => {
    if (!formData.termsAccepted) {
      setError('Please accept the terms and conditions');
      return;
    }

    setLoading(true);
    try {
      const signupData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: 'patient',
        patientId: formData.patientId,
        surgeryType: formData.surgeryType,
        surgeryDate: formData.surgeryDate,
        isWearingBand: formData.isWearingBand,
        bandId: formData.bandId || undefined,
      };

      const response = await apiRequest.post(API_ENDPOINTS.auth.signup, signupData);
      
      if (response.token) {
        authHelper.setToken(response.token);
        authHelper.setUser(response.user);
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderPersonalInfo = (
    <Stack spacing={3}>
      {error && activeStep === 0 && (
        <Alert severity="error" onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <TextField
        fullWidth
        name="name"
        label="Full Name"
        value={formData.name}
        onChange={handleChange('name')}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Iconify icon="solar:user-bold" width={24} />
            </InputAdornment>
          ),
        }}
      />

      <TextField
        fullWidth
        name="patientId"
        label="Patient ID"
        value={formData.patientId}
        onChange={handleChange('patientId')}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Iconify icon="solar:card-bold" width={24} />
            </InputAdornment>
          ),
        }}
      />

      <TextField
        fullWidth
        name="email"
        label="Email Address"
        type="email"
        value={formData.email}
        onChange={handleChange('email')}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Iconify icon="solar:letter-bold" width={24} />
            </InputAdornment>
          ),
        }}
      />

      <TextField
        fullWidth
        name="password"
        label="Password"
        type={showPassword ? 'text' : 'password'}
        value={formData.password}
        onChange={handleChange('password')}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Iconify icon="solar:lock-password-bold" width={24} />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                <Iconify icon={showPassword ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      <TextField
        fullWidth
        name="confirmPassword"
        label="Confirm Password"
        type="password"
        value={formData.confirmPassword}
        onChange={handleChange('confirmPassword')}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Iconify icon="solar:lock-password-bold" width={24} />
            </InputAdornment>
          ),
        }}
      />
    </Stack>
  );

  const renderMedicalDetails = (
    <Stack spacing={3}>
      {error && activeStep === 1 && (
        <Alert severity="error" onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <TextField
        select
        fullWidth
        name="surgeryType"
        label="Surgery Type"
        value={formData.surgeryType}
        onChange={handleChange('surgeryType')}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Iconify icon="solar:health-bold" width={24} />
            </InputAdornment>
          ),
        }}
      >
        {SURGERY_TYPES.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        fullWidth
        name="surgeryDate"
        label="Surgery Date"
        type="date"
        value={formData.surgeryDate}
        onChange={handleChange('surgeryDate')}
        InputLabelProps={{ shrink: true }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Iconify icon="solar:calendar-bold" width={24} />
            </InputAdornment>
          ),
        }}
      />

      <Alert severity="info">
        <Typography variant="body2">
          Your medical information will be securely stored and used to personalize your recovery monitoring.
        </Typography>
      </Alert>
    </Stack>
  );

  const renderBandPairing = (
    <Stack spacing={3}>
      {error && activeStep === 2 && (
        <Alert severity="error" onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Box sx={{ textAlign: 'center', py: 3 }}>
        <Iconify icon="solar:smartwatch-bold" width={80} sx={{ color: 'primary.main', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          Pair Your Curavia Band
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Please ensure your band is turned on and within range
        </Typography>

        {!formData.isWearingBand ? (
          <Stack spacing={2}>
            <LoadingButton
              size="large"
              variant="contained"
              loading={bandPairing}
              onClick={handleBandPairing}
              startIcon={<Iconify icon="solar:bluetooth-bold" />}
            >
              {bandPairing ? 'Searching for band...' : 'I have a Curavia Band'}
            </LoadingButton>
            
            <Button
              size="large"
              variant="outlined"
              onClick={() => setFormData({ ...formData, isWearingBand: false })}
              startIcon={<Iconify icon="solar:skip-next-bold" />}
            >
              Skip - I don't have a band yet
            </Button>
          </Stack>
        ) : (
          <Stack spacing={2} alignItems="center">
            {formData.bandId ? (
              <>
                <Chip
                  icon={<Iconify icon="solar:check-circle-bold" />}
                  label={`Band Connected: ${formData.bandId}`}
                  color="success"
                  size="medium"
                />
                <Typography variant="caption" color="text.secondary">
                  Band successfully paired and ready for monitoring
                </Typography>
              </>
            ) : (
              <>
                <Chip
                  icon={<Iconify icon="solar:info-circle-bold" />}
                  label="No Band Connected"
                  color="info"
                  size="medium"
                />
                <Typography variant="caption" color="text.secondary">
                  You can pair your band later from your dashboard
                </Typography>
              </>
            )}
          </Stack>
        )}
      </Box>

      <FormControlLabel
        control={
          <Checkbox
            checked={formData.termsAccepted}
            onChange={handleCheckboxChange}
            name="termsAccepted"
          />
        }
        label={
          <Typography variant="body2">
            I accept the{' '}
            <Link href="#" underline="always">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="#" underline="always">
              Privacy Policy
            </Link>
          </Typography>
        }
      />
    </Stack>
  );

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return renderPersonalInfo;
      case 1:
        return renderMedicalDetails;
      case 2:
        return renderBandPairing;
      default:
        return 'Unknown step';
    }
  };

  return (
    <>
      <Box gap={1.5} sx={{ mb: 5, display: 'flex', alignItems: 'center' }}>
        <Iconify icon="solar:heart-pulse-bold" width={48} sx={{ color: 'primary.main' }} />
        <Box>
          <Typography variant="h5">Create Your Curavia Account</Typography>
          <Typography variant="body2" color="text.secondary">
            Start your recovery journey with personalized monitoring
          </Typography>
        </Box>
      </Box>

      <Stepper activeStep={activeStep} sx={{ mb: 5 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {getStepContent(activeStep)}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button
          disabled={activeStep === 0}
          onClick={handleBack}
          startIcon={<Iconify icon="solar:arrow-left-bold" />}
        >
          Back
        </Button>
        {activeStep === steps.length - 1 ? (
          <LoadingButton
            variant="contained"
            onClick={handleSubmit}
            loading={loading}
            loadingPosition="start"
            startIcon={<Iconify icon="solar:check-circle-bold" />}
          >
            Complete Registration
          </LoadingButton>
        ) : (
          <Button
            variant="contained"
            onClick={handleNext}
            endIcon={<Iconify icon="solar:arrow-right-bold" />}
          >
            Next
          </Button>
        )}
      </Box>

      <Typography variant="body2" sx={{ mt: 3, textAlign: 'center' }}>
        Already have an account?{' '}
        <Link variant="subtitle2" href="/login" underline="hover">
          Sign in
        </Link>
      </Typography>
    </>
  );
}