const User = require('../models/User');
const SensorData = require('../models/SensorData');
const Alert = require('../models/Alert');

class MockThingSpeakService {
  constructor() {
    this.isGenerating = false;
    this.generationInterval = null;
    this.patientBaselineData = new Map();
  }

  // Initialize baseline vital signs for each patient
  async initializePatientBaselines() {
    try {
      const patients = await User.find({ role: 'patient' });
      
      for (const patient of patients) {
        // Create realistic baseline vitals based on age, surgery type, and recovery stage
        const daysSinceSurgery = patient.surgeryDate 
          ? Math.floor((new Date() - new Date(patient.surgeryDate)) / (1000 * 60 * 60 * 24))
          : 30;
        
        const baseline = {
          heartRate: this.getBaselineHeartRate(patient.age, daysSinceSurgery),
          systolicBP: this.getBaselineBP(patient.age, 'systolic', daysSinceSurgery),
          diastolicBP: this.getBaselineBP(patient.age, 'diastolic', daysSinceSurgery),
          temperature: this.getBaselineTemperature(daysSinceSurgery),
          spO2: this.getBaselineSpO2(daysSinceSurgery),
          lastMealTime: null,
          sleepCycle: 'awake',
          activityLevel: 'resting'
        };
        
        this.patientBaselineData.set(patient._id.toString(), baseline);
      }
      
      console.log(`✅ Initialized baselines for ${patients.length} patients`);
    } catch (error) {
      console.error('❌ Error initializing patient baselines:', error);
    }
  }

  // Get baseline heart rate based on age and recovery
  getBaselineHeartRate(age, daysSinceSurgery) {
    let baseRate = 70; // Default
    
    // Age adjustment
    if (age < 30) baseRate = 75;
    else if (age > 60) baseRate = 65;
    
    // Post-surgery adjustment (higher initially, normalizing over time)
    if (daysSinceSurgery < 7) baseRate += 10;
    else if (daysSinceSurgery < 30) baseRate += 5;
    
    return baseRate;
  }

  // Get baseline blood pressure
  getBaselineBP(age, type, daysSinceSurgery) {
    let baseSystolic = 120;
    let baseDiastolic = 80;
    
    // Age adjustment
    if (age > 50) {
      baseSystolic += 10;
      baseDiastolic += 5;
    }
    
    // Post-surgery stress adjustment
    if (daysSinceSurgery < 14) {
      baseSystolic += 5;
      baseDiastolic += 3;
    }
    
    return type === 'systolic' ? baseSystolic : baseDiastolic;
  }

  // Get baseline temperature
  getBaselineTemperature(daysSinceSurgery) {
    let baseTemp = 98.6;
    
    // Slight elevation in early recovery
    if (daysSinceSurgery < 3) baseTemp += 0.5;
    else if (daysSinceSurgery < 7) baseTemp += 0.2;
    
    return baseTemp;
  }

  // Get baseline SpO2
  getBaselineSpO2(daysSinceSurgery) {
    let baseSpO2 = 98;
    
    // Slightly lower in early recovery
    if (daysSinceSurgery < 7) baseSpO2 -= 1;
    
    return baseSpO2;
  }

