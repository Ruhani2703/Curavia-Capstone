import { API_ENDPOINTS, apiRequest } from '../config/api';

// Test API connection
export const testApiConnection = async () => {
  try {
    const response = await fetch('http://localhost:5000/api/health');
    const data = await response.json();
    console.log('✅ Backend is running:', data);
    return true;
  } catch (error) {
    console.error('❌ Backend connection failed:', error);
    return false;
  }
};

// Test login with seeded credentials
export const testLogin = async (role = 'patient') => {
  const credentials = {
    admin: { email: 'admin@curavia.com', password: 'admin123' },
    doctor: { email: 'doctor@curavia.com', password: 'doctor123' },
    patient: { email: 'patient@curavia.com', password: 'patient123' }
  };

  try {
    const response = await apiRequest(API_ENDPOINTS.auth.login, {
      method: 'POST',
      body: JSON.stringify(credentials[role])
    });
    
    console.log(`✅ ${role} login successful:`, response.user);
    return response;
  } catch (error) {
    console.error(`❌ ${role} login failed:`, error);
    throw error;
  }
};

// Test patient dashboard data
export const testPatientDashboard = async (patientId) => {
  try {
    const response = await apiRequest(API_ENDPOINTS.patient.dashboard(patientId));
    console.log('✅ Patient dashboard data:', response);
    return response;
  } catch (error) {
    console.error('❌ Failed to fetch patient dashboard:', error);
    throw error;
  }
};