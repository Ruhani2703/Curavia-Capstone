const axios = require('axios');
const SensorData = require('../models/SensorData');
const User = require('../models/User');
const Alert = require('../models/Alert');
const mlService = require('./mlService');

// ThingSpeak configuration
const BASE_URL = 'https://api.thingspeak.com';
const CHANNEL_ID = process.env.THINGSPEAK_CHANNEL_ID;
const READ_API_KEY = process.env.THINGSPEAK_READ_API_KEY;
const WRITE_API_KEY = process.env.THINGSPEAK_WRITE_API_KEY;

// Alert thresholds from environment variables
const THRESHOLDS = {
  BPM_MIN: parseInt(process.env.ALERT_BPM_MIN) || 60,
  BPM_MAX: parseInt(process.env.ALERT_BPM_MAX) || 100,
  SPO2_MIN: parseInt(process.env.ALERT_SPO2_MIN) || 95,
  TEMP_MAX: parseFloat(process.env.ALERT_TEMP_MAX) || 99.5,
  BP_SYSTOLIC_MAX: parseInt(process.env.ALERT_BP_SYSTOLIC_MAX) || 140,
  BP_DIASTOLIC_MAX: parseInt(process.env.ALERT_BP_DIASTOLIC_MAX) || 90
};

// Enhanced ThingSpeak Service Class for Multi-Patient Support
class ThingSpeakService {
  constructor() {
    this.timeout = 10000; // 10 seconds timeout
  }

  /**
   * Get channel information from ThingSpeak
   * @param {string} channelId - ThingSpeak channel ID
   * @param {string} readApiKey - Read API key for the channel
   * @returns {Object} Channel information
   */
  async getChannelInfo(channelId, readApiKey) {
    try {
      const response = await axios.get(
        `${BASE_URL}/channels/${channelId}.json`,
        {
          params: {
            api_key: readApiKey
          },
          timeout: this.timeout
        }
      );

      return {
        success: true,
        data: response.data,
        status: 'active'
      };
    } catch (error) {
      console.error(`Error fetching channel ${channelId}:`, error.message);
      return {
        success: false,
        error: error.message,
        status: 'error'
      };
    }
  }

