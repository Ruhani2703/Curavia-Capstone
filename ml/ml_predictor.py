#!/usr/bin/env python
import sys
import json
import joblib
import numpy as np
import pandas as pd
import warnings
warnings.filterwarnings('ignore')

# Add the ml directory to path
sys.path.append('/Users/garvitsharma/Desktop/projects/Thappar/ml')
from models.anomaly_detector import HealthAnomalyDetector

def predict_single(vital_signs_json):
    """Make a single prediction for given vital signs"""
    try:
        vital_signs = json.loads(vital_signs_json)
        
        # Load the trained model
        detector = HealthAnomalyDetector()
        detector.load_model('/Users/garvitsharma/Desktop/projects/Thappar/ml/models/health_anomaly_model.pkl')
        
        # Make prediction
        result = detector.predict(vital_signs)
        
        # Convert numpy types to Python native types for JSON serialization
        result_clean = {
            'is_anomaly': bool(result['is_anomaly']),
            'anomaly_score': float(result['anomaly_score']),
            'risk_score': float(result['risk_score']),
            'severity': result['severity'],
            'anomaly_types': result['anomaly_types'],
            'recommendations': result['recommendations']
        }
        
        print(json.dumps(result_clean))
        
    except Exception as e:
        error_response = {
            'error': str(e),
            'is_anomaly': False,
            'risk_score': 0,
            'severity': 'unknown',
            'anomaly_types': [],
            'recommendations': ['Error in ML prediction']
        }
        print(json.dumps(error_response))
        sys.exit(1)

def analyze_batch(historical_data_json):
    """Analyze a batch of historical data"""
    try:
        historical_data = json.loads(historical_data_json)
        
        # Load the trained model
        detector = HealthAnomalyDetector()
        detector.load_model('/Users/garvitsharma/Desktop/projects/Thappar/ml/models/health_anomaly_model.pkl')
        
        # Convert to DataFrame
        df = pd.DataFrame(historical_data)
        
        # Make batch predictions
        predictions = []
        for _, row in df.iterrows():
            vital_signs = {
                'heart_rate': row.get('heart_rate', 0),
                'spo2': row.get('spo2', 0),
                'temperature': row.get('temperature', 0),
                'bp_systolic': row.get('bp_systolic', 0),
                'bp_diastolic': row.get('bp_diastolic', 0),
                'ecg': row.get('ecg', 0)
            }
            
            result = detector.predict(vital_signs)
            predictions.append({
                'is_anomaly': bool(result['is_anomaly']),
                'risk_score': float(result['risk_score']),
                'severity': result['severity']
            })
        
        # Calculate statistics
        anomaly_count = sum(1 for p in predictions if p['is_anomaly'])
        risk_scores = [p['risk_score'] for p in predictions]
        
        analysis = {
            'total_readings': len(predictions),
            'anomaly_count': anomaly_count,
            'anomaly_rate': anomaly_count / len(predictions) if predictions else 0,
            'average_risk': np.mean(risk_scores) if risk_scores else 0,
            'max_risk': max(risk_scores) if risk_scores else 0,
            'min_risk': min(risk_scores) if risk_scores else 0,
            'critical_count': sum(1 for p in predictions if p['severity'] == 'critical'),
            'high_count': sum(1 for p in predictions if p['severity'] == 'high'),
            'predictions': predictions[:10]  # Return first 10 predictions as sample
        }
        
        print(json.dumps(analysis))
        
    except Exception as e:
        error_response = {
            'error': str(e),
            'total_readings': 0,
            'anomaly_count': 0,
            'anomaly_rate': 0
        }
        print(json.dumps(error_response))
        sys.exit(1)

def main():
    if len(sys.argv) < 3:
        print(json.dumps({'error': 'Invalid arguments'}))
        sys.exit(1)
    
    command = sys.argv[1]
    data = sys.argv[2]
    
    if command == 'predict':
        predict_single(data)
    elif command == 'analyze_batch':
        analyze_batch(data)
    else:
        print(json.dumps({'error': f'Unknown command: {command}'}))
        sys.exit(1)

if __name__ == '__main__':
    main()
