import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

interface AddDoctorDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const SPECIALIZATIONS = [
  'Cardiology',
  'General Surgery',
  'Orthopedics',
  'Neurology',
  'Pediatrics',
  'Gynecology',
  'Dermatology',
  'Ophthalmology',
  'ENT',
  'Radiology',
  'Anesthesiology',
  'Psychiatry',
];

const DEPARTMENTS = [
  'Emergency',
  'Surgery',
  'ICU',
  'Cardiology',
  'Orthopedics',
  'Neurology',
  'Pediatrics',
  'Maternity',
  'Radiology',
  'Laboratory',
  'Pharmacy',
  'Rehabilitation',
];

const SHIFTS = ['Day Shift', 'Night Shift', 'Rotating'];

export function AddDoctorDialog({ open, onClose, onSuccess }: AddDoctorDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      specialization: '',
      department: '',
      licenseNumber: '',
      phone: '',
      shift: 'Day Shift',
      experience: '',
      qualifications: '',
      emergencyContact: '',
    },
  });

  const onSubmit = async (data: any) => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:4000/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...data,
          role: 'doctor',
        }),
      });

      const result = await response.json();

      if (response.ok) {
        reset();
        onSuccess();
        onClose();
      } else {
        setError(result.error || 'Failed to create doctor');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      reset();
      setError('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Iconify icon="solar:stethoscope-bold" width={24} />
          <Typography variant="h6">Add New Doctor</Typography>
        </Stack>
      </DialogTitle>

      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={3}>
            {/* Basic Information */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mb: 2 }}>
                Basic Information
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="name"
                control={control}
                rules={{ required: 'Name is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Full Name"
                    placeholder="Dr. John Smith"
                    error={!!errors.name}
                    helperText={errors.name?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="email"
                control={control}
                rules={{
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address',
                  },
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Email"
                    error={!!errors.email}
                    helperText={errors.email?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="password"
                control={control}
                rules={{
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters',
                  },
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type="password"
                    label="Password"
                    error={!!errors.password}
                    helperText={errors.password?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="phone"
                control={control}
                rules={{ required: 'Phone number is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Phone Number"
                    error={!!errors.phone}
                    helperText={errors.phone?.message}
                  />
                )}
              />
            </Grid>

            {/* Professional Information */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mb: 2, mt: 1 }}>
                Professional Information
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="specialization"
                control={control}
                rules={{ required: 'Specialization is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    select
                    label="Specialization"
                    error={!!errors.specialization}
                    helperText={errors.specialization?.message}
                  >
                    {SPECIALIZATIONS.map((spec) => (
                      <MenuItem key={spec} value={spec}>
                        {spec}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="department"
                control={control}
                rules={{ required: 'Department is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    select
                    label="Department"
                    error={!!errors.department}
                    helperText={errors.department?.message}
                  >
                    {DEPARTMENTS.map((dept) => (
                      <MenuItem key={dept} value={dept}>
                        {dept}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="licenseNumber"
                control={control}
                rules={{ required: 'License number is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Medical License Number"
                    placeholder="MD-2024-XXXX"
                    error={!!errors.licenseNumber}
                    helperText={errors.licenseNumber?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="shift"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    select
                    label="Shift"
                  >
                    {SHIFTS.map((shift) => (
                      <MenuItem key={shift} value={shift}>
                        {shift}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>

            {/* Additional Details */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mb: 2, mt: 1 }}>
                Additional Details
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="experience"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Years of Experience"
                    type="number"
                    placeholder="5"
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="emergencyContact"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Emergency Contact"
                    placeholder="Name - Phone Number"
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="qualifications"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    multiline
                    rows={3}
                    label="Qualifications & Certifications"
                    placeholder="MBBS, MD, Board Certifications, etc."
                  />
                )}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <Iconify icon="solar:add-circle-bold" />}
          >
            {loading ? 'Creating...' : 'Create Doctor'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}