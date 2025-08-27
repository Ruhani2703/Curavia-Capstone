import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix
import joblib
import warnings
warnings.filterwarnings('ignore')

class HealthAnomalyDetector:
    def __init__(self, contamination=0.3):
        self.contamination = contamination
        self.scaler = StandardScaler()
        self.model = IsolationForest(
            contamination=contamination,
            random_state=42,
            n_estimators=100,
            max_samples='auto',
            bootstrap=False
        )
        self.feature_columns = [
            'heart_rate', 'spo2', 'temperature', 
            'bp_systolic', 'bp_diastolic', 'ecg'
        ]
        self.thresholds = {
            'heart_rate': {'min': 60, 'max': 100},
            'spo2': {'min': 95, 'max': 100},
            'temperature': {'min': 97.0, 'max': 99.5},
            'bp_systolic': {'min': 90, 'max': 140},
            'bp_diastolic': {'min': 60, 'max': 90}
        }
        
    def prepare_features(self, df):
        features = df[self.feature_columns].copy()
        
        features['hr_variance'] = features['heart_rate'].rolling(window=3, min_periods=1).std().fillna(0)
        features['bp_ratio'] = features['bp_systolic'] / features['bp_diastolic']
        features['vitals_composite'] = (
            features['heart_rate'] / 100 + 
            (100 - features['spo2']) / 10 + 
            abs(features['temperature'] - 98.6)
        )
        
        return features
    
    def train(self, df):
        print("Training anomaly detection model...")
        
        X = self.prepare_features(df)
        y = df['is_anomaly'].values
        
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        X_train_scaled = self.scaler.fit_transform(X_train)
        self.model.fit(X_train_scaled)
        
        X_test_scaled = self.scaler.transform(X_test)
        predictions = self.model.predict(X_test_scaled)
        predictions = (predictions == -1).astype(int)
        
        print("\nModel Performance:")
        print("=" * 50)
        print(classification_report(y_test, predictions, 
                                   target_names=['Normal', 'Anomaly']))
        
        cm = confusion_matrix(y_test, predictions)
        print("\nConfusion Matrix:")
        print(f"True Negatives: {cm[0,0]}")
        print(f"False Positives: {cm[0,1]}")
        print(f"False Negatives: {cm[1,0]}")
        print(f"True Positives: {cm[1,1]}")
        
        accuracy = (cm[0,0] + cm[1,1]) / cm.sum()
        sensitivity = cm[1,1] / (cm[1,0] + cm[1,1])
        specificity = cm[0,0] / (cm[0,0] + cm[0,1])
        
        print(f"\nAccuracy: {accuracy:.2%}")
        print(f"Sensitivity (Recall): {sensitivity:.2%}")
        print(f"Specificity: {specificity:.2%}")
        
        return {
            'accuracy': accuracy,
            'sensitivity': sensitivity,
            'specificity': specificity
        }
    
    def predict(self, data):
        if isinstance(data, dict):
            df = pd.DataFrame([data])
        else:
            df = data
        
        X = self.prepare_features(df)
        X_scaled = self.scaler.transform(X)
        
        anomaly_score = self.model.score_samples(X_scaled)
        
        prediction = self.model.predict(X_scaled)
        is_anomaly = (prediction == -1).astype(int)
        
        severity = self.calculate_severity(df)
        
        anomaly_types = self.identify_anomaly_type(df)
        
        risk_score = self.calculate_risk_score(
            anomaly_score[0] if len(anomaly_score) == 1 else anomaly_score,
            severity
        )
        
        result = {
            'is_anomaly': bool(is_anomaly[0]) if len(is_anomaly) == 1 else is_anomaly.tolist(),
            'anomaly_score': float(anomaly_score[0]) if len(anomaly_score) == 1 else anomaly_score.tolist(),
            'risk_score': risk_score,
            'severity': severity,
            'anomaly_types': anomaly_types,
            'recommendations': self.get_recommendations(anomaly_types, severity)
        }
        
        return result
    
    def calculate_severity(self, df):
        severity_scores = []
        
        for _, row in df.iterrows():
            score = 0
            
            hr_deviation = abs(row['heart_rate'] - 75) / 75
            if hr_deviation > 0.3:
                score += 2
            elif hr_deviation > 0.2:
                score += 1
            
            if row['spo2'] < 92:
                score += 3
            elif row['spo2'] < 95:
                score += 1
            
            if row['temperature'] > 100.5:
                score += 2
            elif row['temperature'] > 99.5:
                score += 1
            
            if row['bp_systolic'] > 140 or row['bp_diastolic'] > 90:
                score += 2
            elif row['bp_systolic'] > 130 or row['bp_diastolic'] > 85:
                score += 1
            
            severity_scores.append(score)
        
        if len(severity_scores) == 1:
            score = severity_scores[0]
            if score >= 5:
                return 'critical'
            elif score >= 3:
                return 'high'
            elif score >= 1:
                return 'medium'
            else:
                return 'low'
        
        return ['critical' if s >= 5 else 'high' if s >= 3 else 'medium' if s >= 1 else 'low' 
                for s in severity_scores]
    
    def identify_anomaly_type(self, df):
        anomaly_types = []
        
        for _, row in df.iterrows():
            types = []
            
            if row['heart_rate'] < self.thresholds['heart_rate']['min']:
                types.append('bradycardia')
            elif row['heart_rate'] > self.thresholds['heart_rate']['max']:
                types.append('tachycardia')
            
            if row['spo2'] < self.thresholds['spo2']['min']:
                types.append('hypoxia')
            
            if row['temperature'] > self.thresholds['temperature']['max']:
                types.append('fever')
            
            if row['bp_systolic'] > self.thresholds['bp_systolic']['max']:
                types.append('hypertension')
            elif row['bp_systolic'] < self.thresholds['bp_systolic']['min']:
                types.append('hypotension')
            
            anomaly_types.append(types if types else ['none'])
        
        return anomaly_types[0] if len(anomaly_types) == 1 else anomaly_types
    
    def calculate_risk_score(self, anomaly_score, severity):
        normalized_score = 1 / (1 + np.exp(anomaly_score))
        
        severity_weight = {
            'critical': 1.0,
            'high': 0.75,
            'medium': 0.5,
            'low': 0.25
        }
        
        if isinstance(severity, str):
            weight = severity_weight.get(severity, 0.5)
            return float(normalized_score * 100 * weight)
        else:
            return [float(normalized_score[i] * 100 * severity_weight.get(s, 0.5)) 
                   for i, s in enumerate(severity)]
    
    def get_recommendations(self, anomaly_types, severity):
        recommendations = []
        
        if isinstance(anomaly_types, list) and len(anomaly_types) > 0:
            types = anomaly_types if isinstance(anomaly_types[0], str) else anomaly_types[0]
        else:
            types = anomaly_types if isinstance(anomaly_types, list) else [anomaly_types]
        
        if 'bradycardia' in types:
            recommendations.append("Monitor for dizziness or fatigue. Consider ECG evaluation.")
        if 'tachycardia' in types:
            recommendations.append("Check for dehydration or anxiety. Monitor continuously.")
        if 'hypoxia' in types:
            recommendations.append("URGENT: Check oxygen supplementation. Monitor respiratory status.")
        if 'fever' in types:
            recommendations.append("Administer antipyretics. Monitor temperature trends.")
        if 'hypertension' in types:
            recommendations.append("Review medications. Check for stress factors.")
        if 'hypotension' in types:
            recommendations.append("Ensure adequate hydration. Monitor for syncope.")
        
        if severity in ['critical', 'high']:
            recommendations.insert(0, "IMMEDIATE MEDICAL ATTENTION REQUIRED")
        
        return recommendations if recommendations else ["Continue routine monitoring"]
    
    def save_model(self, path):
        model_data = {
            'model': self.model,
            'scaler': self.scaler,
            'feature_columns': self.feature_columns,
            'thresholds': self.thresholds,
            'contamination': self.contamination
        }
        joblib.dump(model_data, path)
        print(f"Model saved to {path}")
    
    def load_model(self, path):
        model_data = joblib.load(path)
        self.model = model_data['model']
        self.scaler = model_data['scaler']
        self.feature_columns = model_data['feature_columns']
        self.thresholds = model_data['thresholds']
        self.contamination = model_data['contamination']
        print(f"Model loaded from {path}")

