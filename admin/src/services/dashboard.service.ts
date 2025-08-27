import thingSpeakService, { ThingSpeakDashboardData } from './thingspeak.service';
import alertsService, { CriticalAlert, AlertSummary } from './alerts.service';
import patientsService, { PatientStats, Patient, Doctor } from './patients.service';

// Aggregated dashboard data interface
export interface DashboardData {
  patients: {
    statistics: PatientStats | null;
    list: Patient[];
    totalCount: number;
  };
  doctors: {
    list: Doctor[];
    totalCount: number;
  };
  thingspeak: ThingSpeakDashboardData | null;
  alerts: {
    critical: CriticalAlert[];
    summary: AlertSummary | null;
  };
  systemHealth: {
    overall: number; // Percentage
    services: {
      thingspeak: 'online' | 'offline' | 'degraded';
      database: 'online' | 'offline' | 'degraded';
      api: 'online' | 'offline' | 'degraded';
    };
    lastUpdated: Date;
  };
  lastRefreshed: Date;
}

export interface RealTimeUpdate {
  type: 'alert' | 'patient_data' | 'system_health';
  data: any;
  timestamp: Date;
}

class DashboardService {
  private refreshInterval: NodeJS.Timeout | null = null;
  private subscribers: Array<(data: DashboardData) => void> = [];
  private currentData: DashboardData | null = null;

  /**
   * Get complete dashboard data
   */
  async getDashboardData(): Promise<DashboardData> {
    try {
      // Fetch all data in parallel for better performance
      const [
        thingspeakData,
        criticalAlerts,
        patientStats,
        patients,
        doctors
      ] = await Promise.all([
        thingSpeakService.getDashboardData(),
        alertsService.getCriticalAlerts({ limit: 20 }),
        patientsService.getPatientStatistics(),
        patientsService.getAllPatients({ role: 'patient', limit: 50 }),
        patientsService.getAllDoctors()
      ]);

      // Calculate overall system health
      let overallHealth = 100;
      const services = {
        thingspeak: 'online' as const,
        database: 'online' as const,
        api: 'online' as const
      };

      if (thingspeakData?.systemHealth) {
        if (thingspeakData.systemHealth.apiStatus === 'offline') {
          services.thingspeak = 'offline';
          overallHealth -= 30;
        } else if (thingspeakData.systemHealth.apiStatus === 'degraded') {
          services.thingspeak = 'degraded';
          overallHealth -= 15;
        }
        
        // Factor in response time
        if (thingspeakData.systemHealth.responseTime > 1000) {
          overallHealth -= 10;
        } else if (thingspeakData.systemHealth.responseTime > 500) {
          overallHealth -= 5;
        }
      } else {
        services.thingspeak = 'offline';
        overallHealth -= 30;
      }

      // Check if we can fetch patients (database health)
      if (patients.length === 0 && doctors.length === 0) {
        services.database = 'offline';
        overallHealth -= 40;
      }

      const dashboardData: DashboardData = {
        patients: {
          statistics: patientStats,
          list: patients,
          totalCount: patients.length
        },
        doctors: {
          list: doctors,
          totalCount: doctors.length
        },
        thingspeak: thingspeakData,
        alerts: {
          critical: criticalAlerts?.alerts || [],
          summary: criticalAlerts?.summary || null
        },
        systemHealth: {
          overall: Math.max(0, overallHealth),
          services,
          lastUpdated: new Date()
        },
        lastRefreshed: new Date()
      };

      this.currentData = dashboardData;
      this.notifySubscribers(dashboardData);
      
      return dashboardData;
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      
      // Return fallback data
      const fallbackData: DashboardData = {
        patients: {
          statistics: null,
          list: [],
          totalCount: 0
        },
        doctors: {
          list: [],
          totalCount: 0
        },
        thingspeak: null,
        alerts: {
          critical: [],
          summary: null
        },
        systemHealth: {
          overall: 0,
          services: {
            thingspeak: 'offline',
            database: 'offline',
            api: 'offline'
          },
          lastUpdated: new Date()
        },
        lastRefreshed: new Date()
      };

      return fallbackData;
    }
  }

  /**
   * Start automatic dashboard refresh
   */
  startAutoRefresh(intervalMs: number = 30000): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }

    this.refreshInterval = setInterval(async () => {
      try {
        await this.getDashboardData();
        console.log('Dashboard data refreshed automatically');
      } catch (error) {
        console.error('Auto-refresh failed:', error);
      }
    }, intervalMs);

    console.log(`Dashboard auto-refresh started (${intervalMs}ms interval)`);
  }

  /**
   * Stop automatic dashboard refresh
   */
  stopAutoRefresh(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
      console.log('Dashboard auto-refresh stopped');
    }
  }

  /**
   * Subscribe to dashboard data updates
   */
  subscribe(callback: (data: DashboardData) => void): () => void {
    this.subscribers.push(callback);
    
    // Send current data if available
    if (this.currentData) {
      callback(this.currentData);
    }

    // Return unsubscribe function
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  /**
   * Get current cached data
   */
  getCurrentData(): DashboardData | null {
    return this.currentData;
  }

  /**
   * Force refresh dashboard data
   */
  async refreshData(): Promise<DashboardData> {
    console.log('Manually refreshing dashboard data...');
    return this.getDashboardData();
  }

  /**
   * Get critical system alerts
   */
  async getCriticalSystemAlerts(): Promise<CriticalAlert[]> {
    try {
      const alertsResponse = await alertsService.getCriticalAlerts({
        severity: 'critical',
        acknowledged: false
      });
      
      return alertsResponse?.alerts || [];
    } catch (error) {
      console.error('Error fetching critical system alerts:', error);
      return [];
    }
  }

  /**
   * Get system performance metrics
   */
  async getSystemPerformance(): Promise<{
    apiResponseTime: number;
    uptime: number;
    activeConnections: number;
    errorRate: number;
  } | null> {
    try {
      const systemHealth = await thingSpeakService.getSystemHealth();
      
      if (systemHealth) {
        return {
          apiResponseTime: systemHealth.responseTime,
          uptime: systemHealth.uptime,
          activeConnections: systemHealth.activeChannels,
          errorRate: (systemHealth.errorChannels / systemHealth.totalChannels) * 100
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching system performance:', error);
      return null;
    }
  }

  /**
   * Notify all subscribers of data updates
   */
  private notifySubscribers(data: DashboardData): void {
    this.subscribers.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error notifying subscriber:', error);
      }
    });
  }

  /**
   * Check if system needs attention
   */
  isSystemHealthy(): boolean {
    if (!this.currentData) return false;
    
    const { systemHealth, alerts } = this.currentData;
    const criticalAlerts = alerts.critical.filter(alert => 
      alert.severity === 'critical' && !alert.acknowledged
    );
    
    return systemHealth.overall > 80 && criticalAlerts.length === 0;
  }

  /**
   * Get quick stats for overview cards
   */
  getQuickStats() {
    if (!this.currentData) return null;
    
    const { patients, alerts, thingspeak, systemHealth } = this.currentData;
    
    return {
      totalPatients: patients.totalCount,
      activeMonitoring: thingspeak?.channels.summary.active || 0,
      systemUptime: thingspeak?.systemHealth.uptime || 0,
      criticalAlerts: alerts.summary?.critical || 0,
      systemHealth: systemHealth.overall
    };
  }
}

// Export singleton instance
export const dashboardService = new DashboardService();
export default dashboardService;