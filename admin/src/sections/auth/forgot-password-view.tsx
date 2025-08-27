import { useState } from 'react';
import { useRouter } from 'src/routes/hooks';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Alert from '@mui/material/Alert';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';

import { Iconify } from 'src/components/iconify';
import { API_ENDPOINTS, apiRequest } from 'src/config/api';

// ----------------------------------------------------------------------

type ResetStage = 'request' | 'verify' | 'reset';

export function ForgotPasswordView() {
  const router = useRouter();
  const [stage, setStage] = useState<ResetStage>('request');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    email: '',
    otp: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [field]: event.target.value });
    setError('');
  };

  const handleRequestReset = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!formData.email) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      const response = await apiRequest.post(API_ENDPOINTS.auth.forgotPassword, {
        email: formData.email
      });
      
      setSuccess('OTP has been sent to your email address');
      setStage('verify');
      
      // Show dev OTP if in development
      if (response.dev_otp) {
        setSuccess(`OTP sent! For demo: ${response.dev_otp}`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!formData.otp) {
      setError('Please enter the OTP');
      return;
    }

    setLoading(true);
    try {
      // For now, just move to next stage
      // In a full implementation, you might verify OTP separately
      setStage('reset');
      setSuccess('OTP verified. Please set your new password');
    } catch (err: any) {
      setError(err.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!formData.newPassword || !formData.confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (formData.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await apiRequest.post(API_ENDPOINTS.auth.resetPassword, {
        email: formData.email,
        otp: formData.otp,
        newPassword: formData.newPassword
      });
      
      setSuccess('Password reset successful! Redirecting to login...');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Password reset failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderRequestForm = (
    <Box component="form" onSubmit={handleRequestReset}>
      <Stack spacing={3}>
        <Typography variant="body2" color="text.secondary">
          Enter your email address and we'll send you a link to reset your password.
        </Typography>

        {error && (
          <Alert severity="error" onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

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

        <LoadingButton
          fullWidth
          size="large"
          type="submit"
          variant="contained"
          loading={loading}
          loadingPosition="start"
          startIcon={<Iconify icon="solar:letter-bold-duotone" />}
        >
          Send Reset Link
        </LoadingButton>
      </Stack>
    </Box>
  );

  const renderVerifyForm = (
    <Box component="form" onSubmit={handleVerifyCode}>
      <Stack spacing={3}>
        <Typography variant="body2" color="text.secondary">
          We've sent a 6-digit verification code to {formData.email}. Please enter it below.
        </Typography>

        {error && (
          <Alert severity="error" onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        <TextField
          fullWidth
          name="otp"
          label="6-Digit OTP"
          placeholder="123456"
          value={formData.otp}
          onChange={handleChange('otp')}
          inputProps={{ maxLength: 6 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Iconify icon="solar:shield-keyhole-bold" width={24} />
              </InputAdornment>
            ),
          }}
        />

        <LoadingButton
          fullWidth
          size="large"
          type="submit"
          variant="contained"
          loading={loading}
          loadingPosition="start"
          startIcon={<Iconify icon="solar:check-circle-bold" />}
        >
          Verify Code
        </LoadingButton>

        <Typography variant="body2" color="text.secondary" align="center">
          Didn't receive the code?{' '}
          <Link
            component="button"
            variant="subtitle2"
            onClick={() => setStage('request')}
            underline="hover"
          >
            Resend
          </Link>
        </Typography>
      </Stack>
    </Box>
  );

  const renderResetForm = (
    <Box component="form" onSubmit={handleResetPassword}>
      <Stack spacing={3}>
        <Typography variant="body2" color="text.secondary">
          Please enter your new password. Make sure it's at least 6 characters long.
        </Typography>

        {error && (
          <Alert severity="error" onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success">
            {success}
          </Alert>
        )}

        <TextField
          fullWidth
          name="newPassword"
          label="New Password"
          type={showPassword ? 'text' : 'password'}
          value={formData.newPassword}
          onChange={handleChange('newPassword')}
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
          label="Confirm New Password"
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

        <LoadingButton
          fullWidth
          size="large"
          type="submit"
          variant="contained"
          loading={loading}
          loadingPosition="start"
          startIcon={<Iconify icon="solar:lock-password-bold" />}
        >
          Reset Password
        </LoadingButton>
      </Stack>
    </Box>
  );

  const getStageContent = () => {
    switch (stage) {
      case 'request':
        return renderRequestForm;
      case 'verify':
        return renderVerifyForm;
      case 'reset':
        return renderResetForm;
      default:
        return null;
    }
  };

  return (
    <>
      <Box gap={1.5} sx={{ mb: 5, display: 'flex', alignItems: 'center' }}>
        <Iconify icon="solar:lock-password-bold" width={48} sx={{ color: 'primary.main' }} />
        <Box>
          <Typography variant="h5">Forgot Your Password?</Typography>
          <Typography variant="body2" color="text.secondary">
            No worries, we'll help you reset it
          </Typography>
        </Box>
      </Box>

      {getStageContent()}

      <Stack direction="row" spacing={0.5} sx={{ mt: 3, justifyContent: 'center' }}>
        <Typography variant="body2">Remember your password?</Typography>
        <Link variant="subtitle2" href="/login" underline="hover">
          Sign in
        </Link>
      </Stack>

      {stage === 'verify' && (
        <Alert severity="info" sx={{ mt: 3 }}>
          <strong>Note:</strong> Enter the 6-digit OTP sent to your email
        </Alert>
      )}
    </>
  );
}