if __name__ == "__main__":
    df = pd.read_csv('/Users/garvitsharma/Desktop/projects/Thappar/ml/data/synthetic_health_data.csv')
    
    detector = HealthAnomalyDetector(contamination=0.3)
    
    metrics = detector.train(df)
    
    detector.save_model('/Users/garvitsharma/Desktop/projects/Thappar/ml/models/health_anomaly_model.pkl')
    
    print("\n" + "="*50)
    print("Testing on sample data:")
    print("="*50)
    
    normal_sample = {
        'heart_rate': 75,
        'spo2': 98,
        'temperature': 98.6,
        'bp_systolic': 120,
        'bp_diastolic': 80,
        'ecg': 0
    }
    
    anomaly_sample = {
        'heart_rate': 45,
        'spo2': 89,
        'temperature': 101.5,
        'bp_systolic': 160,
        'bp_diastolic': 95,
        'ecg': 25
    }
    
    print("\nNormal Sample Prediction:")
    result = detector.predict(normal_sample)
    print(f"Is Anomaly: {result['is_anomaly']}")
    print(f"Risk Score: {result['risk_score']:.2f}%")
    print(f"Severity: {result['severity']}")
    
    print("\nAnomaly Sample Prediction:")
    result = detector.predict(anomaly_sample)
    print(f"Is Anomaly: {result['is_anomaly']}")
    print(f"Risk Score: {result['risk_score']:.2f}%")
    print(f"Severity: {result['severity']}")
    print(f"Detected Issues: {', '.join(result['anomaly_types'])}")
    print(f"Recommendations: {result['recommendations']}")