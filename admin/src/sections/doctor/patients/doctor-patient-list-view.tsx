import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Avatar,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Tooltip,
  Stack
} from '@mui/material';
import { Icon } from '@iconify/react';
import { useRouter } from 'src/routes/hooks';
import apiHelper from 'src/utils/apiHelper';

interface Patient {
  _id: string;
  name: string;
  email: string;
  patientId: string;
  surgeryType: string;
  surgeryDate: string;
  actualRecoveryProgress: number;
  isBandActive: boolean;
  age: number;
  gender: string;
  bloodGroup: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relation: string;
  };
  latestVitals?: {
    heartRate: number;
    bloodPressure: string;
    temperature: number;
    spO2: number;
    lastUpdated: string;
  };
  activeAlertsCount: number;
}

interface PatientListData {
  patients: Patient[];
  total: number;
}

export function DoctorPatientListView() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    fetchPatients();
  }, [searchTerm, statusFilter, sortBy, sortOrder]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);

      const response = await apiHelper.get(`/doctor/patients?${params.toString()}`);
      
      if (response.success) {
        setPatients(response.data.patients);
      } else {
        setError('Failed to load patients');
      }
    } catch (err: any) {
      console.error('Patients fetch error:', err);
      setError(err.message || 'Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (progress: number) => {
    if (progress < 30) return 'error';
    if (progress < 70) return 'warning';
    return 'success';
  };

  const getStatusText = (progress: number) => {
    if (progress < 30) return 'Critical';
    if (progress < 70) return 'Stable';
    return 'Recovering';
  };

  const getStatusIcon = (progress: number) => {
    if (progress < 30) return <Icon icon="material-symbols:warning" width={16} />;
    if (progress < 70) return <Icon icon="material-symbols:schedule" width={16} />;
    return <Icon icon="material-symbols:check-circle" width={16} />;
  };

  const handleViewPatient = (patientId: string) => {
    router.push(`/admin/doctor/patient/${patientId}`);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const filteredPatients = patients.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={40} />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading patients...</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          My Patients
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage and monitor your assigned patients
        </Typography>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
            <TextField
              placeholder="Search patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ minWidth: 300 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Icon icon="material-symbols:search" width={20} />
                  </InputAdornment>
                ),
              }}
            />
            
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Status"
              >
                <MenuItem value="all">All Patients</MenuItem>
                <MenuItem value="critical">Critical</MenuItem>
                <MenuItem value="stable">Stable</MenuItem>
                <MenuItem value="recovering">Recovering</MenuItem>
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                label="Sort By"
              >
                <MenuItem value="name">Name</MenuItem>
                <MenuItem value="patientId">Patient ID</MenuItem>
                <MenuItem value="surgeryDate">Surgery Date</MenuItem>
                <MenuItem value="actualRecoveryProgress">Recovery Progress</MenuItem>
              </Select>
            </FormControl>

            <Button
              variant="outlined"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              startIcon={<Icon icon="material-symbols:filter-list" width={20} />}
            >
              {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Patients Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Patient</TableCell>
                <TableCell>Surgery</TableCell>
                <TableCell>Recovery Status</TableCell>
                <TableCell>Latest Vitals</TableCell>
                <TableCell>Alerts</TableCell>
                <TableCell>Band Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPatients.map((patient) => (
                <TableRow key={patient._id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ mr: 2, width: 40, height: 40 }}>
                        {patient.name.split(' ').map(n => n[0]).join('')}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2">
                          {patient.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ID: {patient.patientId}
                        </Typography>
                        <br />
                        <Typography variant="caption" color="text.secondary">
                          {patient.age}y, {patient.gender}, {patient.bloodGroup}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2">
                      {patient.surgeryType}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(patient.surgeryDate).toLocaleDateString()}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Chip
                        icon={getStatusIcon(patient.actualRecoveryProgress)}
                        label={getStatusText(patient.actualRecoveryProgress)}
                        color={getStatusColor(patient.actualRecoveryProgress) as any}
                        variant="outlined"
                        size="small"
                      />
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {patient.actualRecoveryProgress}% Complete
                    </Typography>
                  </TableCell>

                  <TableCell>
                    {patient.latestVitals ? (
                      <Box>
                        <Typography variant="caption" display="block">
                          HR: {patient.latestVitals.heartRate} bpm
                        </Typography>
                        <Typography variant="caption" display="block">
                          BP: {patient.latestVitals.bloodPressure}
                        </Typography>
                        <Typography variant="caption" display="block">
                          Temp: {patient.latestVitals.temperature}°F
                        </Typography>
                        <Typography variant="caption" display="block">
                          SpO2: {patient.latestVitals.spO2}%
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(patient.latestVitals.lastUpdated).toLocaleTimeString()}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        No recent data
                      </Typography>
                    )}
                  </TableCell>

                  <TableCell>
                    {patient.activeAlertsCount > 0 ? (
                      <Chip
                        label={`${patient.activeAlertsCount} alerts`}
                        color="warning"
                        size="small"
                        icon={<Icon icon="material-symbols:warning" width={16} />}
                      />
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        No alerts
                      </Typography>
                    )}
                  </TableCell>

                  <TableCell>
                    <Chip
                      label={patient.isBandActive ? 'Active' : 'Inactive'}
                      color={patient.isBandActive ? 'success' : 'error'}
                      variant="outlined"
                      size="small"
                    />
                  </TableCell>

                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="View Patient Details">
                        <IconButton 
                          size="small"
                          onClick={() => handleViewPatient(patient._id)}
                        >
                          <Icon icon="material-symbols:visibility" width={20} />
                        </IconButton>
                      </Tooltip>
                      
                      {patient.emergencyContact?.phone && (
                        <Tooltip title={`Call ${patient.emergencyContact.name}`}>
                          <IconButton 
                            size="small"
                            href={`tel:${patient.emergencyContact.phone}`}
                          >
                            <Icon icon="material-symbols:phone" width={20} />
                          </IconButton>
                        </Tooltip>
                      )}
                      
                      <Tooltip title="Send Email">
                        <IconButton 
                          size="small"
                          href={`mailto:${patient.email}`}
                        >
                          <Icon icon="material-symbols:email" width={20} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={patients.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Card>

      {patients.length === 0 && !loading && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="text.secondary">
            No patients found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            You don't have any assigned patients yet.
          </Typography>
        </Box>
      )}
    </Container>
  );
}