  /**
   * Get latest data feeds from a ThingSpeak channel
   * @param {string} channelId - ThingSpeak channel ID
   * @param {string} readApiKey - Read API key for the channel
   * @param {number} results - Number of results to return (default: 1)
   * @returns {Object} Latest feed data
   */
  async getChannelFeeds(channelId, readApiKey, results = 1) {
    try {
      const response = await axios.get(
        `${BASE_URL}/channels/${channelId}/feeds.json`,
        {
          params: {
            api_key: readApiKey,
            results: results
          },
          timeout: this.timeout
        }
      );

      const feeds = response.data.feeds || [];
      const latestFeed = feeds.length > 0 ? feeds[feeds.length - 1] : null;

      return {
        success: true,
        data: {
          channel: response.data.channel,
          feeds: feeds,
          latest: latestFeed
        },
        lastUpdate: latestFeed ? new Date(latestFeed.created_at) : null
      };
    } catch (error) {
      console.error(`Error fetching feeds for channel ${channelId}:`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get all patients with their ThingSpeak channel status
   * @returns {Array} Array of patient channel information
   */
  async getAllPatientChannels() {
    try {
      const patients = await User.find({ 
        role: 'patient',
        'thingspeakChannel.channelId': { $exists: true, $ne: '' }
      }).select('patientId firstName lastName thingspeakChannel surgeryType');

      const channelPromises = patients.map(async (patient) => {
        const { channelId, readApiKey } = patient.thingspeakChannel;
        
        if (!channelId || !readApiKey) {
          return {
            patientId: patient.patientId,
            patientName: `${patient.firstName} ${patient.lastName}`,
            channelId: channelId || 'N/A',
            status: 'inactive',
            error: 'Missing channel configuration'
          };
        }

        const feeds = await this.getChannelFeeds(channelId, readApiKey, 1);
        const channelInfo = await this.getChannelInfo(channelId, readApiKey);

        let status = 'inactive';
        let lastUpdate = null;
        let currentValues = {};

        if (feeds.success && feeds.lastUpdate) {
          const timeDiff = Date.now() - feeds.lastUpdate.getTime();
          const hoursAgo = timeDiff / (1000 * 60 * 60);
          
          if (hoursAgo < 1) {
            status = 'active';
          } else if (hoursAgo < 4) {
            status = 'inactive';
          } else {
            status = 'error';
          }

          lastUpdate = feeds.lastUpdate;
          
          if (feeds.data.latest) {
            currentValues = {
              field1: parseFloat(feeds.data.latest.field1) || 0, // BP Systolic
              field2: parseFloat(feeds.data.latest.field2) || 0, // BP Diastolic
              field3: parseFloat(feeds.data.latest.field3) || 0, // Heart Rate
              field4: parseFloat(feeds.data.latest.field4) || 0, // Temperature
              field5: parseFloat(feeds.data.latest.field5) || 0, // SpO2
              field6: parseFloat(feeds.data.latest.field6) || 0, // Movement
              field7: parseFloat(feeds.data.latest.field7) || 0, // Fall Detection
              field8: parseFloat(feeds.data.latest.field8) || 0  // Battery Level
            };
          }
        }

        return {
          id: patient._id.toString(),
          patientId: patient.patientId,
          patientName: `${patient.firstName} ${patient.lastName}`,
          channelId: channelId,
          status: status,
          lastUpdate: lastUpdate,
          currentValues: currentValues,
          surgeryType: patient.surgeryType,
          apiKeys: {
            read: readApiKey,
            write: patient.thingspeakChannel.writeApiKey
          },
          dataPoints: channelInfo.success ? 1000 : 0
        };
      });

      const channelResults = await Promise.all(channelPromises);
      return channelResults;
    } catch (error) {
      console.error('Error fetching patient channels:', error);
      return [];
    }
  }

  /**
   * Get system health metrics for ThingSpeak integration
   * @returns {Object} System health information
   */
  async getSystemHealth() {
    try {
      const channels = await this.getAllPatientChannels();
      
      const totalChannels = channels.length;
      const activeChannels = channels.filter(c => c.status === 'active').length;
      const inactiveChannels = channels.filter(c => c.status === 'inactive').length;
      const errorChannels = channels.filter(c => c.status === 'error').length;

      // Test API response time
      const start = Date.now();
      try {
        await axios.get(`${BASE_URL}/channels/1.json`, { timeout: 5000 });
      } catch (e) {
        // Ignore test error
      }
      const responseTime = Date.now() - start;

      // Calculate bandwidth usage (estimated)
      const bandwidthUsage = Math.min(95, (activeChannels / Math.max(totalChannels, 1)) * 100);

      return {
        apiStatus: 'online',
        responseTime: responseTime,
        uptime: 99.97, // Mock uptime
        totalChannels: totalChannels,
        activeChannels: activeChannels,
        inactiveChannels: inactiveChannels,
        errorChannels: errorChannels,
        dataPointsToday: activeChannels * 24 * 60, // Estimate: 1 data point per minute
        bandwidth: Math.round(bandwidthUsage)
      };
    } catch (error) {
      console.error('Error getting system health:', error);
      return {
        apiStatus: 'offline',
        responseTime: 0,
        uptime: 0,
        totalChannels: 0,
        activeChannels: 0,
        inactiveChannels: 0,
        errorChannels: 0,
        dataPointsToday: 0,
        bandwidth: 0
      };
    }
  }

  /**
   * Generate critical alerts based on patient data
   * @returns {Array} Array of critical alerts
   */
  async generateCriticalAlerts() {
    try {
      const channels = await this.getAllPatientChannels();
      const alerts = [];

      for (const channel of channels) {
        if (channel.status === 'error') {
          alerts.push({
            id: `device_${channel.patientId}`,
            patientId: channel.patientId,
            patientName: channel.patientName,
            type: 'device_offline',
            severity: 'critical',
            message: 'Monitoring device offline for extended period',
            timestamp: new Date(),
            acknowledged: false,
            resolved: false,
            location: 'Home',
            autoGenerated: true
          });
        }

        if (channel.currentValues) {
          const { field1, field2, field3, field4, field5, field8 } = channel.currentValues;

          // High blood pressure alert
          if (field1 > 140 || field2 > 90) {
            alerts.push({
              id: `bp_${channel.patientId}_${Date.now()}`,
              patientId: channel.patientId,
              patientName: channel.patientName,
              type: 'high_bp',
              severity: field1 > 160 || field2 > 100 ? 'high' : 'medium',
              message: `Blood pressure elevated: ${Math.round(field1)}/${Math.round(field2)} mmHg`,
              value: field1,
              normalRange: '90-140 mmHg',
              timestamp: new Date(),
              acknowledged: false,
              resolved: false,
              location: 'Home',
              autoGenerated: true
            });
          }

          // Low oxygen alert
          if (field5 < 95 && field5 > 0) {
            alerts.push({
              id: `oxygen_${channel.patientId}_${Date.now()}`,
              patientId: channel.patientId,
              patientName: channel.patientName,
              type: 'low_oxygen',
              severity: field5 < 90 ? 'high' : 'medium',
              message: `Blood oxygen level below normal: ${Math.round(field5)}%`,
              value: field5,
              normalRange: '95-100%',
              timestamp: new Date(),
              acknowledged: false,
              resolved: false,
              location: 'Home',
              autoGenerated: true
            });
          }

          // Irregular heartbeat alert
          if (field3 > 100 || field3 < 60) {
            if (field3 > 0) { // Only if we have valid data
              alerts.push({
                id: `heartbeat_${channel.patientId}_${Date.now()}`,
                patientId: channel.patientId,
                patientName: channel.patientName,
                type: 'irregular_heartbeat',
                severity: field3 > 120 || field3 < 50 ? 'high' : 'medium',
                message: field3 > 100 ? 'Heart rate elevated' : 'Heart rate below normal',
                value: field3,
                normalRange: '60-100 bpm',
                timestamp: new Date(),
                acknowledged: false,
                resolved: false,
                location: 'Home',
                autoGenerated: true
              });
            }
          }

          // Low battery alert
          if (field8 < 20 && field8 > 0) {
            alerts.push({
              id: `battery_${channel.patientId}_${Date.now()}`,
              patientId: channel.patientId,
              patientName: channel.patientName,
              type: 'battery_low',
              severity: field8 < 10 ? 'high' : 'medium',
              message: `Device battery low: ${Math.round(field8)}%`,
              value: field8,
              normalRange: '20-100%',
              timestamp: new Date(),
              acknowledged: false,
              resolved: false,
              location: 'Home',
              autoGenerated: true
            });
          }
        }
      }

      return alerts;
    } catch (error) {
      console.error('Error generating critical alerts:', error);
      return [];
    }
  }
}

// Legacy function for backward compatibility
/**
 * Fetch latest data from ThingSpeak channel
 */
async function fetchThingSpeakData() {
  try {
    // Check if environment variables are loaded
    if (!CHANNEL_ID || !READ_API_KEY) {
      throw new Error('ThingSpeak configuration missing: CHANNEL_ID or READ_API_KEY not defined');
    }

    // Fetch latest feeds from ThingSpeak
    const url = `${BASE_URL}/channels/${CHANNEL_ID}/feeds.json`;
    const response = await axios.get(url, {
      params: {
        api_key: READ_API_KEY,
        results: 10 // Get last 10 entries
      }
    });

    const { channel, feeds } = response.data;
    
    if (!feeds || feeds.length === 0) {
      console.log('No new data from ThingSpeak');
      return;
    }

    // Process each feed entry
    for (const feed of feeds) {
      // Skip if we've already processed this entry
      if (feed.entry_id <= lastEntryId) {
        continue;
      }

      await processSensorData(feed, channel);
      lastEntryId = feed.entry_id;
    }

    console.log(`Processed ${feeds.length} entries from ThingSpeak`);
  } catch (error) {
    console.error('Error fetching ThingSpeak data:', error.message);
  }
}

/**
 * Process and store sensor data
 */
async function processSensorData(feed, channel) {
  try {
    // Parse sensor values
    const bpm = parseFloat(feed.field1);
    const spO2 = parseFloat(feed.field2);
    const temperature = parseFloat(feed.field3);
    const ecg = parseFloat(feed.field4);

    // Find user by band ID (for demo, we'll use a default user)
    // In production, you'd map ThingSpeak channel to specific user's band
    const user = await User.findOne({ 
      role: 'patient',
      isBandActive: true 
    }).sort({ createdAt: -1 });

    if (!user) {
      console.log('No active patient found for sensor data');
      return;
    }

    // Create sensor data document
    const sensorData = new SensorData({
      userId: user._id,
      bandId: user.bandId || 'DEFAULT-BAND',
      heartRate: {
        value: bpm,
        timestamp: new Date(feed.created_at)
      },
      spO2: {
        value: spO2,
        timestamp: new Date(feed.created_at)
      },
      temperature: {
        value: temperature,
        timestamp: new Date(feed.created_at)
      },
      ecg: {
        value: ecg,
        timestamp: new Date(feed.created_at)
      },
      // For demo purposes, we'll simulate blood pressure based on heart rate
      bloodPressure: {
        systolic: Math.round(120 + (bpm - 75) * 0.5),
        diastolic: Math.round(80 + (bpm - 75) * 0.3),
        timestamp: new Date(feed.created_at)
      },
      thingspeakData: {
        channelId: channel.id.toString(),
        entryId: feed.entry_id,
        field1: bpm,
        field2: spO2,
        field3: temperature,
        field4: ecg,
        createdAt: new Date(feed.created_at)
      },
      recordedAt: new Date(feed.created_at),
      syncedAt: new Date()
    });

    // Save sensor data
    await sensorData.save();

    // Run ML anomaly detection
    try {
      const mlPrediction = await mlService.processSensorData(sensorData);
      
      // Store ML prediction with sensor data
      sensorData.mlPrediction = {
        is_anomaly: mlPrediction.is_anomaly,
        risk_score: mlPrediction.risk_score,
        severity: mlPrediction.severity,
        anomaly_types: mlPrediction.anomaly_types,
        processed_at: new Date()
      };
      await sensorData.save();
      
      // Create ML-based alert if needed
      if (mlPrediction.alertRequired) {
        const mlAlert = new Alert({
          userId: user._id,
          type: 'ml_anomaly',
          severity: mlPrediction.severity,
          title: `ML Detected ${mlPrediction.severity} Anomaly`,
          message: mlPrediction.recommendations[0] || 'Anomaly detected by ML model',
          details: {
            anomaly_types: mlPrediction.anomaly_types,
            risk_score: mlPrediction.risk_score,
            vital_signs: mlPrediction.originalData
          },
          mlPrediction: mlPrediction
        });
        await mlAlert.save();
        console.log(`ML Alert created: ${mlPrediction.severity} severity for ${user.name}`);
      }
    } catch (mlError) {
      console.error('ML prediction error:', mlError.message);
      // Continue even if ML fails
    }

    // Check for alerts (traditional threshold-based)
    await checkAndCreateAlerts(sensorData, user);

    console.log(`Stored sensor data for user ${user.name} (Entry: ${feed.entry_id})`);
  } catch (error) {
    console.error('Error processing sensor data:', error.message);
  }
}

/**
 * Check sensor values and create alerts if needed
 */
async function checkAndCreateAlerts(sensorData, user) {
  const alerts = [];

  // Check heart rate
  if (sensorData.heartRate.value < THRESHOLDS.BPM_MIN) {
    alerts.push({
      userId: user._id,
      type: 'vital_breach',
      severity: 'high',
      title: 'Low Heart Rate Alert',
      message: `Heart rate is critically low at ${sensorData.heartRate.value} bpm`,
      details: {
        parameter: 'heartRate',
        currentValue: sensorData.heartRate.value,
        normalRange: { min: THRESHOLDS.BPM_MIN, max: THRESHOLDS.BPM_MAX }
      }
    });
  } else if (sensorData.heartRate.value > THRESHOLDS.BPM_MAX) {
    alerts.push({
      userId: user._id,
      type: 'vital_breach',
      severity: 'high',
      title: 'High Heart Rate Alert',
      message: `Heart rate is elevated at ${sensorData.heartRate.value} bpm`,
      details: {
        parameter: 'heartRate',
        currentValue: sensorData.heartRate.value,
        normalRange: { min: THRESHOLDS.BPM_MIN, max: THRESHOLDS.BPM_MAX }
      }
    });
  }

  // Check SpO2
  if (sensorData.spO2.value < THRESHOLDS.SPO2_MIN) {
    alerts.push({
      userId: user._id,
      type: 'vital_breach',
      severity: 'critical',
      title: 'Low Oxygen Saturation',
      message: `Oxygen saturation is low at ${sensorData.spO2.value}%`,
      details: {
        parameter: 'spO2',
        currentValue: sensorData.spO2.value,
        normalRange: { min: THRESHOLDS.SPO2_MIN, max: 100 }
      }
    });
  }

  // Check temperature
  if (sensorData.temperature.value > THRESHOLDS.TEMP_MAX) {
    alerts.push({
      userId: user._id,
      type: 'vital_breach',
      severity: 'medium',
      title: 'Elevated Temperature',
      message: `Body temperature is elevated at ${sensorData.temperature.value}°F`,
      details: {
        parameter: 'temperature',
        currentValue: sensorData.temperature.value,
        normalRange: { min: 97, max: THRESHOLDS.TEMP_MAX }
      }
    });
  }

  // Check blood pressure
  if (sensorData.bloodPressure.systolic > THRESHOLDS.BP_SYSTOLIC_MAX || 
      sensorData.bloodPressure.diastolic > THRESHOLDS.BP_DIASTOLIC_MAX) {
    alerts.push({
      userId: user._id,
      type: 'vital_breach',
      severity: 'high',
      title: 'High Blood Pressure',
      message: `Blood pressure is elevated at ${sensorData.bloodPressure.systolic}/${sensorData.bloodPressure.diastolic} mmHg`,
      details: {
        parameter: 'bloodPressure',
        currentValue: `${sensorData.bloodPressure.systolic}/${sensorData.bloodPressure.diastolic}`,
        normalRange: { 
          min: 90/60, 
          max: THRESHOLDS.BP_SYSTOLIC_MAX/THRESHOLDS.BP_DIASTOLIC_MAX 
        }
      }
    });
  }

  // Create alerts in database
  if (alerts.length > 0) {
    await Alert.insertMany(alerts);
    console.log(`Created ${alerts.length} alerts for user ${user.name}`);
  }
}

/**
 * Write data to ThingSpeak (for testing or manual updates)
 */
async function writeToThingSpeak(data) {
  try {
    // Using the WRITE_API_KEY constant defined at the top
    const url = `${BASE_URL}/update`;
    
    const response = await axios.get(url, {
      params: {
        api_key: WRITE_API_KEY,
        field1: data.bpm || 0,
        field2: data.spO2 || 0,
        field3: data.temperature || 0,
        field4: data.ecg || 0
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error writing to ThingSpeak:', error.message);
    throw error;
  }
}

/**
 * Get channel status and information
 */
async function getChannelStatus() {
  try {
    // Check if environment variables are loaded
    if (!CHANNEL_ID || !READ_API_KEY) {
      throw new Error('ThingSpeak configuration missing: CHANNEL_ID or READ_API_KEY not defined');
    }

    // Get channel info and latest feeds
    const channelUrl = `${BASE_URL}/channels/${CHANNEL_ID}.json`;
    const feedsUrl = `${BASE_URL}/channels/${CHANNEL_ID}/feeds.json`;
    
    const [channelResponse, feedsResponse] = await Promise.all([
      axios.get(channelUrl, { params: { api_key: READ_API_KEY } }),
      axios.get(feedsUrl, { params: { api_key: READ_API_KEY, results: 1 } })
    ]);

    const channel = channelResponse.data.channel;
    const feeds = feedsResponse.data.feeds;
    const latestFeed = feeds && feeds.length > 0 ? feeds[0] : null;

    // Count total entries from database
    const totalDataPoints = await SensorData.countDocuments({
      'thingspeakData.channelId': CHANNEL_ID
    });

    // Determine active fields based on channel info
    const fieldLabels = [
      channel.field1, channel.field2, channel.field3, channel.field4,
      channel.field5, channel.field6, channel.field7, channel.field8
    ];
    const activeFields = fieldLabels.filter(field => field && field.trim()).length;

    // Determine status based on latest update
    let status = 'offline';
    let lastUpdate = 'Unknown';
    
    if (latestFeed) {
      const lastUpdateTime = new Date(latestFeed.created_at);
      const now = new Date();
      const timeDiff = (now - lastUpdateTime) / 1000; // seconds
      
      if (timeDiff < 300) { // 5 minutes
        status = 'online';
        lastUpdate = `${Math.floor(timeDiff)} seconds ago`;
      } else if (timeDiff < 3600) { // 1 hour
        status = 'warning';
        lastUpdate = `${Math.floor(timeDiff / 60)} minutes ago`;
      } else {
        status = 'offline';
        lastUpdate = `${Math.floor(timeDiff / 60)} minutes ago`;
      }
    }

    return {
      status,
      lastUpdate,
      channelId: CHANNEL_ID,
      fieldsActive: activeFields,
      dataPoints: totalDataPoints,
      channel: channel,
      latestEntry: latestFeed
    };
  } catch (error) {
    console.error('Error getting channel status:', error.message);
    return {
      status: 'error',
      lastUpdate: 'Connection failed',
      channelId: CHANNEL_ID,
      fieldsActive: 0,
      dataPoints: 0,
      error: error.message
    };
  }
}

/**
 * Generate test sensor data for demonstration purposes
 */
async function generateTestSensorData() {
  try {
    // Check if environment variables are loaded
    if (!CHANNEL_ID || !READ_API_KEY) {
      throw new Error('ThingSpeak configuration missing: CHANNEL_ID or READ_API_KEY not defined');
    }

    // Find an active patient
    const user = await User.findOne({ 
      role: 'patient',
      $or: [{ isBandActive: true }, { bandId: { $exists: true } }]
    }).sort({ createdAt: -1 });

    if (!user) {
      console.log('No patient found for test data generation');
      return;
    }

    // Generate realistic test data
    const now = new Date();
    const testData = {
      bpm: 65 + Math.floor(Math.random() * 30), // 65-95 bpm
      spO2: 96 + Math.floor(Math.random() * 4), // 96-99%
      temperature: 97.5 + (Math.random() * 2), // 97.5-99.5°F
      ecg: Math.random() * 100 // Random ECG value
    };

    // Create sensor data document
    const sensorData = new SensorData({
      userId: user._id,
      bandId: user.bandId || 'TEST-BAND',
      heartRate: {
        value: testData.bpm,
        timestamp: now
      },
      spO2: {
        value: testData.spO2,
        timestamp: now
      },
      temperature: {
        value: Math.round(testData.temperature * 10) / 10,
        timestamp: now
      },
      ecg: {
        value: Math.round(testData.ecg * 10) / 10,
        timestamp: now
      },
      bloodPressure: {
        systolic: Math.round(120 + (testData.bpm - 75) * 0.5),
        diastolic: Math.round(80 + (testData.bpm - 75) * 0.3),
        timestamp: now
      },
      thingspeakData: {
        channelId: CHANNEL_ID,
        entryId: Date.now(), // Use timestamp as entry ID for test data
        field1: testData.bpm,
        field2: testData.spO2,
        field3: testData.temperature,
        field4: testData.ecg,
        createdAt: now
      },
      recordedAt: now,
      syncedAt: now
    });

    // Save sensor data
    await sensorData.save();
    
    // Check for alerts
    await checkAndCreateAlerts(sensorData, user);
    
    console.log(`Generated test sensor data for user ${user.name}:`, {
      bpm: testData.bpm,
      spO2: testData.spO2,
      temperature: Math.round(testData.temperature * 10) / 10,
      bp: `${sensorData.bloodPressure.systolic}/${sensorData.bloodPressure.diastolic}`
    });

    return sensorData;
  } catch (error) {
    console.error('Error generating test sensor data:', error.message);
  }
}

// Environment-aware service wrapper
const mockThingSpeakService = require('./mockThingSpeak');

class EnvironmentAwareThingSpeakService {
  constructor() {
    this.isDevelopment = process.env.THINGSPEAK_MODE === 'development';
    this.mockEnabled = process.env.MOCK_DATA_ENABLED === 'true';
    this.realService = new ThingSpeakService();
  }

  shouldUseMock() {
    // Use mock only if explicitly enabled, regardless of mode
    return this.mockEnabled;
  }

  async getAllPatientChannels() {
    if (this.shouldUseMock()) {
      // Return mock patient channel data
      const User = require('../models/User');
      const patients = await User.find({ role: 'patient' });
      
      return patients.map(patient => ({
        id: patient._id.toString(),
        patientId: patient.patientId,
        patientName: patient.name,
        channelId: patient.thingspeakChannel?.channelId || `mock_${patient.patientId}`,
        status: 'active',
        lastUpdate: new Date(),
        currentValues: {
          field1: 72,  // Heart rate
          field2: 120, // Systolic BP
          field3: 80,  // Diastolic BP
          field4: 98.6, // Temperature
          field5: 98,   // SpO2
          field6: 0,
          field7: 0,
          field8: 85    // Battery
        },
        surgeryType: patient.surgeryType,
        apiKeys: {
          read: 'mock_read_key',
          write: 'mock_write_key'
        },
        dataPoints: 1000
      }));
    }
    return this.realService.getAllPatientChannels();
  }

  async getSystemHealth() {
    if (this.shouldUseMock()) {
      const User = require('../models/User');
      const totalPatients = await User.countDocuments({ role: 'patient' });
      
      return {
        apiStatus: 'online',
        responseTime: 15,
        uptime: 99.97,
        totalChannels: totalPatients,
        activeChannels: totalPatients,
        inactiveChannels: 0,
        errorChannels: 0,
        dataPointsToday: totalPatients * 24 * 60,
        bandwidth: 87
      };
    }
    return this.realService.getSystemHealth();
  }

  async generateCriticalAlerts() {
    if (this.shouldUseMock()) {
      // Get alerts from database created by mock service
      const Alert = require('../models/Alert');
      const alerts = await Alert.find({
        source: 'thingspeak_mock',
        status: { $in: ['pending', 'acknowledged'] }
      })
      .populate('userId', 'name patientId')
      .sort({ createdAt: -1 })
      .limit(20);

      return alerts.map(alert => ({
        id: alert._id.toString(),
        patientId: alert.userId?.patientId || 'Unknown',
        patientName: alert.userId?.name || 'Unknown Patient',
        type: alert.type,
        severity: alert.severity,
        message: alert.message,
        timestamp: alert.createdAt,
        acknowledged: alert.status === 'acknowledged',
        resolved: alert.status === 'resolved',
        location: 'Home',
        autoGenerated: true,
        value: alert.details?.vitals?.value,
        normalRange: alert.details?.vitals?.normalRange
      }));
    }
    return this.realService.generateCriticalAlerts();
  }

  async getChannelInfo(channelId, readApiKey) {
    if (this.shouldUseMock()) {
      return {
        success: true,
        data: {
          id: channelId,
          name: `Mock Channel ${channelId}`,
          description: 'Mock ThingSpeak channel for development',
          field1: 'Heart Rate',
          field2: 'Blood Pressure Systolic',
          field3: 'Blood Pressure Diastolic', 
          field4: 'Temperature',
          field5: 'SpO2',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        status: 'active'
      };
    }
    return this.realService.getChannelInfo(channelId, readApiKey);
  }

  async getChannelFeeds(channelId, readApiKey, results = 1) {
    if (this.shouldUseMock()) {
      // Get recent sensor data from mock service
      const SensorData = require('../models/SensorData');
      const feeds = await SensorData.find({
        source: 'thingspeak_mock'
      })
      .sort({ timestamp: -1 })
      .limit(results);

      const mockFeeds = feeds.map((data, index) => ({
        created_at: data.timestamp.toISOString(),
        entry_id: Date.now() + index,
        field1: data.vitals?.heartRate,
        field2: data.vitals?.bloodPressure?.systolic,
        field3: data.vitals?.bloodPressure?.diastolic,
        field4: data.vitals?.temperature,
        field5: data.vitals?.spO2
      }));

      return {
        success: true,
        data: {
          channel: { id: channelId, name: `Mock Channel ${channelId}` },
          feeds: mockFeeds,
          latest: mockFeeds[0] || null
        },
        lastUpdate: mockFeeds[0] ? new Date(mockFeeds[0].created_at) : null
      };
    }
    return this.realService.getChannelFeeds(channelId, readApiKey, results);
  }
}

// Export both the class and legacy functions for backward compatibility
const thingSpeakService = new ThingSpeakService();
const environmentAwareService = new EnvironmentAwareThingSpeakService();

module.exports = fetchThingSpeakData;
module.exports.writeToThingSpeak = writeToThingSpeak;
module.exports.getChannelStatus = getChannelStatus;
module.exports.generateTestSensorData = generateTestSensorData;

// Export the new service class methods (environment-aware)
module.exports.ThingSpeakService = ThingSpeakService;
module.exports.thingSpeakService = thingSpeakService;
module.exports.getAllPatientChannels = () => environmentAwareService.getAllPatientChannels();
module.exports.getSystemHealth = () => environmentAwareService.getSystemHealth();
module.exports.generateCriticalAlerts = () => environmentAwareService.generateCriticalAlerts();
module.exports.getChannelInfo = (channelId, readApiKey) => environmentAwareService.getChannelInfo(channelId, readApiKey);
module.exports.getChannelFeeds = (channelId, readApiKey, results) => environmentAwareService.getChannelFeeds(channelId, readApiKey, results);