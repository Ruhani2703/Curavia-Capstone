import { useState, useEffect } from 'react';
import { apiRequest } from '../config/api';

// Generic API hook
export const useApi = (url, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await apiRequest(url, options);
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (url) {
      fetchData();
    }
  }, [url]);

  const refetch = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiRequest(url, options);
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, refetch };
};

// Hook for patient dashboard
export const usePatientDashboard = (patientId) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      if (!patientId) return;

      try {
        setLoading(true);
        const response = await apiRequest(`/api/patient/dashboard/${patientId}`);
        setDashboardData(response);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [patientId]);

  return { dashboardData, loading, error };
};

// Hook for real-time sensor data
export const useSensorData = (patientId, refreshInterval = 30000) => {
  const [sensorData, setSensorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!patientId) return;

    const fetchSensorData = async () => {
      try {
        const response = await apiRequest(`/api/sensor/latest/${patientId}`);
        setSensorData(response.data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchSensorData();

    // Set up interval for real-time updates
    const interval = setInterval(fetchSensorData, refreshInterval);

    return () => clearInterval(interval);
  }, [patientId, refreshInterval]);

  return { sensorData, loading, error };
};

// Hook for alerts
export const useAlerts = (patientId) => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAlerts = async () => {
      if (!patientId) return;

      try {
        setLoading(true);
        const response = await apiRequest(`/api/alert/patient/${patientId}?status=pending`);
        setAlerts(response.alerts);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, [patientId]);

  const acknowledgeAlert = async (alertId, notes) => {
    try {
      await apiRequest(`/api/alert/${alertId}/acknowledge`, {
        method: 'PUT',
        body: JSON.stringify({ notes })
      });
      
      // Refresh alerts
      const response = await apiRequest(`/api/alert/patient/${patientId}?status=pending`);
      setAlerts(response.alerts);
    } catch (err) {
      throw new Error(err.message);
    }
  };

  const resolveAlert = async (alertId, resolution) => {
    try {
      await apiRequest(`/api/alert/${alertId}/resolve`, {
        method: 'PUT',
        body: JSON.stringify({ resolution })
      });
      
      // Refresh alerts
      const response = await apiRequest(`/api/alert/patient/${patientId}?status=pending`);
      setAlerts(response.alerts);
    } catch (err) {
      throw new Error(err.message);
    }
  };

  return { alerts, loading, error, acknowledgeAlert, resolveAlert };
};