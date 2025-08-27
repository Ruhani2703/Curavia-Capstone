import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableBody from '@mui/material/TableBody';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';
import LinearProgress from '@mui/material/LinearProgress';

import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';

import { TableNoData } from '../table-no-data';
import { UserTableRow } from '../user-table-row';
import { UserTableHead } from '../user-table-head';
import { TableEmptyRows } from '../table-empty-rows';
import { UserTableToolbar } from '../user-table-toolbar';
import { emptyRows, applyFilter, getComparator } from '../utils';

// Mock data for Curavia patients (using UserProps interface structure)
const _patients = [
  {
    id: '1',
    name: 'John Smith',
    email: 'john.smith@email.com',
    company: 'Cardiac Bypass Surgery',
    role: 'High Risk Patient',
    isVerified: true,
    status: 'Active',
    avatarUrl: '/assets/images/avatars/avatar-1.jpg',
    // Extended patient data
    phone: '+1-555-0123',
    age: 45,
    gender: 'Male',
    surgeryType: 'Cardiac Bypass',
    bandId: 'BAND-001',
    bandStatus: 'Active',
    accountStatus: 'Active',
    riskScore: 85,
    recoveryProgress: 75,
    lastActivity: '2 hours ago',
    doctorAssigned: 'Dr. Sarah Wilson',
    admissionDate: '2024-01-15',
    expectedDischarge: '2024-02-15',
    vitals: {
      heartRate: 72,
      bloodPressure: '120/80',
      temperature: 98.6,
      oxygenSaturation: 98
    },
    alerts: ['High BP Alert', 'Medication Reminder'],
    communicationHistory: 15
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@email.com',
    company: 'Orthopedic Surgery',
    role: 'Low Risk Patient',
    isVerified: true,
    status: 'Active',
    avatarUrl: '/assets/images/avatars/avatar-2.jpg',
    phone: '+1-555-0124',
    age: 32,
    gender: 'Female',
    surgeryType: 'Orthopedic',
    bandId: 'BAND-002',
    bandStatus: 'Active',
    accountStatus: 'Active',
    riskScore: 45,
    recoveryProgress: 90,
    lastActivity: '30 minutes ago',
    doctorAssigned: 'Dr. Michael Chen',
    admissionDate: '2024-01-20',
    expectedDischarge: '2024-02-05',
    vitals: {
      heartRate: 68,
      bloodPressure: '115/75',
      temperature: 98.2,
      oxygenSaturation: 99
    },
    alerts: [],
    communicationHistory: 8
  },
  {
    id: '3',
    name: 'Mike Davis',
    email: 'mike.davis@email.com',
    company: 'Neurosurgery',
    role: 'Critical Patient',
    isVerified: false,
    status: 'Suspended',
    avatarUrl: '/assets/images/avatars/avatar-3.jpg',
    phone: '+1-555-0125',
    age: 58,
    gender: 'Male',
    surgeryType: 'Neurosurgery',
    bandId: 'BAND-003',
    bandStatus: 'Inactive',
    accountStatus: 'Suspended',
    riskScore: 92,
    recoveryProgress: 25,
    lastActivity: '2 days ago',
    doctorAssigned: 'Dr. Emily Rodriguez',
    admissionDate: '2024-01-25',
    expectedDischarge: '2024-03-01',
    vitals: {
      heartRate: 88,
      bloodPressure: '140/90',
      temperature: 99.1,
      oxygenSaturation: 95
    },
    alerts: ['Critical Alert', 'Device Offline', 'Missed Checkup'],
    communicationHistory: 23
  },
  {
    id: '4',
    name: 'Emily Brown',
    email: 'emily.brown@email.com',
    company: 'General Surgery',
    role: 'Low Risk Patient',
    isVerified: true,
    status: 'Active',
    avatarUrl: '/assets/images/avatars/avatar-4.jpg',
    phone: '+1-555-0126',
    age: 29,
    gender: 'Female',
    surgeryType: 'General Surgery',
    bandId: 'BAND-004',
    bandStatus: 'Active',
    accountStatus: 'Active',
    riskScore: 35,
    recoveryProgress: 95,
    lastActivity: '1 hour ago',
    doctorAssigned: 'Dr. Robert Kim',
    admissionDate: '2024-01-10',
    expectedDischarge: '2024-01-30',
    vitals: {
      heartRate: 65,
      bloodPressure: '110/70',
      temperature: 98.4,
      oxygenSaturation: 99
    },
    alerts: ['Recovery Complete'],
    communicationHistory: 12
  },
  {
    id: '5',
    name: 'David Wilson',
    email: 'david.wilson@email.com',
    company: 'Cardiac Surgery',
    role: 'Medium Risk Patient',
    isVerified: true,
    status: 'Active',
    avatarUrl: '/assets/images/avatars/avatar-5.jpg',
    phone: '+1-555-0127',
    age: 67,
    gender: 'Male',
    surgeryType: 'Cardiac Surgery',
    bandId: 'BAND-005',
    bandStatus: 'Active',
    accountStatus: 'Active',
    riskScore: 78,
    recoveryProgress: 60,
    lastActivity: '15 minutes ago',
    doctorAssigned: 'Dr. Lisa Thompson',
    admissionDate: '2024-01-22',
    expectedDischarge: '2024-02-20',
    vitals: {
      heartRate: 75,
      bloodPressure: '125/85',
      temperature: 98.8,
      oxygenSaturation: 97
    },
    alerts: ['Medication Due'],
    communicationHistory: 19
  }
];