  // Generate realistic vital signs for a patient with periodic spikes
  generateVitalSigns(patientId) {
    const baseline = this.patientBaselineData.get(patientId);
    if (!baseline) return null;

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentSecond = now.getSeconds();
    const isNightTime = currentHour >= 22 || currentHour <= 6;
    const isMorning = currentHour >= 6 && currentHour <= 9;
    
    // Apply time-of-day variations
    let heartRateModifier = 0;
    let bpModifier = 0;
    let tempModifier = 0;
    
    if (isNightTime) {
      heartRateModifier = -5; // Lower at night
      bpModifier = -3;
      tempModifier = -0.3;
    } else if (isMorning) {
      heartRateModifier = 5; // Higher in morning
      bpModifier = 5;
      tempModifier = 0.2;
    }

    // Generate spikes at various intervals for different parameters
    const timeBasedSpikes = this.generateSpikes(patientId, now);
    
    // Add random variations (±10% of baseline)
    let heartRate = Math.round(
      baseline.heartRate + heartRateModifier + (Math.random() - 0.5) * baseline.heartRate * 0.1
    );
    
    let systolicBP = Math.round(
      baseline.systolicBP + bpModifier + (Math.random() - 0.5) * baseline.systolicBP * 0.1
    );
    
    let diastolicBP = Math.round(
      baseline.diastolicBP + bpModifier + (Math.random() - 0.5) * baseline.diastolicBP * 0.1
    );
    
    let temperature = Math.round(
      (baseline.temperature + tempModifier + (Math.random() - 0.5) * 0.4) * 10
    ) / 10;
    
    let spO2 = Math.round(
      baseline.spO2 + (Math.random() - 0.5) * 2
    );

    // Apply spikes based on time intervals
    if (timeBasedSpikes.heartRateSpike) {
      heartRate += timeBasedSpikes.heartRateSpike;
      console.log(`🔥 Heart rate spike for patient ${patientId}: +${timeBasedSpikes.heartRateSpike} bpm`);
    }
    
    if (timeBasedSpikes.bpSpike) {
      systolicBP += timeBasedSpikes.bpSpike.systolic;
      diastolicBP += timeBasedSpikes.bpSpike.diastolic;
      console.log(`🔥 BP spike for patient ${patientId}: +${timeBasedSpikes.bpSpike.systolic}/${timeBasedSpikes.bpSpike.diastolic} mmHg`);
    }
    
    if (timeBasedSpikes.tempSpike) {
      temperature += timeBasedSpikes.tempSpike;
      console.log(`🔥 Temperature spike for patient ${patientId}: +${timeBasedSpikes.tempSpike}°F`);
    }
    
    if (timeBasedSpikes.spO2Drop) {
      spO2 += timeBasedSpikes.spO2Drop; // This will be negative
      console.log(`🔥 SpO2 drop for patient ${patientId}: ${timeBasedSpikes.spO2Drop}%`);
    }
    
    // Ensure realistic ranges
    return {
      heartRate: Math.max(45, Math.min(150, heartRate)),
      systolicBP: Math.max(80, Math.min(200, systolicBP)),
      diastolicBP: Math.max(50, Math.min(120, diastolicBP)),
      temperature: Math.max(95.0, Math.min(104.0, temperature)),
      spO2: Math.max(85, Math.min(100, spO2)),
      timestamp: now,
      spikeData: timeBasedSpikes // Store spike info for debugging
    };
  }

