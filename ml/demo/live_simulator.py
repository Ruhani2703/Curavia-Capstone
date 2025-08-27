import sys
import time
import random
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import joblib
sys.path.append('/Users/garvitsharma/Desktop/projects/Thappar/ml')
from models.anomaly_detector import HealthAnomalyDetector

class LiveHealthSimulator:
    def __init__(self, model_path='/Users/garvitsharma/Desktop/projects/Thappar/ml/models/health_anomaly_model.pkl'):
        self.detector = HealthAnomalyDetector()
        self.detector.load_model(model_path)
        self.current_state = 'normal'
        self.transition_counter = 0
        self.anomaly_scenarios = [
            'exercise_spike', 'bradycardia_episode', 'fever_onset',
            'hypoxia_event', 'panic_attack', 'sleep_apnea'
        ]
        
    def generate_baseline_vitals(self):
        return {
            'heart_rate': np.random.normal(72, 5),
            'spo2': np.random.normal(97, 1),
            'temperature': np.random.normal(98.6, 0.2),
            'bp_systolic': np.random.normal(120, 5),
            'bp_diastolic': np.random.normal(80, 3),
            'ecg': np.random.normal(0, 5)
        }
    
    def apply_scenario(self, vitals, scenario, progress):
        if scenario == 'exercise_spike':
            vitals['heart_rate'] = 70 + progress * 50
            vitals['bp_systolic'] = 120 + progress * 20
            vitals['temperature'] = 98.6 + progress * 0.8
            
        elif scenario == 'bradycardia_episode':
            vitals['heart_rate'] = 70 - progress * 30
            vitals['bp_systolic'] = 120 - progress * 15
            
        elif scenario == 'fever_onset':
            vitals['temperature'] = 98.6 + progress * 3.5
            vitals['heart_rate'] = 72 + progress * 15
            
        elif scenario == 'hypoxia_event':
            vitals['spo2'] = 97 - progress * 10
            vitals['heart_rate'] = 72 + progress * 20
            
        elif scenario == 'panic_attack':
            vitals['heart_rate'] = 72 + progress * 60
            vitals['bp_systolic'] = 120 + progress * 30
            vitals['bp_diastolic'] = 80 + progress * 15
            
        elif scenario == 'sleep_apnea':
            vitals['spo2'] = 97 - progress * 8
            vitals['heart_rate'] = 72 - progress * 10
            
        return vitals
    
    def generate_next_reading(self):
        vitals = self.generate_baseline_vitals()
        
        if self.current_state == 'normal':
            if random.random() < 0.05:
                self.current_state = 'transitioning'
                self.current_scenario = random.choice(self.anomaly_scenarios)
                self.transition_counter = 0
                print(f"\n🔄 Starting scenario: {self.current_scenario}")
        
        elif self.current_state == 'transitioning':
            self.transition_counter += 1
            progress = min(self.transition_counter / 10, 1.0)
            vitals = self.apply_scenario(vitals, self.current_scenario, progress)
            
            if self.transition_counter >= 10:
                self.current_state = 'anomaly'
                self.anomaly_duration = random.randint(5, 15)
                self.anomaly_counter = 0
        
        elif self.current_state == 'anomaly':
            self.anomaly_counter += 1
            vitals = self.apply_scenario(vitals, self.current_scenario, 1.0)
            
            if self.anomaly_counter >= self.anomaly_duration:
                self.current_state = 'recovering'
                self.recovery_counter = 0
        
        elif self.current_state == 'recovering':
            self.recovery_counter += 1
            progress = 1.0 - (self.recovery_counter / 10)
            vitals = self.apply_scenario(vitals, self.current_scenario, progress)
            
            if self.recovery_counter >= 10:
                self.current_state = 'normal'
                print(f"✅ Recovered from {self.current_scenario}")
        
        for key in vitals:
            if key != 'ecg':
                vitals[key] = round(vitals[key], 1)
        
        return vitals
    
    def format_vitals_display(self, vitals, prediction):
        severity_colors = {
            'critical': '🔴',
            'high': '🟠',
            'medium': '🟡',
            'low': '🟢'
        }
        
        status_icon = '⚠️' if prediction['is_anomaly'] else '✓'
        severity_icon = severity_colors.get(prediction['severity'], '⚪')
        
        display = f"""
╔══════════════════════════════════════════════════════════╗
║                   VITAL SIGNS MONITOR                     ║
╠══════════════════════════════════════════════════════════╣
║  Time: {datetime.now().strftime('%H:%M:%S')}                                        ║
║                                                           ║
║  ❤️  Heart Rate:      {vitals['heart_rate']:>6.1f} bpm                     ║
║  🫁 SpO2:            {vitals['spo2']:>6.1f} %                       ║
║  🌡️  Temperature:     {vitals['temperature']:>6.1f} °F                      ║
║  💉 Blood Pressure:  {vitals['bp_systolic']:>3.0f}/{vitals['bp_diastolic']:>3.0f} mmHg                  ║
║  📊 ECG:             {vitals['ecg']:>6.1f}                          ║
║                                                           ║
╠══════════════════════════════════════════════════════════╣
║  Status: {status_icon} {'ANOMALY DETECTED' if prediction['is_anomaly'] else 'NORMAL         '}                         ║
║  Severity: {severity_icon} {prediction['severity'].upper():<10}                           ║
║  Risk Score: {prediction['risk_score']:>5.1f}%                              ║"""
        
        if prediction['is_anomaly'] and prediction['anomaly_types'] != ['none']:
            display += f"""
║  Issues: {', '.join(prediction['anomaly_types'][:3]):<35}║"""
        
        display += """
╚══════════════════════════════════════════════════════════╝"""
        
        return display
    
    def run_simulation(self, duration_seconds=120, update_interval=2):
        print("\n" + "="*60)
        print("     LIVE HEALTH MONITORING SIMULATION - ML DEMO")
        print("="*60)
        print("\nSimulating real-time vital signs with anomaly detection...")
        print("Press Ctrl+C to stop the simulation\n")
        
        start_time = time.time()
        reading_count = 0
        anomalies_detected = 0
        
        try:
            while time.time() - start_time < duration_seconds:
                reading_count += 1
                
                vitals = self.generate_next_reading()
                
                prediction = self.detector.predict(vitals)
                
                if prediction['is_anomaly']:
                    anomalies_detected += 1
                
                print("\033[2J\033[H")
                print(self.format_vitals_display(vitals, prediction))
                
                if prediction['is_anomaly'] and prediction['severity'] in ['critical', 'high']:
                    print("\n🚨 ALERT: " + prediction['recommendations'][0])
                    if len(prediction['recommendations']) > 1:
                        print("   Recommendations:")
                        for rec in prediction['recommendations'][1:3]:
                            print(f"   • {rec}")
                
                print(f"\n📊 Statistics: Readings: {reading_count} | Anomalies: {anomalies_detected}")
                print(f"⏱️  Simulation Time: {int(time.time() - start_time)}s / {duration_seconds}s")
                
                time.sleep(update_interval)
                
        except KeyboardInterrupt:
            print("\n\nSimulation stopped by user.")
        
        print("\n" + "="*60)
        print("SIMULATION COMPLETE")
        print("="*60)
        print(f"Total Readings: {reading_count}")
        print(f"Anomalies Detected: {anomalies_detected}")
        print(f"Detection Rate: {(anomalies_detected/reading_count)*100:.1f}%")
        print(f"Duration: {int(time.time() - start_time)} seconds")

if __name__ == "__main__":
    simulator = LiveHealthSimulator()
    simulator.run_simulation(duration_seconds=120, update_interval=2)