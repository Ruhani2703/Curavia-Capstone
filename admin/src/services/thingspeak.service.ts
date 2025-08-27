import apiHelper from 'src/utils/apiHelper';

// TypeScript interfaces for ThingSpeak data
export interface ThingSpeakChannel {
  id: string;
  channelId: string;
  patientName: string;
  patientId: string;
  status: 'active' | 'inactive' | 'error';
  lastUpdate: Date;
  dataPoints: number;
  surgeryType?: string;
  currentValues: {
    field1: number; // Heart Rate
    field2: number; // Blood Pressure Systolic
    field3: number; // Blood Pressure Diastolic
    field4: number; // Temperature
    field5: number; // SpO2
    field6: number; // Movement
    field7: number; // Fall Detection
    field8: number; // Battery Level
  };
  apiKeys: {
    read: string;
    write: string;
  };
}

export interface SystemHealth {
  apiStatus: 'online' | 'offline' | 'degraded';
  responseTime: number;
  uptime: number;
  totalChannels: number;
  activeChannels: number;
  inactiveChannels: number;
  errorChannels: number;
  dataPointsToday: number;
  bandwidth: number;
}

export interface ThingSpeakDashboardData {
  channels: {
    list: ThingSpeakChannel[];
    summary: {
      total: number;
      active: number;
      inactive: number;
      error: number;
    };
  };
  systemHealth: SystemHealth;
  alerts: {
    list: any[];
    summary: {
      total: number;
      critical: number;
      high: number;
      medium: number;
      low: number;
      unacknowledged: number;
    };
  };
  lastUpdated: string;
}

class ThingSpeakService {
  private baseUrl = '/thingspeak';

  /**
   * Get all patient channels with their current status
   */
  async getAllChannels(): Promise<ThingSpeakChannel[]> {
    try {
      const response = await apiHelper.get(`${this.baseUrl}/channels`);
      
      if (response.success && response.data?.channels) {
        return response.data.channels.map((channel: any) => ({
          ...channel,
          lastUpdate: new Date(channel.lastUpdate)
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching ThingSpeak channels:', error);
      return [];
    }
  }

  /**
   * Get system health metrics
   */
  async getSystemHealth(): Promise<SystemHealth | null> {
    try {
      const response = await apiHelper.get(`${this.baseUrl}/system-health`);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching system health:', error);
      return null;
    }
  }

  /**
   * Get comprehensive dashboard data in one call
   */
  async getDashboardData(): Promise<ThingSpeakDashboardData | null> {
    try {
      const response = await apiHelper.get(`${this.baseUrl}/dashboard-data`);
      
      if (response.success && response.data) {
        // Transform dates
        const data = response.data;
        if (data.channels?.list) {
          data.channels.list = data.channels.list.map((channel: any) => ({
            ...channel,
            lastUpdate: new Date(channel.lastUpdate)
          }));
        }
        
        return data;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      return null;
    }
  }

  /**
   * Get specific channel information
   */
  async getChannelInfo(channelId: string): Promise<any> {
    try {
      const response = await apiHelper.get(`${this.baseUrl}/channel/${channelId}`);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      return null;
    } catch (error) {
      console.error(`Error fetching channel ${channelId}:`, error);
      return null;
    }
  }

  /**
   * Update patient channel mapping
   */
  async updatePatientChannel(
    patientId: string, 
    channelData: { channelId: string; readApiKey: string; writeApiKey?: string }
  ): Promise<boolean> {
    try {
      const response = await apiHelper.post(
        `${this.baseUrl}/patient/${patientId}/channel`,
        channelData
      );
      
      return response.success === true;
    } catch (error) {
      console.error('Error updating patient channel:', error);
      return false;
    }
  }

  /**
   * Remove patient channel mapping
   */
  async removePatientChannel(patientId: string): Promise<boolean> {
    try {
      const response = await apiHelper.delete(`${this.baseUrl}/patient/${patientId}/channel`);
      
      return response.success === true;
    } catch (error) {
      console.error('Error removing patient channel:', error);
      return false;
    }
  }

  /**
   * Setup demo patient with ThingSpeak credentials
   */
  async setupDemoPatient(): Promise<any> {
    try {
      const response = await apiHelper.post(`${this.baseUrl}/setup-demo-patient`);
      
      return response;
    } catch (error) {
      console.error('Error setting up demo patient:', error);
      return { success: false, error: error };
    }
  }

  /**
   * Get live data for a specific patient
   */
  async getPatientLiveData(patientId: string, results: number = 20): Promise<any> {
    try {
      const response = await apiHelper.get(`${this.baseUrl}/patient/${patientId}/live-data?results=${results}`);
      
      return response;
    } catch (error) {
      console.error('Error fetching patient live data:', error);
      return { success: false, error: error };
    }
  }
}

// Export singleton instance
export const thingSpeakService = new ThingSpeakService();
export default thingSpeakService;