import type { UserProps } from '../user-table-row';

// ----------------------------------------------------------------------

export function UserView() {
  const table = useTable();
  const [filterName, setFilterName] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<UserProps | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [bulkMenuAnchor, setBulkMenuAnchor] = useState<null | HTMLElement>(null);

  const dataFiltered: UserProps[] = applyFilter({
    inputData: _patients,
    comparator: getComparator(table.order, table.orderBy),
    filterName,
  });

  const notFound = !dataFiltered.length && !!filterName;

  const handleViewProfile = (patient: UserProps) => {
    setSelectedPatient(patient);
    setProfileOpen(true);
  };

  const handleBulkMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setBulkMenuAnchor(event.currentTarget);
  };

  const handleBulkMenuClose = () => {
    setBulkMenuAnchor(null);
  };

  const getRiskScoreColor = (score: number) => {
    if (score >= 80) return 'error';
    if (score >= 60) return 'warning';
    return 'success';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'success';
      case 'Suspended': return 'error';
      case 'Pending': return 'warning';
      default: return 'default';
    }
  };

  const getBandStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'success';
      case 'Inactive': return 'error';
      case 'Maintenance': return 'warning';
      default: return 'default';
    }
  };

  return (
    <DashboardContent>
      <Box sx={{ mb: 5, display: 'flex', alignItems: 'center' }}>
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          Patient Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {table.selected.length > 0 && (
            <Button
              variant="outlined"
              color="primary"
              startIcon={<Iconify icon="eva:options-2-fill" />}
              onClick={handleBulkMenuOpen}
            >
              Bulk Actions ({table.selected.length})
            </Button>
          )}
          <Button
            variant="contained"
            color="inherit"
            startIcon={<Iconify icon="mingcute:add-line" />}
          >
            Add Patient
          </Button>
        </Box>
      </Box>

      <Card>
        <UserTableToolbar
          numSelected={table.selected.length}
          filterName={filterName}
          onFilterName={(event: React.ChangeEvent<HTMLInputElement>) => {
            setFilterName(event.target.value);
            table.onResetPage();
          }}
        />

        <Scrollbar>
          <TableContainer sx={{ overflow: 'unset' }}>
            <Table sx={{ minWidth: 800 }}>
              <UserTableHead
                order={table.order}
                orderBy={table.orderBy}
                rowCount={_patients.length}
                numSelected={table.selected.length}
                onSort={table.onSort}
                onSelectAllRows={(checked) =>
                  table.onSelectAllRows(
                    checked,
                    _patients.map((patient) => patient.id)
                  )
                }
                headLabel={[
                  { id: 'name', label: 'Patient Name' },
                  { id: 'company', label: 'Surgery Type' },
                  { id: 'role', label: 'Risk Level' },
                  { id: 'isVerified', label: 'Band Status', align: 'center' },
                  { id: 'status', label: 'Account Status' },
                  { id: '' },
                ]}
              />
              <TableBody>
                {dataFiltered
                  .slice(
                    table.page * table.rowsPerPage,
                    table.page * table.rowsPerPage + table.rowsPerPage
                  )
                  .map((row) => (
                    <UserTableRow
                      key={row.id}
                      row={row}
                      selected={table.selected.includes(row.id)}
                      onSelectRow={() => table.onSelectRow(row.id)}
                      onViewProfile={() => handleViewProfile(row)}
                    />
                  ))}

                <TableEmptyRows
                  height={68}
                  emptyRows={emptyRows(table.page, table.rowsPerPage, _patients.length)}
                />

                {notFound && <TableNoData searchQuery={filterName} />}
              </TableBody>
            </Table>
          </TableContainer>
        </Scrollbar>

        <TablePagination
          component="div"
          page={table.page}
          count={dataFiltered.length}
          rowsPerPage={table.rowsPerPage}
          onPageChange={table.onChangePage}
          rowsPerPageOptions={[5, 10, 25, 50]}
          onRowsPerPageChange={table.onChangeRowsPerPage}
        />
      </Card>

      {/* Bulk Actions Menu */}
      <Menu
        anchorEl={bulkMenuAnchor}
        open={Boolean(bulkMenuAnchor)}
        onClose={handleBulkMenuClose}
      >
        <MenuItem onClick={handleBulkMenuClose}>
          <Iconify icon="eva:email-outline" sx={{ mr: 1 }} />
          Send Notifications
        </MenuItem>
        <MenuItem onClick={handleBulkMenuClose}>
          <Iconify icon="eva:download-outline" sx={{ mr: 1 }} />
          Export Patient Data
        </MenuItem>
        <MenuItem onClick={handleBulkMenuClose}>
          <Iconify icon="eva:person-done-outline" sx={{ mr: 1 }} />
          Activate Accounts
        </MenuItem>
        <MenuItem onClick={handleBulkMenuClose}>
          <Iconify icon="eva:person-remove-outline" sx={{ mr: 1 }} />
          Suspend Accounts
        </MenuItem>
        <MenuItem onClick={handleBulkMenuClose}>
          <Iconify icon="eva:settings-outline" sx={{ mr: 1 }} />
          Bulk Band Assignment
        </MenuItem>
      </Menu>

      {/* Patient Profile Dialog */}
      <Dialog
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ pb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              src={selectedPatient?.avatarUrl}
              sx={{ width: 64, height: 64 }}
            />
            <Box>
              <Typography variant="h5">{selectedPatient?.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                Patient ID: {selectedPatient?.id} | Band: {selectedPatient?.bandId}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          {selectedPatient && (
            <Grid container spacing={3}>
              {/* Basic Information */}
              <Grid item xs={12} md={6}>
                <Card sx={{ p: 3, height: 'fit-content' }}>
                  <Typography variant="h6" gutterBottom>
                    Basic Information
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography><strong>Age:</strong> {selectedPatient.age}</Typography>
                    <Typography><strong>Gender:</strong> {selectedPatient.gender}</Typography>
                    <Typography><strong>Email:</strong> {selectedPatient.email}</Typography>
                    <Typography><strong>Phone:</strong> {selectedPatient.phone}</Typography>
                    <Typography><strong>Doctor:</strong> {selectedPatient.doctorAssigned}</Typography>
                    <Typography><strong>Admission:</strong> {selectedPatient.admissionDate}</Typography>
                    <Typography><strong>Expected Discharge:</strong> {selectedPatient.expectedDischarge}</Typography>
                  </Box>
                </Card>
              </Grid>

              {/* Medical Information */}
              <Grid item xs={12} md={6}>
                <Card sx={{ p: 3, height: 'fit-content' }}>
                  <Typography variant="h6" gutterBottom>
                    Medical Information
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box>
                      <Typography variant="subtitle2">Surgery Type</Typography>
                      <Chip 
                        label={selectedPatient.company} 
                        color="primary" 
                        size="small" 
                      />
                    </Box>
                    <Box>
                      <Typography variant="subtitle2">Risk Level</Typography>
                      <Chip 
                        label={selectedPatient.role} 
                        color={getRiskScoreColor(selectedPatient.riskScore)} 
                        size="small" 
                      />
                    </Box>
                    <Box>
                      <Typography variant="subtitle2">Risk Score</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={selectedPatient.riskScore}
                          color={getRiskScoreColor(selectedPatient.riskScore)}
                          sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                        />
                        <Typography variant="body2" fontWeight="bold">
                          {selectedPatient.riskScore}%
                        </Typography>
                      </Box>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2">Recovery Progress</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={selectedPatient.recoveryProgress}
                          color="success"
                          sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                        />
                        <Typography variant="body2" fontWeight="bold">
                          {selectedPatient.recoveryProgress}%
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Card>
              </Grid>

              {/* Current Vitals */}
              <Grid item xs={12} md={6}>
                <Card sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Current Vitals
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'background.neutral', borderRadius: 1 }}>
                        <Typography variant="h4" color="primary">
                          {selectedPatient.vitals?.heartRate || 'N/A'}
                        </Typography>
                        <Typography variant="body2">Heart Rate (BPM)</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'background.neutral', borderRadius: 1 }}>
                        <Typography variant="h4" color="primary">
                          {selectedPatient.vitals?.bloodPressure || 'N/A'}
                        </Typography>
                        <Typography variant="body2">Blood Pressure</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'background.neutral', borderRadius: 1 }}>
                        <Typography variant="h4" color="primary">
                          {selectedPatient.vitals?.temperature || 'N/A'}°F
                        </Typography>
                        <Typography variant="body2">Temperature</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'background.neutral', borderRadius: 1 }}>
                        <Typography variant="h4" color="primary">
                          {selectedPatient.vitals?.oxygenSaturation || 'N/A'}%
                        </Typography>
                        <Typography variant="body2">Oxygen Sat</Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Card>
              </Grid>

              {/* Band & Account Status */}
              <Grid item xs={12} md={6}>
                <Card sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Device & Account Status
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Band Status
                      </Typography>
                      <Chip
                        label={selectedPatient.isVerified ? `Active - ${selectedPatient.bandId}` : `Inactive - ${selectedPatient.bandId}`}
                        color={selectedPatient.isVerified ? 'success' : 'error'}
                        variant="outlined"
                      />
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Account Status
                      </Typography>
                      <Chip
                        label={selectedPatient.status}
                        color={getStatusColor(selectedPatient.status)}
                      />
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Last Activity
                      </Typography>
                      <Typography>{selectedPatient.lastActivity}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Communications
                      </Typography>
                      <Typography>{selectedPatient.communicationHistory} messages</Typography>
                    </Box>
                  </Box>
                </Card>
              </Grid>

              {/* Active Alerts */}
              <Grid item xs={12}>
                <Card sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Active Alerts
                  </Typography>
                  {selectedPatient.alerts && selectedPatient.alerts.length > 0 ? (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {selectedPatient.alerts.map((alert, index) => (
                        <Chip
                          key={index}
                          label={alert}
                          color={alert.includes('Critical') ? 'error' : alert.includes('High') ? 'warning' : 'info'}
                          size="small"
                          icon={<Iconify icon="eva:alert-triangle-fill" />}
                        />
                      ))}
                    </Box>
                  ) : (
                    <Typography color="text.secondary">No active alerts</Typography>
                  )}
                </Card>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setProfileOpen(false)}>Close</Button>
          <Button variant="contained" startIcon={<Iconify icon="eva:edit-fill" />}>
            Edit Patient
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<Iconify icon="eva:message-circle-fill" />}
          >
            Send Message
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardContent>
  );
}

