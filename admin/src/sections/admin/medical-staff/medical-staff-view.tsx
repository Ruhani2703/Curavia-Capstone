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
import Stack from '@mui/material/Stack';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import Divider from '@mui/material/Divider';
import Badge from '@mui/material/Badge';

import { DashboardContent } from 'src/layouts/dashboard';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { AddDoctorDialog } from './add-doctor-dialog';
import apiHelper from 'src/utils/apiHelper';

// ----------------------------------------------------------------------

const DEPARTMENTS = ['All', 'Cardiology', 'General Surgery', 'Orthopedics', 'Neurology', 'Post-Op Recovery'];
const STATUS_OPTIONS = ['All', 'Active', 'Off-duty', 'On Leave'];
const AVAILABILITY_OPTIONS = ['All', 'Available', 'Busy', 'Off-duty'];

// ----------------------------------------------------------------------

export function MedicalStaffView() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterAvailability, setFilterAvailability] = useState('All');
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [detailDialog, setDetailDialog] = useState(false);
  const [addDoctorDialog, setAddDoctorDialog] = useState(false);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState({
    totalStaff: 0,
    onDutyStaff: 0,
    availableStaff: 0,
    activeConsultations: 0,
  });

  // Fetch data on component mount
  useEffect(() => {
    fetchDoctors();
    fetchStatistics();
  }, []);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:4000/api/admin/users?role=doctor', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setDoctors(data.users);
      } else {
        setError('Failed to load medical staff');
        setDoctors([]);
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
      setError('Failed to load medical staff');
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:4000/api/admin/statistics', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setStatistics({
          totalStaff: data.totalDoctors || 0,
          onDutyStaff: data.activeDoctors || 0,
          availableStaff: data.availableDoctors || 0,
          activeConsultations: data.activeConsultations || 0,
        });
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  // Filter staff - use doctors state instead of mockMedicalStaff
  const filteredStaff = doctors.filter((staff) => {
    const matchesSearch = staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (staff.doctorId || staff.id || staff._id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (staff.specialization || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDepartment = filterDepartment === 'All' || staff.department === filterDepartment;
    const matchesStatus = filterStatus === 'All' || staff.status === filterStatus.toLowerCase().replace('-', '-');
    const matchesAvailability = filterAvailability === 'All' || staff.availability === filterAvailability.toLowerCase();
    
    return matchesSearch && matchesDepartment && matchesStatus && matchesAvailability;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'off-duty': return 'default';
      case 'on-leave': return 'warning';
      default: return 'default';
    }
  };

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'available': return 'success';
      case 'busy': return 'warning';
      case 'off-duty': return 'default';
      default: return 'default';
    }
  };

  const handleStaffClick = (staff: any) => {
    setSelectedStaff(staff);
    setDetailDialog(true);
  };

  return (
    <DashboardContent>
      <Typography variant="h4" sx={{ mb: 5 }}>
        Medical Staff Portal 👩‍⚕️
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 5 }}>
        <Grid xs={12} sm={6} md={3}>
          <Card sx={{ py: 3, textAlign: 'center' }}>
            <Typography variant="h3" color="primary.main">
              {statistics.totalStaff || doctors.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Staff
            </Typography>
          </Card>
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <Card sx={{ py: 3, textAlign: 'center' }}>
            <Typography variant="h3" color="success.main">
              {statistics.onDutyStaff || doctors.filter(s => s.status === 'active').length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              On Duty
            </Typography>
          </Card>
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <Card sx={{ py: 3, textAlign: 'center' }}>
            <Typography variant="h3" color="success.main">
              {statistics.availableStaff || doctors.filter(s => s.availability === 'available').length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Available Now
            </Typography>
          </Card>
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <Card sx={{ py: 3, textAlign: 'center' }}>
            <Typography variant="h3" color="info.main">
              {statistics.activeConsultations || doctors.reduce((sum, s) => sum + (s.activeConsultations || 0), 0)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Active Consultations
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
              placeholder="Search by name, ID, or specialization..."
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
              label="Department"
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              sx={{ minWidth: 160 }}
            >
              {DEPARTMENTS.map((dept) => (
                <MenuItem key={dept} value={dept}>
                  {dept}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              sx={{ minWidth: 120 }}
            >
              {STATUS_OPTIONS.map((status) => (
                <MenuItem key={status} value={status}>
                  {status}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Availability"
              value={filterAvailability}
              onChange={(e) => setFilterAvailability(e.target.value)}
              sx={{ minWidth: 140 }}
            >
              {AVAILABILITY_OPTIONS.map((avail) => (
                <MenuItem key={avail} value={avail}>
                  {avail}
                </MenuItem>
              ))}
            </TextField>
            <Button
              variant="contained"
              startIcon={<Iconify icon="solar:add-circle-bold" />}
              sx={{ minWidth: 140 }}
              onClick={() => setAddDoctorDialog(true)}
            >
              Add Doctor
            </Button>
          </Stack>
        </Box>

        {/* Staff Table */}
        <Scrollbar>
          <TableContainer sx={{ overflow: 'unset' }}>
            <Table sx={{ minWidth: 800 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Staff Member</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Availability</TableCell>
                  <TableCell>Patients</TableCell>
                  <TableCell>Consultations</TableCell>
                  <TableCell>Last Active</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredStaff
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((staff) => (
                    <TableRow
                      key={staff.id}
                      hover
                      onClick={() => handleStaffClick(staff)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={2}>
                          <Badge
                            badgeContent=""
                            color={staff.availability === 'available' ? 'success' : 'default'}
                            variant="dot"
                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                          >
                            <Avatar>
                              {staff.name.split(' ').map(n => n.charAt(0)).join('')}
                            </Avatar>
                          </Badge>
                          <Box>
                            <Typography variant="subtitle2">{staff.name}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {staff.title || `Dr. ${staff.specialization}`} • {staff.doctorId || staff.id || staff._id}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">{staff.department}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {staff.specialization}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={staff.status}
                          color={getStatusColor(staff.status) as any}
                          variant="soft"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={staff.availability}
                          color={getAvailabilityColor(staff.availability) as any}
                          variant="soft"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{staff.assignedPatients}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{staff.activeConsultations}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{staff.lastActive}</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <IconButton>
                          <Iconify icon="solar:chat-round-dots-bold" />
                        </IconButton>
                        <IconButton>
                          <Iconify icon="solar:phone-bold" />
                        </IconButton>
                        <IconButton>
                          <Iconify icon="solar:eye-bold" />
                        </IconButton>
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
          count={filteredStaff.length}
          rowsPerPage={rowsPerPage}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPageOptions={[5, 10, 25]}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </Card>

      {/* Staff Detail Dialog */}
      <Dialog open={detailDialog} onClose={() => setDetailDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar sx={{ width: 48, height: 48 }}>
              {selectedStaff?.name.split(' ').map((n: string) => n.charAt(0)).join('')}
            </Avatar>
            <Box>
              <Typography variant="h6">{selectedStaff?.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedStaff?.title} • {selectedStaff?.department}
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {selectedStaff && (
            <Grid container spacing={3}>
              <Grid xs={12} md={6}>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Professional Information
                  </Typography>
                  <Stack spacing={1}>
                    <Typography variant="body2">
                      <strong>License:</strong> {selectedStaff.license}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Experience:</strong> {selectedStaff.experience}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Shift:</strong> {selectedStaff.shift}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Email:</strong> {selectedStaff.email}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Phone:</strong> {selectedStaff.phone}
                    </Typography>
                  </Stack>
                </Box>
              </Grid>
              <Grid xs={12} md={6}>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Current Workload
                  </Typography>
                  <Stack spacing={1}>
                    <Typography variant="body2">
                      <strong>Assigned Patients:</strong> {selectedStaff.assignedPatients}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Active Consultations:</strong> {selectedStaff.activeConsultations}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Last Active:</strong> {selectedStaff.lastActive}
                    </Typography>
                  </Stack>
                </Box>
              </Grid>
              <Grid xs={12}>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Certifications
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {selectedStaff.certifications.map((cert: string, index: number) => (
                      <Chip key={index} label={cert} size="small" variant="outlined" />
                    ))}
                  </Stack>
                </Box>
              </Grid>
              <Grid xs={12}>
                <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                  <Chip
                    label={`Status: ${selectedStaff.status}`}
                    color={getStatusColor(selectedStaff.status) as any}
                    variant="soft"
                  />
                  <Chip
                    label={`Availability: ${selectedStaff.availability}`}
                    color={getAvailabilityColor(selectedStaff.availability) as any}
                    variant="soft"
                  />
                </Stack>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialog(false)}>Close</Button>
          <Button variant="outlined" startIcon={<Iconify icon="solar:chat-round-dots-bold" />}>
            Message
          </Button>
          <Button variant="contained" startIcon={<Iconify icon="solar:user-bold" />}>
            View Patients
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Doctor Dialog */}
      <AddDoctorDialog
        open={addDoctorDialog}
        onClose={() => setAddDoctorDialog(false)}
        onSuccess={() => {
          fetchDoctors();
          fetchStatistics();
        }}
      />
    </DashboardContent>
  );
}