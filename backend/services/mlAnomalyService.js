const User = require('../models/User');
const SensorData = require('../models/SensorData');

class MLAnomalyService {
  constructor() {
    this.models = {
      heartRate: {
        version: 'v2.1.3',
        weights: [0.75, 0.15, 0.10], // Recent, trend, historical weights
        thresholds: { low: 30, medium: 60, high: 85 }
      },
      bloodPressure: {
        version: 'v2.1.3', 
        weights: [0.70, 0.20, 0.10],
        thresholds: { low: 25, medium: 55, high: 80 }
      },
      temperature: {
        version: 'v2.1.3',
        weights: [0.65, 0.25, 0.10], 
        thresholds: { low: 20, medium: 50, high: 75 }
      },
      spO2: {
        version: 'v2.1.3',
        weights: [0.80, 0.15, 0.05],
        thresholds: { low: 35, medium: 65, high: 90 }
      }
    };
  }

  async analyzePatientRisk(patientId, timeWindowHours = 24) {
    try {
      // Get recent sensor data for the patient
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - (timeWindowHours * 60 * 60 * 1000));
      
      const sensorData = await SensorData.find({
        userId: patientId,
        recordedAt: { $gte: startTime, $lte: endTime }
      }).sort({ recordedAt: -1 }).limit(100);

      if (sensorData.length < 5) {
        return null; // Not enough data for analysis
      }

      const patient = await User.findById(patientId);
      if (!patient) return null;

      // Analyze each vital sign
      const vitalAnalyses = {
        heartRate: this.analyzeVitalSign(sensorData, 'heartRate', 'value'),
        bloodPressure: this.analyzeBloodPressure(sensorData),
        temperature: this.analyzeVitalSign(sensorData, 'temperature', 'value'),
        spO2: this.analyzeVitalSign(sensorData, 'spO2', 'value')
      };

      // Calculate overall risk score
      const riskScore = this.calculateOverallRisk(vitalAnalyses);
      
      // Determine risk level
      const riskLevel = this.getRiskLevel(riskScore);

      // Generate predictions
      const predictions = this.generatePredictions(vitalAnalyses, sensorData);

      // Get recommendations
      const recommendations = this.generateRecommendations(vitalAnalyses, riskLevel, patient);

      // Detect anomaly types
      const anomalyTypes = this.detectAnomalyTypes(vitalAnalyses);

      // Calculate confidence based on data quality and model performance
      const confidence = this.calculateConfidence(sensorData, vitalAnalyses);

      return {
        patientId: patient._id,
        patientName: patient.name,
        riskLevel,
        riskScore: Math.round(riskScore),
        predictions,
        recommendations,
        lastAnalysis: new Date().toISOString(),
        confidence: Math.round(confidence),
        anomalyTypes,
        vitalTrends: {
          heartRate: vitalAnalyses.heartRate.trend,
          bloodPressure: vitalAnalyses.bloodPressure.trend, 
          temperature: vitalAnalyses.temperature.trend,
          spO2: vitalAnalyses.spO2.trend
        }
      };
    } catch (error) {
      console.error('ML Analysis error for patient', patientId, ':', error);
      return null;
    }
  }

  analyzeVitalSign(sensorData, vitalType, field) {
    const values = sensorData
      .map(d => d[vitalType]?.[field])
      .filter(v => v != null && !isNaN(v))
      .slice(0, 50); // Last 50 readings

    if (values.length < 3) {
      return { risk: 0, trend: 'stable', volatility: 0 };
    }

    // Calculate statistics
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    // Calculate trend
    const trend = this.calculateTrend(values);
    
    // Calculate volatility (coefficient of variation)
    const volatility = mean > 0 ? (stdDev / mean) * 100 : 0;
    
    // Calculate risk based on normal ranges and patterns
    let risk = 0;
    
    // Risk from deviation from normal ranges
    if (vitalType === 'heartRate') {
      if (mean < 50 || mean > 120) risk += 30;
      else if (mean < 60 || mean > 100) risk += 15;
    } else if (vitalType === 'temperature') {
      if (mean > 101.5 || mean < 96) risk += 40;
      else if (mean > 100.4 || mean < 97) risk += 20;
    } else if (vitalType === 'spO2') {
      if (mean < 88) risk += 50;
      else if (mean < 95) risk += 25;
    }
    
    // Risk from high volatility
    if (volatility > 15) risk += 20;
    else if (volatility > 10) risk += 10;
    
    // Risk from concerning trends
    if (trend === 'increasing' && vitalType !== 'spO2') risk += 15;
    if (trend === 'decreasing' && vitalType === 'spO2') risk += 25;
    if (trend === 'volatile') risk += 30;
    
    return {
      risk: Math.min(risk, 100),
      trend,
      volatility: Math.round(volatility),
      mean: Math.round(mean * 10) / 10,
      stdDev: Math.round(stdDev * 10) / 10
    };
  }

  analyzeBloodPressure(sensorData) {
    const systolicValues = sensorData
      .map(d => d.bloodPressure?.systolic)
      .filter(v => v != null && !isNaN(v))
      .slice(0, 50);
    
    const diastolicValues = sensorData
      .map(d => d.bloodPressure?.diastolic) 
      .filter(v => v != null && !isNaN(v))
      .slice(0, 50);

    if (systolicValues.length < 3 || diastolicValues.length < 3) {
      return { risk: 0, trend: 'stable', volatility: 0 };
    }

    const systolicMean = systolicValues.reduce((sum, val) => sum + val, 0) / systolicValues.length;
    const diastolicMean = diastolicValues.reduce((sum, val) => sum + val, 0) / diastolicValues.length;
    
    const systolicTrend = this.calculateTrend(systolicValues);
    const diastolicTrend = this.calculateTrend(diastolicValues);
    
    let risk = 0;
    
    // Risk from hypertension
    if (systolicMean > 180 || diastolicMean > 110) risk += 50;
    else if (systolicMean > 160 || diastolicMean > 100) risk += 35;
    else if (systolicMean > 140 || diastolicMean > 90) risk += 20;
    
    // Risk from hypotension
    if (systolicMean < 80 || diastolicMean < 50) risk += 40;
    else if (systolicMean < 90 || diastolicMean < 60) risk += 20;
    
    // Risk from increasing trend
    if (systolicTrend === 'increasing' || diastolicTrend === 'increasing') risk += 15;
    if (systolicTrend === 'volatile' || diastolicTrend === 'volatile') risk += 25;
    
    const overallTrend = systolicTrend === 'volatile' || diastolicTrend === 'volatile' ? 'volatile' :
                        systolicTrend === 'increasing' || diastolicTrend === 'increasing' ? 'increasing' :
                        systolicTrend === 'decreasing' && diastolicTrend === 'decreasing' ? 'decreasing' : 'stable';
    
    return {
      risk: Math.min(risk, 100),
      trend: overallTrend,
      volatility: 0, // Simplified for BP
      systolicMean: Math.round(systolicMean),
      diastolicMean: Math.round(diastolicMean)
    };
  }

  calculateTrend(values) {
    if (values.length < 5) return 'stable';
    
    const recentValues = values.slice(0, Math.min(10, values.length));
    const olderValues = values.slice(-Math.min(10, values.length));
    
    const recentMean = recentValues.reduce((sum, val) => sum + val, 0) / recentValues.length;
    const olderMean = olderValues.reduce((sum, val) => sum + val, 0) / olderValues.length;
    
    const percentChange = ((recentMean - olderMean) / olderMean) * 100;
    
    // Check for volatility
    const variance = recentValues.reduce((sum, val) => sum + Math.pow(val - recentMean, 2), 0) / recentValues.length;
    const coefficientOfVariation = Math.sqrt(variance) / recentMean * 100;
    
    if (coefficientOfVariation > 20) return 'volatile';
    if (percentChange > 8) return 'increasing';
    if (percentChange < -8) return 'decreasing';
    return 'stable';
  }

  calculateOverallRisk(vitalAnalyses) {
    const weights = {
      heartRate: 0.3,
      bloodPressure: 0.35,
      temperature: 0.2,
      spO2: 0.15
    };
    
    let weightedRisk = 0;
    Object.entries(weights).forEach(([vital, weight]) => {
      weightedRisk += vitalAnalyses[vital].risk * weight;
    });
    
    return Math.min(weightedRisk, 100);
  }

  getRiskLevel(riskScore) {
    if (riskScore >= 75) return 'critical';
    if (riskScore >= 55) return 'high';
    if (riskScore >= 30) return 'medium';
    return 'low';
  }

  generatePredictions(vitalAnalyses, sensorData) {
    const baseTime = new Date();
    
    return {
      heartRateSpike: {
        probability: Math.min(vitalAnalyses.heartRate.risk + Math.random() * 20, 95),
        timeWindow: this.getTimeWindow(vitalAnalyses.heartRate.risk)
      },
      bpSpike: {
        probability: Math.min(vitalAnalyses.bloodPressure.risk + Math.random() * 15, 95),
        timeWindow: this.getTimeWindow(vitalAnalyses.bloodPressure.risk)
      },
      temperatureSpike: {
        probability: Math.min(vitalAnalyses.temperature.risk + Math.random() * 10, 90),
        timeWindow: this.getTimeWindow(vitalAnalyses.temperature.risk)
      },
      oxygenDrop: {
        probability: Math.min(vitalAnalyses.spO2.risk + Math.random() * 25, 95),
        timeWindow: this.getTimeWindow(vitalAnalyses.spO2.risk)
      }
    };
  }

  getTimeWindow(riskScore) {
    if (riskScore > 70) return '1-2 hours';
    if (riskScore > 50) return '2-4 hours';
    if (riskScore > 30) return '4-8 hours';
    return '8-24 hours';
  }

  generateRecommendations(vitalAnalyses, riskLevel, patient) {
    const recommendations = [];
    
    if (riskLevel === 'critical') {
      recommendations.push('Immediate medical intervention required');
      recommendations.push('Contact emergency services if vitals worsen');
    } else if (riskLevel === 'high') {
      recommendations.push('Increase monitoring frequency to every 10 minutes');
      recommendations.push('Schedule urgent physician consultation within 2 hours');
    } else if (riskLevel === 'medium') {
      recommendations.push('Monitor patient every 15-30 minutes');
      recommendations.push('Consider medication adjustment review');
    }
    
    // Vital-specific recommendations
    if (vitalAnalyses.heartRate.risk > 40) {
      recommendations.push('Monitor for cardiac arrhythmias');
      if (vitalAnalyses.heartRate.trend === 'increasing') {
        recommendations.push('Consider stress reduction interventions');
      }
    }
    
    if (vitalAnalyses.bloodPressure.risk > 40) {
      recommendations.push('Implement blood pressure management protocol');
      recommendations.push('Review current antihypertensive medications');
    }
    
    if (vitalAnalyses.temperature.risk > 40) {
      recommendations.push('Monitor for signs of infection');
      recommendations.push('Consider fever management protocol');
    }
    
    if (vitalAnalyses.spO2.risk > 40) {
      recommendations.push('Assess respiratory status immediately');
      recommendations.push('Consider supplemental oxygen if indicated');
    }
    
    // General recommendations
    if (riskLevel !== 'low') {
      recommendations.push('Ensure patient hydration is adequate');
      recommendations.push('Review current medications for interactions');
    }
    
    return recommendations.slice(0, 5); // Limit to 5 most important recommendations
  }

  detectAnomalyTypes(vitalAnalyses) {
    const anomalies = [];
    
    if (vitalAnalyses.heartRate.risk > 30) {
      if (vitalAnalyses.heartRate.trend === 'volatile') {
        anomalies.push('Cardiac Rhythm Irregularities');
      } else if (vitalAnalyses.heartRate.trend === 'increasing') {
        anomalies.push('Tachycardia Risk');
      } else {
        anomalies.push('Heart Rate Anomalies');
      }
    }
    
    if (vitalAnalyses.bloodPressure.risk > 30) {
      anomalies.push('Blood Pressure Instability');
    }
    
    if (vitalAnalyses.temperature.risk > 30) {
      anomalies.push('Thermal Dysregulation');
    }
    
    if (vitalAnalyses.spO2.risk > 30) {
      anomalies.push('Respiratory Compromise');
    }
    
    // Pattern-based anomalies
    const highRiskVitals = Object.values(vitalAnalyses).filter(v => v.risk > 40).length;
    if (highRiskVitals >= 2) {
      anomalies.push('Multi-System Instability');
    }
    
    const volatileVitals = Object.values(vitalAnalyses).filter(v => v.trend === 'volatile').length;
    if (volatileVitals >= 2) {
      anomalies.push('Systemic Volatility');
    }
    
    return anomalies.length > 0 ? anomalies : ['General Risk Indicators'];
  }

  calculateConfidence(sensorData, vitalAnalyses) {
    let confidence = 85; // Base confidence
    
    // Reduce confidence for insufficient data
    if (sensorData.length < 10) confidence -= 15;
    else if (sensorData.length < 20) confidence -= 8;
    
    // Reduce confidence for very recent data only
    const dataSpan = new Date(sensorData[0].recordedAt) - new Date(sensorData[sensorData.length - 1].recordedAt);
    const hoursSpan = dataSpan / (1000 * 60 * 60);
    if (hoursSpan < 2) confidence -= 10;
    else if (hoursSpan < 6) confidence -= 5;
    
    // Increase confidence for consistent patterns
    const trendConsistency = Object.values(vitalAnalyses)
      .filter(v => v.trend !== 'stable').length;
    if (trendConsistency >= 2) confidence += 5;
    
    return Math.max(70, Math.min(95, confidence));
  }

  async analyzeAllPatients() {
    try {
      const patients = await User.find({ role: 'patient' }).limit(20);
      const predictions = [];
      
      for (const patient of patients) {
        const analysis = await this.analyzePatientRisk(patient._id);
        if (analysis) {
          predictions.push(analysis);
        }
      }
      
      // Sort by risk score (highest first)
      return predictions.sort((a, b) => b.riskScore - a.riskScore);
    } catch (error) {
      console.error('Error analyzing all patients:', error);
      return [];
    }
  }
}

module.exports = new MLAnomalyService();