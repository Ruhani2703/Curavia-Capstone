import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import random

class HealthDataGenerator:
    def __init__(self, num_samples=10000, anomaly_rate=0.3):
        self.num_samples = num_samples
        self.anomaly_rate = anomaly_rate
        self.start_time = datetime.now() - timedelta(days=30)
        
    def generate_normal_vitals(self, timestamp_hour):
        circadian_factor = np.sin(2 * np.pi * timestamp_hour / 24)
        
        heart_rate = np.random.normal(70 + 5 * circadian_factor, 8)
        heart_rate = np.clip(heart_rate, 60, 100)
        
        spo2 = np.random.normal(97, 1.5)
        spo2 = np.clip(spo2, 95, 99)
        
        temp_base = 98.6 + 0.5 * circadian_factor
        temperature = np.random.normal(temp_base, 0.3)
        temperature = np.clip(temperature, 97.0, 99.0)
        
        bp_systolic = np.random.normal(120 + 3 * circadian_factor, 8)
        bp_systolic = np.clip(bp_systolic, 110, 130)
        
        bp_diastolic = np.random.normal(80 + 2 * circadian_factor, 5)
        bp_diastolic = np.clip(bp_diastolic, 70, 85)
        
        ecg = np.random.normal(0, 10)
        
        activity_levels = ['sedentary', 'light', 'moderate']
        activity = np.random.choice(activity_levels, p=[0.5, 0.35, 0.15])
        
        return {
            'heart_rate': round(heart_rate, 1),
            'spo2': round(spo2, 1),
            'temperature': round(temperature, 1),
            'bp_systolic': round(bp_systolic),
            'bp_diastolic': round(bp_diastolic),
            'ecg': round(ecg, 2),
            'activity_level': activity,
            'is_anomaly': 0,
            'anomaly_type': 'none',
            'severity': 'normal'
        }
    
    def inject_anomaly(self, normal_data, anomaly_type=None):
        data = normal_data.copy()
        
        if anomaly_type is None:
            anomaly_types = [
                'bradycardia', 'tachycardia', 'hypoxia', 'fever',
                'hypertension', 'hypotension', 'irregular_pattern'
            ]
            weights = [0.15, 0.15, 0.15, 0.15, 0.15, 0.1, 0.15]
            anomaly_type = np.random.choice(anomaly_types, p=weights)
        
        if anomaly_type == 'bradycardia':
            data['heart_rate'] = np.random.uniform(35, 50)
            data['severity'] = 'high'
        elif anomaly_type == 'tachycardia':
            data['heart_rate'] = np.random.uniform(120, 180)
            data['severity'] = 'high'
        elif anomaly_type == 'hypoxia':
            data['spo2'] = np.random.uniform(85, 92)
            data['severity'] = 'critical'
        elif anomaly_type == 'fever':
            data['temperature'] = np.random.uniform(100.5, 104)
            data['severity'] = 'medium'
        elif anomaly_type == 'hypertension':
            data['bp_systolic'] = np.random.uniform(140, 180)
            data['bp_diastolic'] = np.random.uniform(90, 120)
            data['severity'] = 'high'
        elif anomaly_type == 'hypotension':
            data['bp_systolic'] = np.random.uniform(80, 100)
            data['bp_diastolic'] = np.random.uniform(50, 65)
            data['severity'] = 'medium'
        elif anomaly_type == 'irregular_pattern':
            data['heart_rate'] = data['heart_rate'] + np.random.uniform(-30, 30)
            data['ecg'] = np.random.uniform(-50, 50)
            data['severity'] = 'medium'
        
        data['is_anomaly'] = 1
        data['anomaly_type'] = anomaly_type
        
        for key in ['heart_rate', 'spo2', 'temperature', 'bp_systolic', 'bp_diastolic', 'ecg']:
            if key in data:
                data[key] = round(data[key], 1)
        
        return data
    
    def generate_dataset(self):
        data = []
        current_time = self.start_time
        
        anomaly_count = int(self.num_samples * self.anomaly_rate)
        normal_count = self.num_samples - anomaly_count
        
        anomaly_indices = set(random.sample(range(self.num_samples), anomaly_count))
        
        for i in range(self.num_samples):
            timestamp_hour = current_time.hour + (current_time.minute / 60)
            
            if i in anomaly_indices:
                normal_vitals = self.generate_normal_vitals(timestamp_hour)
                sample = self.inject_anomaly(normal_vitals)
            else:
                sample = self.generate_normal_vitals(timestamp_hour)
            
            sample['timestamp'] = current_time
            sample['patient_id'] = f"PATIENT_{random.randint(1, 10):03d}"
            sample['band_id'] = f"BAND_{random.randint(1, 10):03d}"
            
            data.append(sample)
            current_time += timedelta(minutes=5)
        
        df = pd.DataFrame(data)
        
        columns_order = [
            'timestamp', 'patient_id', 'band_id', 'heart_rate', 'spo2', 
            'temperature', 'bp_systolic', 'bp_diastolic', 'ecg', 
            'activity_level', 'is_anomaly', 'anomaly_type', 'severity'
        ]
        df = df[columns_order]
        
        return df
    
    def add_realistic_patterns(self, df):
        for patient_id in df['patient_id'].unique():
            patient_mask = df['patient_id'] == patient_id
            patient_data = df[patient_mask]
            
            if len(patient_data) > 20:
                exercise_start = random.randint(10, len(patient_data) - 10)
                for i in range(exercise_start, min(exercise_start + 6, len(patient_data))):
                    if df.loc[patient_data.index[i], 'is_anomaly'] == 0:
                        df.loc[patient_data.index[i], 'heart_rate'] = min(
                            df.loc[patient_data.index[i], 'heart_rate'] + random.uniform(10, 30),
                            110
                        )
                        df.loc[patient_data.index[i], 'activity_level'] = 'moderate'
        
        return df

if __name__ == "__main__":
    print("Generating synthetic health monitoring dataset...")
    
    generator = HealthDataGenerator(num_samples=10000, anomaly_rate=0.3)
    df = generator.generate_dataset()
    df = generator.add_realistic_patterns(df)
    
    df.to_csv('/Users/garvitsharma/Desktop/projects/Thappar/ml/data/synthetic_health_data.csv', index=False)
    
    print(f"Dataset generated successfully!")
    print(f"Total samples: {len(df)}")
    print(f"Normal samples: {(df['is_anomaly'] == 0).sum()}")
    print(f"Anomaly samples: {(df['is_anomaly'] == 1).sum()}")
    print(f"\nAnomaly distribution:")
    print(df[df['is_anomaly'] == 1]['anomaly_type'].value_counts())
    print(f"\nSeverity distribution:")
    print(df[df['is_anomaly'] == 1]['severity'].value_counts())
    
    print("\nDataset saved to: ml/data/synthetic_health_data.csv")