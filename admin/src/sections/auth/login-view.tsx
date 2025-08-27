import { useState } from 'react';
import { useRouter } from 'src/routes/hooks';
import { useAuth } from 'src/contexts/AuthContext';

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
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';

import { Iconify } from 'src/components/iconify';
import apiHelper from 'src/utils/apiHelper';

// ----------------------------------------------------------------------

export function LoginView() {
  const router = useRouter();
  const { login: authLogin } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    patientId: '',
    password: '',
    isWearingBand: false,
    rememberMe: false,
  });
  const [usePatientId, setUsePatientId] = useState(false);

  // Band status - will be fetched from backend when available
  const [bandStatus] = useState({
    connected: false,
    battery: 0,
    lastSync: 'No device connected'
  });

  const handleChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [field]: event.target.value });
    setError('');
  };

  const handleCheckboxChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [field]: event.target.checked });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const loginData = {
        password: formData.password,
        isWearingBand: formData.isWearingBand,
        ...(usePatientId 
          ? { patientId: formData.patientId }
          : { email: formData.email }
        )
      };

      console.log('🔐 Login attempt with data:', loginData);
      
      // Use the AuthContext login method
      const response = await authLogin(formData.email, formData.password);
      console.log('📡 API Response received:', response);

      if (response.user) {
        console.log('👤 User role:', response.user.role);
        console.log('🎯 About to redirect...');

        // Redirect based on role with a small delay to ensure state updates
        setTimeout(() => {
          if (response.user.role === 'super_admin') {
            console.log('🔄 Redirecting super_admin to /admin');
            router.push('/admin');
            // Fallback redirect
            setTimeout(() => {
              console.log('🔄 Fallback redirect to /admin');
              window.location.href = '/admin';
            }, 200);
          } else if (response.user.role === 'doctor') {
            console.log('🔄 Redirecting doctor to /doctor/dashboard');
            router.push('/doctor/dashboard');
            setTimeout(() => window.location.href = '/doctor/dashboard', 200);
          } else {
            console.log('🔄 Redirecting patient to /patient/dashboard');
            router.push('/patient/dashboard');
            setTimeout(() => window.location.href = '/patient/dashboard', 200);
          }
          console.log('✅ Router push completed');
        }, 100);
      } else {
        console.error('❌ Invalid response format:', response);
        throw new Error('Invalid login response format');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const renderForm = (
    <Box component="form" onSubmit={handleSubmit}>
      <Stack spacing={3}>
        {error && (
          <Alert severity="error" onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Stack spacing={2}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="body2" color="text.secondary">
              Login with:
            </Typography>
            <Chip
              label="Email"
              variant={!usePatientId ? 'filled' : 'outlined'}
              onClick={() => setUsePatientId(false)}
              clickable
              size="small"
            />
            <Chip
              label="Patient ID"
              variant={usePatientId ? 'filled' : 'outlined'}
              onClick={() => setUsePatientId(true)}
              clickable
              size="small"
            />
          </Stack>

          <TextField
            fullWidth
            name={usePatientId ? 'patientId' : 'email'}
            label={usePatientId ? 'Patient ID' : 'Email Address'}
            type={usePatientId ? 'text' : 'email'}
            value={usePatientId ? formData.patientId : formData.email}
            onChange={handleChange(usePatientId ? 'patientId' : 'email')}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon={usePatientId ? 'solar:card-bold' : 'solar:letter-bold'} width={24} />
                </InputAdornment>
              ),
            }}
          />
        </Stack>

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

        <Stack spacing={2}>
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.isWearingBand}
                onChange={handleCheckboxChange('isWearingBand')}
                name="isWearingBand"
              />
            }
            label={
              <Stack direction="row" alignItems="center" spacing={1}>
                <Iconify icon="solar:smartwatch-bold" width={20} />
                <Typography variant="body2">I am wearing my Curavia band</Typography>
              </Stack>
            }
          />

          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.rememberMe}
                  onChange={handleCheckboxChange('rememberMe')}
                  name="rememberMe"
                />
              }
              label="Remember me"
            />
            <Link variant="body2" color="inherit" underline="always" href="/forgot-password">
              Forgot password?
            </Link>
          </Stack>
        </Stack>

        <LoadingButton
          fullWidth
          size="large"
          type="submit"
          variant="contained"
          loading={loading}
          loadingPosition="start"
          startIcon={<Iconify icon="solar:login-3-bold" />}
        >
          Sign In
        </LoadingButton>
      </Stack>
    </Box>
  );

  const renderBandStatus = (
    <Box
      sx={{
        mt: 3,
        p: 2,
        borderRadius: 1,
        bgcolor: 'background.neutral',
      }}
    >
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Band Status
      </Typography>
      <Stack direction="row" spacing={1} alignItems="center">
        <Chip
          size="small"
          label={bandStatus.connected ? 'Connected' : 'Disconnected'}
          color={bandStatus.connected ? 'success' : 'error'}
          icon={<Iconify icon="solar:bluetooth-bold" />}
        />
        <Chip
          size="small"
          label={`${bandStatus.battery}% Battery`}
          color={bandStatus.battery > 20 ? 'default' : 'warning'}
          icon={<Iconify icon="solar:battery-full-bold" />}
        />
        <Typography variant="caption" color="text.secondary">
          Last sync: {bandStatus.lastSync}
        </Typography>
      </Stack>
    </Box>
  );

  return (
    <>
      <Box gap={1.5} sx={{ mb: 5, display: 'flex', alignItems: 'center' }}>
        <Iconify icon="solar:heart-pulse-bold" width={48} sx={{ color: 'primary.main' }} />
        <Box>
          <Typography variant="h5">Welcome to Curavia</Typography>
          <Typography variant="body2" color="text.secondary">
            Post-surgery monitoring system
          </Typography>
        </Box>
      </Box>

      {renderForm}
      {renderBandStatus}

      <Typography variant="body2" sx={{ mt: 3, textAlign: 'center' }}>
        Don't have an account?{' '}
        <Link variant="subtitle2" href="/signup" underline="hover">
          Sign up
        </Link>
      </Typography>

      <Alert severity="info" sx={{ mt: 3 }}>
        <strong>Demo credentials:</strong> superadmin@curavia.com / superadmin123
      </Alert>
    </>
  );
}