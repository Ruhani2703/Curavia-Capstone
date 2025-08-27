const { spawn } = require('child_process');
const path = require('path');

class MLService {
  constructor() {
    this.modelPath = path.join(__dirname, '../../ml/models/health_anomaly_model.pkl');
    this.pythonScriptPath = path.join(__dirname, '../../ml/ml_predictor.py');
  }

  /**
   * Make prediction using the trained ML model
   * @param {Object} vitalSigns - Current vital signs data
   * @returns {Promise<Object>} Prediction results with risk score and recommendations
   */
  async predict(vitalSigns) {
    return new Promise((resolve, reject) => {
      const pythonProcess = spawn('python', [
        this.pythonScriptPath,
        'predict',
        JSON.stringify(vitalSigns)
      ]);

      let dataString = '';
      let errorString = '';

      pythonProcess.stdout.on('data', (data) => {
        dataString += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        errorString += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          console.error('Python script error:', errorString);
          // Return a fallback result instead of rejecting
          resolve({
            is_anomaly: false,
            risk_score: 0.1,
            severity: 'normal',
            anomaly_types: [],
            recommendations: ['Monitor vital signs regularly'],
            alertRequired: false,
            originalData: vitalSigns,
            fallback: true
          });
        } else {
          try {
            const cleanedData = dataString.trim();
            if (!cleanedData) {
              // Return fallback if no data
              resolve({
                is_anomaly: false,
                risk_score: 0.1,
                severity: 'normal',
                anomaly_types: [],
                recommendations: ['Monitor vital signs regularly'],
                alertRequired: false,
                originalData: vitalSigns,
                fallback: true
              });
              return;
            }
            
            const result = JSON.parse(cleanedData);
            resolve(result);
          } catch (error) {
            console.error('Failed to parse ML result, raw output:', dataString);
            // Return fallback instead of rejecting
            resolve({
              is_anomaly: false,
              risk_score: 0.1,
              severity: 'normal',
              anomaly_types: [],
              recommendations: ['Monitor vital signs regularly'],
              alertRequired: false,
              originalData: vitalSigns,
              fallback: true
            });
          }
        }
      });

      pythonProcess.on('error', (error) => {
        reject(new Error(`Failed to spawn Python process: ${error.message}`));
      });
    });
  }

  /**
   * Analyze batch of historical data
   * @param {Array} historicalData - Array of sensor readings
   * @returns {Promise<Object>} Analysis results with patterns and trends
   */
  async analyzeBatch(historicalData) {
    return new Promise((resolve, reject) => {
      const pythonProcess = spawn('python', [
        this.pythonScriptPath,
        'analyze_batch',
        JSON.stringify(historicalData)
      ]);

      let dataString = '';
      let errorString = '';

      pythonProcess.stdout.on('data', (data) => {
        dataString += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        errorString += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Batch analysis failed: ${errorString}`));
        } else {
          try {
            const result = JSON.parse(dataString);
            resolve(result);
          } catch (error) {
            reject(new Error('Failed to parse batch analysis result'));
          }
        }
      });
    });
  }

  /**
   * Process sensor data and detect anomalies
   * @param {Object} sensorData - Raw sensor data from ThingSpeak
   * @returns {Promise<Object>} Processed prediction with anomaly detection
   */
  async processSensorData(sensorData) {
    try {
      // Extract vital signs from sensor data
      const vitalSigns = {
        heart_rate: sensorData.heartRate?.value || 0,
        spo2: sensorData.spO2?.value || 0,
        temperature: sensorData.temperature?.value || 0,
        bp_systolic: sensorData.bloodPressure?.systolic || 0,
        bp_diastolic: sensorData.bloodPressure?.diastolic || 0,
        ecg: sensorData.ecg?.value || 0
      };

      // Get ML prediction
      const prediction = await this.predict(vitalSigns);

      // Enhance prediction with metadata
      const enhancedPrediction = {
        ...prediction,
        timestamp: new Date(),
        patientId: sensorData.userId,
        bandId: sensorData.bandId,
        originalData: vitalSigns,
        alertRequired: prediction.is_anomaly && prediction.severity !== 'low'
      };

      return enhancedPrediction;
    } catch (error) {
      console.error('Error processing sensor data:', error);
      throw error;
    }
  }

  /**
   * Calculate risk trend over time
   * @param {String} patientId - Patient ID
   * @param {Array} predictions - Array of ML predictions
   * @returns {Object} Risk trend analysis
   */
  calculateRiskTrend(patientId, predictions) {
    if (!predictions || predictions.length === 0) {
      return {
        trend: 'stable',
        averageRisk: 0,
        maxRisk: 0,
        anomalyCount: 0
      };
    }

    const riskScores = predictions.map(p => p.risk_score || 0);
    const anomalies = predictions.filter(p => p.is_anomaly);
    
    // Calculate trend
    const recentScores = riskScores.slice(-10);
    const olderScores = riskScores.slice(-20, -10);
    const recentAvg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
    const olderAvg = olderScores.length > 0 ? 
      olderScores.reduce((a, b) => a + b, 0) / olderScores.length : recentAvg;
    
    let trend = 'stable';
    if (recentAvg > olderAvg * 1.1) trend = 'worsening';
    else if (recentAvg < olderAvg * 0.9) trend = 'improving';

    return {
      trend,
      averageRisk: Math.round(riskScores.reduce((a, b) => a + b, 0) / riskScores.length),
      maxRisk: Math.max(...riskScores),
      anomalyCount: anomalies.length,
      criticalCount: anomalies.filter(a => a.severity === 'critical').length,
      highCount: anomalies.filter(a => a.severity === 'high').length
    };
  }

  /**
   * Generate health insights based on ML analysis
   * @param {Object} prediction - ML prediction result
   * @param {Array} historicalPredictions - Past predictions for context
   * @returns {Object} Health insights and recommendations
   */
  generateInsights(prediction, historicalPredictions = []) {
    const insights = {
      summary: '',
      recommendations: [],
      patterns: [],
      priority: 'normal'
    };

    // Determine priority based on severity
    if (prediction.severity === 'critical') {
      insights.priority = 'urgent';
      insights.summary = 'Critical health anomaly detected requiring immediate attention';
    } else if (prediction.severity === 'high') {
      insights.priority = 'high';
      insights.summary = 'Significant health anomaly detected requiring prompt review';
    } else if (prediction.is_anomaly) {
      insights.priority = 'medium';
      insights.summary = 'Minor health anomaly detected for monitoring';
    } else {
      insights.summary = 'Vital signs within normal range';
    }

    // Add specific recommendations
    if (prediction.recommendations) {
      insights.recommendations = prediction.recommendations;
    }

    // Analyze patterns in historical data
    if (historicalPredictions.length > 0) {
      const recentAnomalies = historicalPredictions
        .slice(-20)
        .filter(p => p.is_anomaly);
      
      if (recentAnomalies.length > 10) {
        insights.patterns.push('Frequent anomalies detected in recent readings');
      }

      // Check for recurring anomaly types
      const anomalyTypes = recentAnomalies
        .flatMap(a => a.anomaly_types || [])
        .filter(t => t !== 'none');
      
      const typeFrequency = {};
      anomalyTypes.forEach(type => {
        typeFrequency[type] = (typeFrequency[type] || 0) + 1;
      });

      Object.entries(typeFrequency).forEach(([type, count]) => {
        if (count > 3) {
          insights.patterns.push(`Recurring ${type} detected (${count} times)`);
        }
      });
    }

    return insights;
  }
}

// Singleton instance
const mlService = new MLService();

module.exports = mlService;