  // Generate spikes at various intervals for different patients and parameters
  generateSpikes(patientId, currentTime) {
    const spikes = {
      heartRateSpike: 0,
      bpSpike: null,
      tempSpike: 0,
      spO2Drop: 0
    };

    const currentMinute = currentTime.getMinutes();
    const currentSecond = currentTime.getSeconds();
    const patientHash = this.getPatientHash(patientId);

    // Use a more reliable approach: random chance based on patient hash and time
    const randomSeed = (patientHash + currentMinute + Math.floor(currentSecond / 10)) % 100;
    
    // Heart rate spikes - 30% chance every generation cycle for each patient
    if (randomSeed < 30) {
      const spikeIntensity = 15 + (patientHash % 20); // 15-34 bpm increase
      spikes.heartRateSpike = spikeIntensity;
    }

    // Blood pressure spikes - 25% chance
    if ((randomSeed + 25) % 100 < 25) {
      const systolicSpike = 20 + (patientHash % 25); // 20-44 mmHg
      const diastolicSpike = 10 + (patientHash % 15); // 10-24 mmHg
      spikes.bpSpike = {
        systolic: systolicSpike,
        diastolic: diastolicSpike
      };
    }

    // Temperature spikes - 15% chance (less frequent)
    if ((randomSeed + 50) % 100 < 15) {
      const tempIncrease = 1.0 + (patientHash % 20) * 0.1; // 1.0-2.9°F increase
      spikes.tempSpike = Math.round(tempIncrease * 10) / 10;
    }

    // SpO2 drops - 20% chance
    if ((randomSeed + 75) % 100 < 20) {
      const dropAmount = -(3 + (patientHash % 8)); // 3-10% decrease
      spikes.spO2Drop = dropAmount;
    }

    // Additional: Guaranteed spike every 2 minutes for testing
    if (currentMinute % 2 === 0 && currentSecond >= 0 && currentSecond < 30) {
      // Force at least one spike every 2 minutes
      if (!spikes.heartRateSpike && !spikes.bpSpike && !spikes.tempSpike && !spikes.spO2Drop) {
        const forceType = patientHash % 4;
        switch (forceType) {
          case 0:
            spikes.heartRateSpike = 25;
            break;
          case 1:
            spikes.bpSpike = { systolic: 30, diastolic: 15 };
            break;
          case 2:
            spikes.tempSpike = 1.5;
            break;
          case 3:
            spikes.spO2Drop = -5;
            break;
        }
      }
    }

    // Debug logging for spike generation
    const hasAnySpike = spikes.heartRateSpike || spikes.bpSpike || spikes.tempSpike || spikes.spO2Drop;
    if (hasAnySpike) {
      console.log(`🎯 Generating spikes for patient ${patientId.substring(0, 8)}... at ${currentTime.toLocaleTimeString()}`);
    }

    return spikes;
  }

  // Generate a simple hash from patientId for consistent patient-specific variations
  getPatientHash(patientId) {
    let hash = 0;
    for (let i = 0; i < patientId.length; i++) {
      const char = patientId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash) % 100; // Return 0-99
  }

