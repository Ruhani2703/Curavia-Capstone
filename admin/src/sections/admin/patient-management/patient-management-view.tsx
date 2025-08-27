import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableBody from '@mui/material/TableBody';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Tooltip from '@mui/material/Tooltip';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';

import { DashboardContent } from 'src/layouts/dashboard';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { AddPatientDialog } from './add-patient-dialog';
import apiHelper from 'src/utils/apiHelper';

// ----------------------------------------------------------------------

const FILTER_OPTIONS = [
  { value: 'all', label: 'All Patients' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'high-risk', label: 'High Risk' },
  { value: 'low-risk', label: 'Low Risk' },
];

const SURGERY_TYPES = ['All', 'Bariatric', 'Cardiac', 'Orthopedic', 'Neurological', 'General'];

// ----------------------------------------------------------------------

export function PatientManagementView() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSurgery, setFilterSurgery] = useState('All');
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState({
    totalPatients: 0,
    activePatients: 0,
    highRiskPatients: 0,
    newPatientsThisMonth: 0,
  });
  const [assignDoctorDialog, setAssignDoctorDialog] = useState(false);
  const [selectedPatientForAssign, setSelectedPatientForAssign] = useState<any>(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [thingSpeakDialog, setThingSpeakDialog] = useState(false);
  const [selectedPatientForThingSpeak, setSelectedPatientForThingSpeak] = useState<any>(null);
  const [thingSpeakChannelId, setThingSpeakChannelId] = useState('');
  const [thingSpeakReadKey, setThingSpeakReadKey] = useState('');
  const [thingSpeakWriteKey, setThingSpeakWriteKey] = useState('');

  // Fetch data on component mount
  useEffect(() => {
    fetchPatients();
    fetchDoctors();
    fetchStatistics();
  }, []);

  // Debug dialog state changes
  useEffect(() => {
    console.log('🔍 Dialog state changed to:', assignDoctorDialog);
  }, [assignDoctorDialog]);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const response = await apiHelper.get('/admin/users?role=patient');
      
      if (response.users) {
        console.log('👥 Fetched patients data:', response.users.length || 0, 'patients');
        // Map the real patient data to include status and proper structure
        const mappedPatients = response.users.map((patient: any) => ({
          ...patient,
          status: patient.isBandActive ? 'Active' : 'Inactive',
          riskLevel: determineRiskLevel(patient),
          lastSync: patient.isBandActive ? 'Just now' : 'Not synced',
          vitals: null, // Will be fetched separately when needed
          doctor: patient.assignedDoctors?.[0]?.name || 'Not Assigned'
        }));
        setPatients(mappedPatients);
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
      setError('Failed to load patients. Please check your connection.');
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to determine risk level based on patient data
  const determineRiskLevel = (patient: any): string => {
    if (patient.age > 65) return 'High';
    if (patient.surgeryType === 'Cardiac Surgery' || patient.surgeryType === 'Neurological Surgery') return 'High';
    if (patient.age > 50) return 'Medium';
    return 'Low';
  };

  // Function to fetch latest vitals for a patient
  const fetchPatientVitals = async (patientId: string) => {
    try {
      const response = await apiHelper.get(`/sensor/latest/${patientId}`);
      
      if (response.success && response.data) {
        return {
          heartRate: response.data.heartRate?.value || 'N/A',
          bloodPressure: response.data.bloodPressure ? 
            `${response.data.bloodPressure.systolic}/${response.data.bloodPressure.diastolic}` : 'N/A',
          temperature: response.data.temperature?.value || 'N/A',
          oxygen: response.data.spO2?.value || 'N/A',
          lastUpdate: response.data.recordedAt ? new Date(response.data.recordedAt).toLocaleString() : 'N/A'
        };
      }
    } catch (error) {
      console.error('Error fetching patient vitals:', error);
    }
    
    // Return default values if no data available
    return {
      heartRate: 'N/A',
      bloodPressure: 'N/A', 
      temperature: 'N/A',
      oxygen: 'N/A',
      lastUpdate: 'N/A'
    };
  };

  // Handle patient click to open dialog with vitals
  const handlePatientClick = async (patient: any) => {
    setSelectedPatient({
      ...patient,
      vitals: { heartRate: 'Loading...', bloodPressure: 'Loading...', temperature: 'Loading...', oxygen: 'Loading...' }
    });
    setDialogOpen(true);
    
    // Fetch real vitals data
    const vitals = await fetchPatientVitals(patient._id);
    setSelectedPatient(prev => ({
      ...prev,
      vitals,
      lastSync: vitals.lastUpdate !== 'N/A' ? 'Just now' : 'Not synced'
    }));
  };

  // Filter and search patients
  const filteredPatients = patients.filter((patient) => {
    const matchesSearch = !searchTerm || 
      patient.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.patientId?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || patient.status?.toLowerCase() === filterStatus;
    const matchesSurgery = filterSurgery === 'All' || patient.surgeryType === filterSurgery;
    
    return matchesSearch && matchesStatus && matchesSurgery;
  });

  // Helper functions for styling
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'success';
      case 'inactive': return 'warning';
      default: return 'default';
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel?.toLowerCase()) {
      case 'high': return 'error';
      case 'medium': return 'warning'; 
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const fetchDoctors = async () => {
    try {
      const response = await apiHelper.get('/admin/doctors');
      
      if (response.doctors) {
        console.log('👨‍⚕️ Fetched doctors:', response.doctors.length || 0, 'doctors');
        setDoctors(response.doctors || []);
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  const assignDoctorToPatient = async () => {
    console.log('🚀 Assignment attempt started');
    console.log('👤 Patient:', selectedPatientForAssign?.name);
    console.log('👨‍⚕️ Doctor ID:', selectedDoctorId);
    
    if (!selectedPatientForAssign || !selectedDoctorId) {
      console.log('❌ Missing patient or doctor selection');
      return;
    }
    
    try {
      const response = await apiHelper.put(`/admin/users/${selectedPatientForAssign._id}`, {
        assignedDoctors: selectedDoctorId ? [selectedDoctorId] : []
      });
      
      if (response.user) {
        console.log('✅ Assignment successful:', response);
        
        // Close dialog first
        setAssignDoctorDialog(false);
        setSelectedPatientForAssign(null);
        setSelectedDoctorId('');
        
        // Force refresh patients list with a slight delay to ensure API has processed
        setTimeout(() => {
          fetchPatients();
        }, 500);
      }
    } catch (error) {
      console.error('❌ Error assigning doctor:', error);
    }
  };

  const handleAssignDoctor = (event: React.MouseEvent, patient: any) => {
    event.stopPropagation(); // Prevent row click from interfering
    console.log('🩺 Assign doctor clicked for patient:', patient.name);
    console.log('👨‍⚕️ Available doctors:', doctors.length);
    console.log('🔧 Setting dialog state to true...');
    setSelectedPatientForAssign(patient);
    setSelectedDoctorId(patient.assignedDoctors?.[0] || '');
    setAssignDoctorDialog(true);
    
    // Use setTimeout to check state after update
    setTimeout(() => {
      console.log('📝 Dialog state after update should be true');
    }, 100);
  };

  const getDoctorName = (doctorId: string | any) => {
    // Handle case where doctorId might be a full doctor object or just an ID
    if (typeof doctorId === 'object' && doctorId?.name) {
      return doctorId.name;
    }
    
    // Handle case where doctorId is a string ID
    const doctor = doctors.find(d => d._id === doctorId);
    return doctor ? doctor.name : 'Not assigned';
  };

  const handleThingSpeakSetup = (event: React.MouseEvent, patient: any) => {
    event.stopPropagation();
    setSelectedPatientForThingSpeak(patient);
    setThingSpeakChannelId(patient.thingspeakChannel?.channelId || '');
    setThingSpeakReadKey(patient.thingspeakChannel?.readApiKey || '');
    setThingSpeakWriteKey(patient.thingspeakChannel?.writeApiKey || '');
    setThingSpeakDialog(true);
  };

  const assignThingSpeakChannel = async () => {
    if (!selectedPatientForThingSpeak || !thingSpeakChannelId || !thingSpeakReadKey) {
      return;
    }
    
    try {
      const response = await apiHelper.post(
        `/thingspeak/patient/${selectedPatientForThingSpeak.patientId}/channel`,
        {
          channelId: thingSpeakChannelId,
          readApiKey: thingSpeakReadKey,
          writeApiKey: thingSpeakWriteKey
        }
      );
      
      if (response.success) {
        setThingSpeakDialog(false);
        setSelectedPatientForThingSpeak(null);
        setThingSpeakChannelId('');
        setThingSpeakReadKey('');
        setThingSpeakWriteKey('');
        
        // Refresh patients list
        setTimeout(() => {
          fetchPatients();
        }, 500);
      }
    } catch (error) {
      console.error('Error assigning ThingSpeak channel:', error);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await apiHelper.get('/admin/statistics');
      
      if (response) {
        setStatistics(response);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
      // Use default values if API fails
      setStatistics({
        totalPatients: patients.length,
        activePatients: patients.filter((p: any) => p.status === 'Active').length,
        highRiskPatients: patients.filter((p: any) => p.riskLevel === 'High').length,
        newPatientsThisMonth: 0
      });
    }
  };


  return (
    <DashboardContent>
      <Typography variant="h4" sx={{ mb: 5 }}>
        Patient Management 👥
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 5 }}>
        <Grid xs={12} sm={6} md={3}>
          <Card sx={{ py: 3, textAlign: 'center' }}>
            <Typography variant="h3" color="primary.main">
              {statistics.totalPatients || patients.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Patients
            </Typography>
          </Card>
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <Card sx={{ py: 3, textAlign: 'center' }}>
            <Typography variant="h3" color="success.main">
              {statistics.activePatients || patients.filter(p => p.status === 'active').length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Active Monitoring
            </Typography>
          </Card>
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <Card sx={{ py: 3, textAlign: 'center' }}>
            <Typography variant="h3" color="error.main">
              {statistics.highRiskPatients || patients.filter(p => p.riskLevel === 'high').length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              High Risk
            </Typography>
          </Card>
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <Card sx={{ py: 3, textAlign: 'center' }}>
            <Typography variant="h3" color="info.main">
              {statistics.newPatientsThisMonth || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              New This Month
            </Typography>
          </Card>
        </Grid>
      </Grid>

      <Card>
        {/* Search and Filters */}
        <Box sx={{ p: 3 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              fullWidth
              placeholder="Search patients by name, ID, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="solar:magnifer-bold" width={20} />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              select
              label="Status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              sx={{ minWidth: 140 }}
            >
              {FILTER_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Surgery Type"
              value={filterSurgery}
              onChange={(e) => setFilterSurgery(e.target.value)}
              sx={{ minWidth: 140 }}
            >
              {SURGERY_TYPES.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </TextField>
            <Button
              variant="contained"
              startIcon={<Iconify icon="solar:add-circle-bold" />}
              sx={{ minWidth: 140 }}
              onClick={() => setAddDialogOpen(true)}
            >
              Add Patient
            </Button>
          </Stack>
        </Box>

        {/* Patient Table */}
        <Scrollbar>
          <TableContainer sx={{ overflow: 'unset' }}>
            <Table sx={{ minWidth: 800 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Patient</TableCell>
                  <TableCell>Surgery</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Risk Level</TableCell>
                  <TableCell>Last Sync</TableCell>
                  <TableCell>Doctor</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredPatients
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((patient) => (
                    <TableRow
                      key={patient._id || patient.id}
                      hover
                      onClick={() => handlePatientClick(patient)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={2}>
                          <Avatar>{patient.name.charAt(0)}</Avatar>
                          <Box>
                            <Typography variant="subtitle2">{patient.name}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {patient.patientId || patient.id || patient._id} • Age {patient.age}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">{patient.surgeryType}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(patient.surgeryDate).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={patient.status}
                          color={getStatusColor(patient.status) as any}
                          variant="soft"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={patient.riskLevel}
                          color={getRiskColor(patient.riskLevel) as any}
                          variant="soft"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{patient.lastSync}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {patient.assignedDoctors?.[0] ? getDoctorName(patient.assignedDoctors[0]) : 'Not assigned'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="View Details">
                          <IconButton onClick={() => handlePatientClick(patient)}>
                            <Iconify icon="solar:eye-bold" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Assign Doctor">
                          <IconButton onClick={(e) => handleAssignDoctor(e, patient)}>
                            <Iconify icon="solar:users-group-two-rounded-bold" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Setup ThingSpeak">
                          <IconButton onClick={(e) => handleThingSpeakSetup(e, patient)} color="primary">
                            <Iconify icon="solar:satellite-bold" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Patient">
                          <IconButton color="error">
                            <Iconify icon="solar:trash-bin-trash-bold" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Scrollbar>

        <TablePagination
          page={page}
          component="div"
          count={filteredPatients.length}
          rowsPerPage={rowsPerPage}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPageOptions={[5, 10, 25]}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </Card>

      {/* Patient Detail Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar sx={{ width: 48, height: 48 }}>
              {selectedPatient?.name.charAt(0)}
            </Avatar>
            <Box>
              <Typography variant="h6">{selectedPatient?.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedPatient?.patientId || selectedPatient?.id} • {selectedPatient?.email}
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {selectedPatient && (
            <Grid container spacing={3}>
              <Grid xs={12} md={6}>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Medical Information
                  </Typography>
                  <Stack spacing={1}>
                    <Typography variant="body2">
                      <strong>Surgery:</strong> {selectedPatient.surgeryType}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Date:</strong> {new Date(selectedPatient.surgeryDate).toLocaleDateString()}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Doctor:</strong> {selectedPatient.assignedDoctors?.[0] ? getDoctorName(selectedPatient.assignedDoctors[0]) : 'Not assigned'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Band ID:</strong> {selectedPatient.bandId}
                    </Typography>
                  </Stack>
                </Box>
              </Grid>
              <Grid xs={12} md={6}>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Current Vitals
                  </Typography>
                  <Stack spacing={1}>
                    <Typography variant="body2">
                      <strong>Heart Rate:</strong> {selectedPatient.vitals?.heartRate || 'N/A'} bpm
                    </Typography>
                    <Typography variant="body2">
                      <strong>Blood Pressure:</strong> {selectedPatient.vitals?.bloodPressure || 'N/A'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Temperature:</strong> {selectedPatient.vitals?.temperature || 'N/A'}°F
                    </Typography>
                    <Typography variant="body2">
                      <strong>Oxygen:</strong> {selectedPatient.vitals?.oxygen || 'N/A'}%
                    </Typography>
                  </Stack>
                </Box>
              </Grid>
              <Grid xs={12}>
                <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                  <Chip
                    label={`Status: ${selectedPatient.status}`}
                    color={getStatusColor(selectedPatient.status) as any}
                    variant="soft"
                  />
                  <Chip
                    label={`Risk: ${selectedPatient.riskLevel}`}
                    color={getRiskColor(selectedPatient.riskLevel) as any}
                    variant="soft"
                  />
                  <Chip
                    label={`Last Sync: ${selectedPatient.lastSync}`}
                    variant="soft"
                  />
                </Stack>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Close</Button>
          <Button variant="contained" startIcon={<Iconify icon="solar:pen-bold" />}>
            Edit Patient
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Patient Dialog */}
      <AddPatientDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onSuccess={() => {
          fetchPatients();
          fetchStatistics();
        }}
      />

      {/* Assign Doctor Dialog */}
      <Dialog 
        open={assignDoctorDialog} 
        onClose={() => {
          console.log('🚪 Dialog closing...');
          setAssignDoctorDialog(false);
        }} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>
          Assign Doctor to {selectedPatientForAssign?.name}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              select
              fullWidth
              label="Select Doctor"
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
            >
              <MenuItem value="">
                <em>No Doctor</em>
              </MenuItem>
              {doctors.map((doctor) => (
                <MenuItem key={doctor._id} value={doctor._id}>
                  {doctor.name} - {doctor.specialization}
                </MenuItem>
              ))}
            </TextField>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Current assignment: {selectedPatientForAssign?.assignedDoctors?.[0] ? 
                getDoctorName(selectedPatientForAssign.assignedDoctors[0]) : 'Not assigned'}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDoctorDialog(false)}>Cancel</Button>
          <Button 
            onClick={assignDoctorToPatient} 
            variant="contained" 
            disabled={!selectedDoctorId}
          >
            Assign Doctor
          </Button>
        </DialogActions>
      </Dialog>

      {/* ThingSpeak Setup Dialog */}
      <Dialog 
        open={thingSpeakDialog} 
        onClose={() => setThingSpeakDialog(false)} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>
          Setup ThingSpeak Channel for {selectedPatientForThingSpeak?.name}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <FormControl fullWidth>
              <FormLabel>Channel ID</FormLabel>
              <TextField
                fullWidth
                placeholder="e.g., 3008199"
                value={thingSpeakChannelId}
                onChange={(e) => setThingSpeakChannelId(e.target.value)}
                helperText="Your ThingSpeak Channel ID"
              />
            </FormControl>
            
            <FormControl fullWidth>
              <FormLabel>Read API Key</FormLabel>
              <TextField
                fullWidth
                placeholder="e.g., BW16WHW6MRDITRHP"
                value={thingSpeakReadKey}
                onChange={(e) => setThingSpeakReadKey(e.target.value)}
                helperText="API key for reading data from ThingSpeak"
              />
            </FormControl>
            
            <FormControl fullWidth>
              <FormLabel>Write API Key (Optional)</FormLabel>
              <TextField
                fullWidth
                placeholder="e.g., 70RNO01F3YVMOCZ6"
                value={thingSpeakWriteKey}
                onChange={(e) => setThingSpeakWriteKey(e.target.value)}
                helperText="API key for writing data to ThingSpeak"
              />
            </FormControl>

            <Alert severity="info">
              <Typography variant="body2">
                <strong>Field Mapping:</strong><br />
                Field 1: Heart Rate (bpm)<br />
                Field 2: Blood Pressure Systolic (mmHg)<br />
                Field 3: Blood Pressure Diastolic (mmHg)<br />
                Field 4: Temperature (°F)<br />
                Field 5: SpO2 (%)<br />
                Field 6: Movement Detection<br />
                Field 7: Fall Detection<br />
                Field 8: Battery Level (%)
              </Typography>
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setThingSpeakDialog(false)}>Cancel</Button>
          <Button 
            onClick={assignThingSpeakChannel} 
            variant="contained" 
            disabled={!thingSpeakChannelId || !thingSpeakReadKey}
          >
            Setup Channel
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardContent>
  );
}