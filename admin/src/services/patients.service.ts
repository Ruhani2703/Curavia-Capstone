import apiHelper from 'src/utils/apiHelper';

// TypeScript interfaces for Patient data
export interface Patient {
  _id: string;
  name: string;
  email: string;
  patientId: string;
  role: 'patient';
  surgeryType: string;
  surgeryDate: Date;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  bloodGroup: string;
  height: number; // in cm
  weight: number; // in kg
  bandId?: string;
  isBandActive: boolean;
  assignedDoctor?: string;
  emergencyContact: {
    name: string;
    phone: string;
    relation: string;
  };
  thingspeakChannel?: {
    channelId: string;
    readApiKey: string;
    writeApiKey: string;
  };
  medications?: Array<{
    name: string;
    dosage: string;
    frequency: string;
    timings: string[];
    startDate: Date;
    endDate: Date;
    active: boolean;
  }>;
  expectedRecoveryTime?: number;
  actualRecoveryProgress: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Doctor {
  _id: string;
  name: string;
  email: string;
  role: 'doctor';
  specialization: string;
  department: string;
  licenseNumber: string;
  phone: string;
  experience: number;
  education: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SensorData {
  _id: string;
  userId: string;
  bandId: string;
  heartRate: {
    value: number;
    timestamp: Date;
  };
  bloodPressure: {
    systolic: number;
    diastolic: number;
    timestamp: Date;
  };
  spO2: {
    value: number;
    timestamp: Date;
  };
  temperature: {
    value: number;
    timestamp: Date;
  };
  batteryLevel?: number;
  dataQuality: 'excellent' | 'good' | 'fair' | 'poor';
  recordedAt: Date;
  syncedAt: Date;
}

export interface PatientStats {
  total: number;
  active: number;
  inactive: number;
  newToday: number;
  newThisWeek: number;
  newThisMonth: number;
  byGender: {
    male: number;
    female: number;
    other: number;
  };
  bySurgeryType: Record<string, number>;
  byRiskLevel?: Record<string, number>;
}

class PatientsService {
  private baseUrl = '';

  /**
   * Get all patients with optional filtering
   */
  async getAllPatients(params?: {
    role?: 'patient' | 'doctor';
    limit?: number;
    skip?: number;
    search?: string;
  }): Promise<Patient[]> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.role) queryParams.append('role', params.role);
      if (params?.limit) queryParams.append('limit', String(params.limit));
      if (params?.skip) queryParams.append('skip', String(params.skip));
      if (params?.search) queryParams.append('search', params.search);
      
      const url = `/admin/users${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await apiHelper.get(url);
      
      if (response.users) {
        return response.users.map((patient: any) => ({
          ...patient,
          surgeryDate: patient.surgeryDate ? new Date(patient.surgeryDate) : null,
          createdAt: new Date(patient.createdAt),
          updatedAt: new Date(patient.updatedAt),
          medications: patient.medications?.map((med: any) => ({
            ...med,
            startDate: new Date(med.startDate),
            endDate: new Date(med.endDate)
          }))
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching patients:', error);
      return [];
    }
  }

  /**
   * Get all doctors
   */
  async getAllDoctors(): Promise<Doctor[]> {
    try {
      const response = await apiHelper.get(`/admin/users?role=doctor`);
      
      if (response.users) {
        return response.users.map((doctor: any) => ({
          ...doctor,
          createdAt: new Date(doctor.createdAt),
          updatedAt: new Date(doctor.updatedAt)
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching doctors:', error);
      return [];
    }
  }

  /**
   * Get patient by ID
   */
  async getPatientById(patientId: string): Promise<Patient | null> {
    try {
      const response = await apiHelper.get(`${this.baseUrl}/admin/users/${patientId}`);
      
      if (response.success && response.data) {
        const patient = response.data;
        return {
          ...patient,
          surgeryDate: patient.surgeryDate ? new Date(patient.surgeryDate) : null,
          createdAt: new Date(patient.createdAt),
          updatedAt: new Date(patient.updatedAt),
          medications: patient.medications?.map((med: any) => ({
            ...med,
            startDate: new Date(med.startDate),
            endDate: new Date(med.endDate)
          }))
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching patient:', error);
      return null;
    }
  }

  /**
   * Get patient sensor data
   */
  async getPatientSensorData(
    patientId: string,
    params?: {
      limit?: number;
      startDate?: Date;
      endDate?: Date;
      dataType?: 'heartRate' | 'bloodPressure' | 'spO2' | 'temperature';
    }
  ): Promise<SensorData[]> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.limit) queryParams.append('limit', String(params.limit));
      if (params?.startDate) queryParams.append('startDate', params.startDate.toISOString());
      if (params?.endDate) queryParams.append('endDate', params.endDate.toISOString());
      if (params?.dataType) queryParams.append('dataType', params.dataType);
      
      const url = `${this.baseUrl}/sensor-data/patient/${patientId}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await apiHelper.get(url);
      
      if (response.success && response.data) {
        return response.data.map((data: any) => ({
          ...data,
          heartRate: data.heartRate ? {
            ...data.heartRate,
            timestamp: new Date(data.heartRate.timestamp)
          } : data.heartRate,
          bloodPressure: data.bloodPressure ? {
            ...data.bloodPressure,
            timestamp: new Date(data.bloodPressure.timestamp)
          } : data.bloodPressure,
          spO2: data.spO2 ? {
            ...data.spO2,
            timestamp: new Date(data.spO2.timestamp)
          } : data.spO2,
          temperature: data.temperature ? {
            ...data.temperature,
            timestamp: new Date(data.temperature.timestamp)
          } : data.temperature,
          recordedAt: new Date(data.recordedAt),
          syncedAt: new Date(data.syncedAt)
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching sensor data:', error);
      return [];
    }
  }

  /**
   * Get patient statistics
   */
  async getPatientStatistics(): Promise<PatientStats | null> {
    try {
      const response = await apiHelper.get(`/admin/statistics`);
      
      if (response && response.totalPatients !== undefined) {
        // Transform the backend response to match our interface
        return {
          total: response.totalPatients,
          active: response.activePatients,
          inactive: response.totalPatients - response.activePatients,
          newToday: 0, // Not available from backend
          newThisWeek: 0, // Not available from backend  
          newThisMonth: response.newPatientsThisMonth,
          byGender: {
            male: 0, // Not available from backend
            female: 0, // Not available from backend
            other: 0 // Not available from backend
          },
          bySurgeryType: {}, // Not available from backend
          byRiskLevel: {
            high: response.highRiskPatients,
            medium: 0, // Not available from backend
            low: 0 // Not available from backend
          }
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching patient statistics:', error);
      return null;
    }
  }

  /**
   * Create new patient
   */
  async createPatient(patientData: Partial<Patient>): Promise<Patient | null> {
    try {
      const response = await apiHelper.post(`${this.baseUrl}/admin/users`, {
        ...patientData,
        role: 'patient'
      });
      
      if (response.success && response.data) {
        return {
          ...response.data,
          surgeryDate: response.data.surgeryDate ? new Date(response.data.surgeryDate) : null,
          createdAt: new Date(response.data.createdAt),
          updatedAt: new Date(response.data.updatedAt)
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error creating patient:', error);
      return null;
    }
  }

  /**
   * Update patient
   */
  async updatePatient(patientId: string, patientData: Partial<Patient>): Promise<Patient | null> {
    try {
      const response = await apiHelper.put(`${this.baseUrl}/admin/users/${patientId}`, patientData);
      
      if (response.success && response.data) {
        return {
          ...response.data,
          surgeryDate: response.data.surgeryDate ? new Date(response.data.surgeryDate) : null,
          createdAt: new Date(response.data.createdAt),
          updatedAt: new Date(response.data.updatedAt)
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error updating patient:', error);
      return null;
    }
  }

  /**
   * Delete patient
   */
  async deletePatient(patientId: string): Promise<boolean> {
    try {
      const response = await apiHelper.delete(`${this.baseUrl}/admin/users/${patientId}`);
      
      return response.success === true;
    } catch (error) {
      console.error('Error deleting patient:', error);
      return false;
    }
  }
}

// Export singleton instance
export const patientsService = new PatientsService();
export default patientsService;