  // Check if vital signs require an alert (updated for spike testing)
  checkForAlerts(patientId, vitals) {
    const alerts = [];
    const hasSpikeData = vitals.spikeData && (
      vitals.spikeData.heartRateSpike || 
      vitals.spikeData.bpSpike || 
      vitals.spikeData.tempSpike || 
      vitals.spikeData.spO2Drop
    );
    
    // Heart rate alerts with spike awareness - using valid alert types
    if (vitals.heartRate > 110) {
      const severity = vitals.heartRate > 130 ? 'critical' : 'high';
      const alertTitle = hasSpikeData ? 'Heart Rate Spike Detected' : 'Elevated Heart Rate';
      alerts.push({
        type: 'vital_breach', // Use valid enum value
        severity: severity,
        title: alertTitle,
        message: `Heart rate: ${vitals.heartRate} bpm (Normal: 60-100 bpm)${hasSpikeData ? ' - Spike event detected' : ''}`,
        parameter: 'heartRate',
        value: vitals.heartRate,
        normalRange: { min: 60, max: 100 },
        spikeDetected: hasSpikeData
      });
    } else if (vitals.heartRate < 55) {
      alerts.push({
        type: 'vital_breach', // Use valid enum value
        severity: 'medium',
        title: 'Low Heart Rate',
        message: `Heart rate: ${vitals.heartRate} bpm (Normal: 60-100 bpm)`,
        parameter: 'heartRate',
        value: vitals.heartRate,
        normalRange: { min: 60, max: 100 }
      });
    }
    
    // Blood pressure alerts with spike detection
    if (vitals.systolicBP > 150 || vitals.diastolicBP > 95) {
      const severity = vitals.systolicBP > 170 || vitals.diastolicBP > 110 ? 'critical' : 'high';
      const alertTitle = hasSpikeData ? 'Blood Pressure Spike' : 'High Blood Pressure';
      alerts.push({
        type: 'vital_breach', // Use valid enum value
        severity: severity,
        title: alertTitle,
        message: `Blood pressure: ${vitals.systolicBP}/${vitals.diastolicBP} mmHg (Normal: <140/90 mmHg)${hasSpikeData ? ' - Spike detected' : ''}`,
        parameter: 'bloodPressure',
        value: `${vitals.systolicBP}/${vitals.diastolicBP}`,
        normalRange: { min: 90, max: 140 },
        spikeDetected: hasSpikeData
      });
    }
    
    // Temperature alerts with fever spike detection
    if (vitals.temperature > 101.0) {
      const severity = vitals.temperature > 103.0 ? 'critical' : 'high';
      const alertTitle = hasSpikeData ? 'Temperature Spike/Fever' : 'Fever Detected';
      alerts.push({
        type: 'vital_breach', // Use valid enum value
        severity: severity,
        title: alertTitle,
        message: `Temperature: ${vitals.temperature}°F (Normal: 97.0-100.4°F)${hasSpikeData ? ' - Sudden elevation' : ''}`,
        parameter: 'temperature',
        value: vitals.temperature,
        normalRange: { min: 97.0, max: 100.4 },
        spikeDetected: hasSpikeData
      });
    }
    
    // SpO2 alerts with desaturation events
    if (vitals.spO2 < 94) {
      const severity = vitals.spO2 < 88 ? 'critical' : 'high';
      const alertTitle = hasSpikeData ? 'Oxygen Desaturation Event' : 'Low Blood Oxygen';
      alerts.push({
        type: 'vital_breach', // Use valid enum value
        severity: severity,
        title: alertTitle,
        message: `SpO2: ${vitals.spO2}% (Normal: 95-100%)${hasSpikeData ? ' - Desaturation event' : ''}`,
        parameter: 'spO2',
        value: vitals.spO2,
        normalRange: { min: 95, max: 100 },
        spikeDetected: hasSpikeData
      });
    }
    
    // Add composite alert for multiple simultaneous spikes
    if (hasSpikeData) {
      const simultaneousSpikes = [
        vitals.spikeData.heartRateSpike && 'Heart Rate',
        vitals.spikeData.bpSpike && 'Blood Pressure', 
        vitals.spikeData.tempSpike && 'Temperature',
        vitals.spikeData.spO2Drop && 'Oxygen Saturation'
      ].filter(Boolean);

      if (simultaneousSpikes.length > 1) {
        alerts.push({
          type: 'emergency', // Use valid enum value for critical multi-parameter events
          severity: 'critical',
          title: 'Multiple Vital Signs Anomaly',
          message: `Simultaneous spikes detected in: ${simultaneousSpikes.join(', ')}`,
          parameter: 'multiParameter',
          value: simultaneousSpikes.join(', '),
          spikeDetected: true,
          multiParameter: true
        });
      }
    }
    
    return alerts;
  }

  // Save vital signs to database
  async saveSensorData(patient, vitals) {
    try {
      const sensorData = new SensorData({
        userId: patient._id,
        bandId: patient.bandId || `CRV_BAND_${patient.patientId}`,
        heartRate: {
          value: vitals.heartRate,
          timestamp: vitals.timestamp
        },
        bloodPressure: {
          systolic: vitals.systolicBP,
          diastolic: vitals.diastolicBP,
          timestamp: vitals.timestamp
        },
        temperature: {
          value: vitals.temperature,
          timestamp: vitals.timestamp
        },
        spO2: {
          value: vitals.spO2,
          timestamp: vitals.timestamp
        },
        batteryLevel: Math.floor(Math.random() * 30) + 70, // 70-100%
        dataQuality: 'good',
        source: 'thingspeak_mock',
        thingspeakData: {
          channelId: patient.thingspeakChannel?.channelId || `mock_${patient.patientId}`,
          entryId: Date.now(),
          field1: vitals.heartRate,
          field2: vitals.systolicBP,
          field3: vitals.diastolicBP,
          field4: vitals.temperature,
          field5: vitals.spO2,
          createdAt: vitals.timestamp
        },
        recordedAt: vitals.timestamp,
        syncedAt: new Date()
      });
      
      await sensorData.save();
      return sensorData;
    } catch (error) {
      console.error(`❌ Error saving sensor data for patient ${patient.patientId}:`, error);
      return null;
    }
  }

