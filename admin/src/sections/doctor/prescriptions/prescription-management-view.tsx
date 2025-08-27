import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  Autocomplete,
  Stack,
  Paper,
  Divider
} from '@mui/material';
import { Icon } from '@iconify/react';
import apiHelper from 'src/utils/apiHelper';
import { 
  ILLNESS_TEMPLATES, 
  INDIAN_MEDICINES, 
  searchMedicines, 
  getMedicinesByCategory,
  generatePrescriptionFromTemplate,
  type IndianMedicine,
  type IllnessTemplate 
} from 'src/data/medicine-templates';

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

interface Prescription {
  _id: string;
  patientId: {
    _id: string;
    name: string;
    patientId: string;
  };
  medications: Medication[];
  diagnosis: string;
  notes: string;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  validUntil: string;
}

interface Patient {
  _id: string;
  name: string;
  patientId: string;
  surgeryType: string;
}

export function PrescriptionManagementView() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPrescription, setEditingPrescription] = useState<Prescription | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [newPrescription, setNewPrescription] = useState({
    patientId: '',
    diagnosis: '',
    notes: '',
    medications: [{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }],
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 30 days from now
  });

  const [showTemplates, setShowTemplates] = useState(false);
  const [medicineSearch, setMedicineSearch] = useState('');
  const [searchResults, setSearchResults] = useState<IndianMedicine[]>([]);
  const [selectedMedicineIndex, setSelectedMedicineIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchPrescriptions();
    fetchPatients();
  }, [searchTerm, statusFilter]);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const response = await apiHelper.get(`/doctor/prescriptions?${params.toString()}`);
      
      if (response.success) {
        setPrescriptions(response.data.prescriptions);
      } else {
        setError('Failed to load prescriptions');
      }
    } catch (err: any) {
      console.error('Prescriptions fetch error:', err);
      setError(err.message || 'Failed to load prescriptions');
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const response = await apiHelper.get('/doctor/patients');
      if (response.success) {
        setPatients(response.data.patients);
      }
    } catch (err: any) {
      console.error('Patients fetch error:', err);
    }
  };

  const handleSavePrescription = async () => {
    try {
      const prescriptionData = {
        ...newPrescription,
        medications: newPrescription.medications.filter(med => med.name.trim())
      };

      let response;
      if (editingPrescription) {
        response = await apiHelper.put(`/doctor/prescriptions/${editingPrescription._id}`, prescriptionData);
      } else {
        response = await apiHelper.post('/doctor/prescriptions', prescriptionData);
      }

      if (response.success) {
        setDialogOpen(false);
        resetForm();
        fetchPrescriptions();
      }
    } catch (err: any) {
      console.error('Save prescription error:', err);
      setError(err.message || 'Failed to save prescription');
    }
  };

  const handleEditPrescription = (prescription: Prescription) => {
    setEditingPrescription(prescription);
    setNewPrescription({
      patientId: prescription.patientId._id,
      diagnosis: prescription.diagnosis,
      notes: prescription.notes,
      medications: prescription.medications,
      validUntil: prescription.validUntil.split('T')[0]
    });
    setDialogOpen(true);
  };

  const handleDeletePrescription = async (prescriptionId: string) => {
    if (window.confirm('Are you sure you want to delete this prescription?')) {
      try {
        await apiHelper.delete(`/doctor/prescriptions/${prescriptionId}`);
        fetchPrescriptions();
      } catch (err: any) {
        console.error('Delete prescription error:', err);
        setError(err.message || 'Failed to delete prescription');
      }
    }
  };

  const resetForm = () => {
    setEditingPrescription(null);
    setNewPrescription({
      patientId: '',
      diagnosis: '',
      notes: '',
      medications: [{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }],
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });
  };

  const addMedication = () => {
    setNewPrescription({
      ...newPrescription,
      medications: [...newPrescription.medications, { name: '', dosage: '', frequency: '', duration: '', instructions: '' }]
    });
  };

  const removeMedication = (index: number) => {
    setNewPrescription({
      ...newPrescription,
      medications: newPrescription.medications.filter((_, i) => i !== index)
    });
  };

  const updateMedication = (index: number, field: keyof Medication, value: string) => {
    const updatedMedications = [...newPrescription.medications];
    updatedMedications[index] = { ...updatedMedications[index], [field]: value };
    setNewPrescription({ ...newPrescription, medications: updatedMedications });
  };

  const handleMedicineSearch = (query: string) => {
    setMedicineSearch(query);
    if (query.length > 2) {
      const results = searchMedicines(query);
      setSearchResults(results.slice(0, 10)); // Limit to 10 results
    } else {
      setSearchResults([]);
    }
  };

  const selectMedicineFromDatabase = (medicine: IndianMedicine, index: number) => {
    const dosage = medicine.short_composition1.match(/\((.*?)\)/)?.[1] || '';
    const updatedMedications = [...newPrescription.medications];
    updatedMedications[index] = {
      ...updatedMedications[index],
      name: medicine.name,
      dosage: dosage
    };
    setNewPrescription({ ...newPrescription, medications: updatedMedications });
    setSearchResults([]);
    setMedicineSearch('');
    setSelectedMedicineIndex(null);
  };

  const applyPrescriptionTemplate = (templateName: string) => {
    const selectedPatient = patients.find(p => p._id === newPrescription.patientId);
    if (!selectedPatient) {
      alert('Please select a patient first from the dropdown above');
      return;
    }

    const generatedPrescription = generatePrescriptionFromTemplate(templateName, selectedPatient.name);
    if (generatedPrescription) {
      setNewPrescription({
        ...newPrescription,
        diagnosis: generatedPrescription.diagnosis,
        notes: generatedPrescription.notes,
        medications: generatedPrescription.medications.map((med: any) => ({
          name: med.name,
          dosage: med.dosage,
          frequency: med.frequency,
          duration: med.duration,
          instructions: med.instructions
        })),
        validUntil: generatedPrescription.validUntil
      });
      setShowTemplates(false);
      // Open the prescription dialog with the pre-filled template
      setDialogOpen(true);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'completed': return 'default';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const filteredPrescriptions = prescriptions.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={40} />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading prescriptions...</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Prescription Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Create, manage and track patient prescriptions
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<Icon icon="material-symbols:auto-fix" width={20} />}
            onClick={() => setShowTemplates(true)}
          >
            Quick Templates
          </Button>
          <Button
            variant="contained"
            startIcon={<Icon icon="material-symbols:add" width={20} />}
            onClick={() => {
              resetForm();
              setDialogOpen(true);
            }}
          >
            New Prescription
          </Button>
        </Stack>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
            <TextField
              placeholder="Search prescriptions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ minWidth: 300 }}
              InputProps={{
                startAdornment: <Icon icon="material-symbols:search" style={{ marginRight: 8, color: '#666' }} width={20} />
              }}
            />
            
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Status"
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Prescriptions Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Patient</TableCell>
                <TableCell>Diagnosis</TableCell>
                <TableCell>Medications</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Valid Until</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPrescriptions.map((prescription) => (
                <TableRow key={prescription._id} hover>
                  <TableCell>
                    <Box>
                      <Typography variant="subtitle2">
                        {prescription.patientId.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ID: {prescription.patientId.patientId}
                      </Typography>
                    </Box>
                  </TableCell>
                  
                  <TableCell>
                    <Typography variant="body2">
                      {prescription.diagnosis}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Stack spacing={1}>
                      {prescription.medications.slice(0, 2).map((med, index) => (
                        <Typography key={index} variant="caption" sx={{ 
                          bgcolor: 'grey.100', 
                          px: 1, 
                          py: 0.5, 
                          borderRadius: 1,
                          fontSize: '0.75rem'
                        }}>
                          {med.name} - {med.dosage}
                        </Typography>
                      ))}
                      {prescription.medications.length > 2 && (
                        <Typography variant="caption" color="text.secondary">
                          +{prescription.medications.length - 2} more
                        </Typography>
                      )}
                    </Stack>
                  </TableCell>

                  <TableCell>
                    <Chip
                      label={prescription.status}
                      color={getStatusColor(prescription.status) as any}
                      variant="outlined"
                      size="small"
                    />
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2">
                      {new Date(prescription.createdAt).toLocaleDateString()}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2">
                      {new Date(prescription.validUntil).toLocaleDateString()}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <IconButton 
                        size="small"
                        onClick={() => handleEditPrescription(prescription)}
                      >
                        <Icon icon="material-symbols:edit" width={20} />
                      </IconButton>
                      <IconButton 
                        size="small"
                        onClick={() => handleDeletePrescription(prescription._id)}
                        color="error"
                      >
                        <Icon icon="material-symbols:delete" width={20} />
                      </IconButton>
                      <IconButton size="small">
                        <Icon icon="material-symbols:download" width={20} />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={prescriptions.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(event, newPage) => setPage(newPage)}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(parseInt(event.target.value, 10));
            setPage(0);
          }}
        />
      </Card>

      {/* Prescription Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingPrescription ? 'Edit Prescription' : 'New Prescription'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* Patient Selection */}
            <Grid item xs={12}>
              <Autocomplete
                options={patients}
                getOptionLabel={(option) => `${option.name} (${option.patientId})`}
                value={patients.find(p => p._id === newPrescription.patientId) || null}
                onChange={(event, newValue) => {
                  setNewPrescription({
                    ...newPrescription,
                    patientId: newValue?._id || ''
                  });
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Patient"
                    required
                  />
                )}
              />
            </Grid>

            {/* Diagnosis */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Diagnosis"
                value={newPrescription.diagnosis}
                onChange={(e) => setNewPrescription({ ...newPrescription, diagnosis: e.target.value })}
                required
              />
            </Grid>

            {/* Valid Until */}
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Valid Until"
                type="date"
                value={newPrescription.validUntil}
                onChange={(e) => setNewPrescription({ ...newPrescription, validUntil: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Medications Section */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Medications</Typography>
                <Button
                  startIcon={<Icon icon="material-symbols:add" width={20} />}
                  onClick={addMedication}
                  size="small"
                >
                  Add Medication
                </Button>
              </Box>
              
              {newPrescription.medications.map((medication, index) => (
                <Paper key={index} sx={{ p: 2, mb: 2 }} elevation={1}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ position: 'relative' }}>
                        <TextField
                          fullWidth
                          label="Medicine Name"
                          value={medication.name}
                          onChange={(e) => updateMedication(index, 'name', e.target.value)}
                          required
                          InputProps={{
                            endAdornment: (
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setSelectedMedicineIndex(index);
                                  handleMedicineSearch('');
                                }}
                              >
                                <Icon icon="material-symbols:search" width={20} />
                              </IconButton>
                            )
                          }}
                        />
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <TextField
                        fullWidth
                        label="Dosage"
                        value={medication.dosage}
                        onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                        placeholder="e.g., 500mg"
                      />
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <TextField
                        fullWidth
                        label="Frequency"
                        value={medication.frequency}
                        onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                        placeholder="e.g., Twice daily"
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Duration"
                        value={medication.duration}
                        onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                        placeholder="e.g., 7 days"
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', height: '100%' }}>
                        <TextField
                          fullWidth
                          label="Instructions"
                          value={medication.instructions}
                          onChange={(e) => updateMedication(index, 'instructions', e.target.value)}
                          placeholder="After meals"
                        />
                        {newPrescription.medications.length > 1 && (
                          <IconButton 
                            onClick={() => removeMedication(index)}
                            color="error"
                          >
                            <Icon icon="material-symbols:delete" width={20} />
                          </IconButton>
                        )}
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>
              ))}
            </Grid>

            {/* Notes */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Additional Notes"
                multiline
                rows={3}
                value={newPrescription.notes}
                onChange={(e) => setNewPrescription({ ...newPrescription, notes: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleSavePrescription}
            variant="contained"
            disabled={!newPrescription.patientId || !newPrescription.diagnosis}
          >
            {editingPrescription ? 'Update' : 'Create'} Prescription
          </Button>
        </DialogActions>
      </Dialog>

      {prescriptions.length === 0 && !loading && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Icon icon="material-symbols:local-pharmacy" style={{ fontSize: 64, color: '#666', marginBottom: 16 }} />
          <Typography variant="h6" color="text.secondary">
            No prescriptions found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create your first prescription to get started.
          </Typography>
        </Box>
      )}

      {/* Quick Templates Dialog */}
      <Dialog open={showTemplates} onClose={() => setShowTemplates(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Icon icon="material-symbols:auto-fix" width={24} />
            <Typography variant="h6">Quick Prescription Templates</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Select a patient and choose a common illness template to auto-generate prescription
          </Typography>
          
          {/* Patient Selection in Template Dialog */}
          <Autocomplete
            options={patients}
            getOptionLabel={(option) => `${option.name} (${option.patientId})`}
            value={patients.find(p => p._id === newPrescription.patientId) || null}
            onChange={(event, newValue) => {
              setNewPrescription({
                ...newPrescription,
                patientId: newValue?._id || ''
              });
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select Patient First"
                required
                sx={{ mb: 3 }}
              />
            )}
          />
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Then select a template to generate prescription with recommended medicines:
          </Typography>
          <Grid container spacing={2}>
            {ILLNESS_TEMPLATES.map((template) => (
              <Grid item xs={12} sm={6} md={4} key={template.name}>
                <Card 
                  sx={{ 
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover' },
                    height: '100%'
                  }}
                  onClick={() => applyPrescriptionTemplate(template.name)}
                >
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {template.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {template.diagnosis}
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      {template.symptoms.slice(0, 3).map((symptom, idx) => (
                        <Chip key={idx} label={symptom} size="small" variant="outlined" />
                      ))}
                      {template.symptoms.length > 3 && (
                        <Chip label={`+${template.symptoms.length - 3} more`} size="small" />
                      )}
                    </Stack>
                    <Typography variant="caption" color="primary" sx={{ mt: 1, display: 'block' }}>
                      {template.medicines.length} medicines included
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowTemplates(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Medicine Search Dialog */}
      <Dialog 
        open={selectedMedicineIndex !== null} 
        onClose={() => {
          setSelectedMedicineIndex(null);
          setSearchResults([]);
          setMedicineSearch('');
        }} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>Search Indian Medicines Database</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            placeholder="Search by medicine name, composition, or manufacturer..."
            value={medicineSearch}
            onChange={(e) => handleMedicineSearch(e.target.value)}
            sx={{ mb: 2, mt: 1 }}
            InputProps={{
              startAdornment: <Icon icon="material-symbols:search" style={{ marginRight: 8, color: '#666' }} width={20} />
            }}
          />
          
          {searchResults.length > 0 && (
            <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
              {searchResults.map((medicine) => (
                <Card 
                  key={medicine.id} 
                  sx={{ 
                    mb: 1, 
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover' }
                  }}
                  onClick={() => selectedMedicineIndex !== null && selectMedicineFromDatabase(medicine, selectedMedicineIndex)}
                >
                  <CardContent sx={{ py: 2 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {medicine.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {medicine.short_composition1} 
                          {medicine.short_composition2 && ` + ${medicine.short_composition2}`}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {medicine.manufacturer_name} • {medicine.pack_size_label}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Chip 
                          label={medicine.category} 
                          size="small" 
                          color="primary" 
                          variant="outlined" 
                          sx={{ mb: 1 }}
                        />
                        <Typography variant="subtitle2" color="primary">
                          ₹{medicine.price}
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
          
          {medicineSearch.length > 2 && searchResults.length === 0 && (
            <Alert severity="info">
              No medicines found matching your search. Try searching with different keywords.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setSelectedMedicineIndex(null);
            setSearchResults([]);
            setMedicineSearch('');
          }}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}