// ----------------------------------------------------------------------

export function useTable() {
  const [page, setPage] = useState(0);
  const [orderBy, setOrderBy] = useState('name');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selected, setSelected] = useState<string[]>([]);
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');

  const onSort = useCallback(
    (id: string) => {
      const isAsc = orderBy === id && order === 'asc';
      setOrder(isAsc ? 'desc' : 'asc');
      setOrderBy(id);
    },
    [order, orderBy]
  );

  const onSelectAllRows = useCallback((checked: boolean, newSelecteds: string[]) => {
    if (checked) {
      setSelected(newSelecteds);
      return;
    }
    setSelected([]);
  }, []);

  const onSelectRow = useCallback(
    (inputValue: string) => {
      const newSelected = selected.includes(inputValue)
        ? selected.filter((value) => value !== inputValue)
        : [...selected, inputValue];

      setSelected(newSelected);
    },
    [selected]
  );

  const onResetPage = useCallback(() => {
    setPage(0);
  }, []);

  const onChangePage = useCallback((event: unknown, newPage: number) => {
    setPage(newPage);
  }, []);

  const onChangeRowsPerPage = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setRowsPerPage(parseInt(event.target.value, 10));
      onResetPage();
    },
    [onResetPage]
  );

  return {
    page,
    order,
    onSort,
    orderBy,
    selected,
    rowsPerPage,
    onSelectRow,
    onResetPage,
    onChangePage,
    onSelectAllRows,
    onChangeRowsPerPage,
  };
}