  // Create alerts in database
  async createAlerts(patientId, alertsData) {
    try {
      const patient = await User.findById(patientId);
      if (!patient) return;
      
      for (const alertData of alertsData) {
        // Check if similar alert exists within last hour (avoid spam)
        const recentAlert = await Alert.findOne({
          userId: patientId,
          type: alertData.type,
          createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) },
          status: { $in: ['pending', 'acknowledged'] }
        });
        
        if (!recentAlert) {
          const alert = new Alert({
            userId: patientId,
            type: alertData.type,
            severity: alertData.severity,
            title: alertData.title,
            message: alertData.message,
            details: {
              parameter: alertData.parameter,
              currentValue: alertData.value,
              normalRange: alertData.normalRange,
              spikeDetected: alertData.spikeDetected,
              patientInfo: {
                name: patient.name,
                patientId: patient.patientId,
                age: patient.age
              },
              source: 'thingspeak_mock'
            }
          });
          
          await alert.save();
          console.log(`🚨 Alert created: ${alertData.title} for ${patient.name}`);
        }
      }
    } catch (error) {
      console.error(`❌ Error creating alerts for patient ${patientId}:`, error);
    }
  }

  // Generate data for all patients
  async generateDataForAllPatients() {
    try {
      const patients = await User.find({ role: 'patient' });
      
      for (const patient of patients) {
        const patientId = patient._id.toString();
        
        // Generate vital signs
        const vitals = this.generateVitalSigns(patientId);
        if (!vitals) continue;
        
        // Save to database
        await this.saveSensorData(patient, vitals);
        
        // Check for alerts
        const alertsData = this.checkForAlerts(patientId, vitals);
        if (alertsData.length > 0) {
          await this.createAlerts(patient._id, alertsData);
        }
      }
      
      console.log(`✅ Generated data for ${patients.length} patients at ${new Date().toLocaleTimeString()}`);
    } catch (error) {
      console.error('❌ Error generating patient data:', error);
    }
  }

  // Start continuous data generation
  async startDataGeneration() {
    if (this.isGenerating) {
      console.log('⚠️ Data generation already running');
      return;
    }
    
    console.log('🚀 Starting mock ThingSpeak data generation...');
    
    // Initialize baselines
    await this.initializePatientBaselines();
    
    // Generate initial data
    await this.generateDataForAllPatients();
    
    // Set up continuous generation
    const interval = parseInt(process.env.MOCK_DATA_INTERVAL) || 30000;
    this.generationInterval = setInterval(async () => {
      await this.generateDataForAllPatients();
    }, interval);
    
    this.isGenerating = true;
    console.log(`✅ Mock data generation started (interval: ${interval}ms)`);
  }

  // Stop data generation
  stopDataGeneration() {
    if (this.generationInterval) {
      clearInterval(this.generationInterval);
      this.generationInterval = null;
    }
    this.isGenerating = false;
    console.log('🛑 Mock data generation stopped');
  }

  // Get current generation status
  getStatus() {
    return {
      isGenerating: this.isGenerating,
      interval: parseInt(process.env.MOCK_DATA_INTERVAL) || 30000,
      patientsCount: this.patientBaselineData.size,
      lastGeneration: new Date()
    };
  }

  // Manual trigger for testing
  async triggerDataGeneration() {
    console.log('🔄 Manual data generation triggered');
    await this.generateDataForAllPatients();
  }
}

// Export singleton instance
const mockThingSpeakService = new MockThingSpeakService();
module.exports = mockThingSpeakService;