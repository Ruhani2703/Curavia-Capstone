const mongoose = require('mongoose');
const User = require('../models/User');
const SensorData = require('../models/SensorData');
const Alert = require('../models/Alert');
const DietPlan = require('../models/DietPlan');
const ExercisePlan = require('../models/ExercisePlan');

const seedUsers = async () => {
  try {
    // Clear existing users
    await User.deleteMany({});
    console.log('Cleared existing users');

    // Create Super Admin User
    const superAdmin = new User({
      name: 'Super Admin',
      email: 'superadmin@curavia.com',
      password: 'superadmin123',
      role: 'super_admin',
      age: 40,
      gender: 'Male',
      createdAt: new Date(),
    });


    // Create Doctor User
    const doctor = new User({
      name: 'Dr. Sarah Johnson',
      email: 'doctor@curavia.com',
      password: 'doctor123',
      role: 'doctor',
      age: 42,
      gender: 'Female',
      createdAt: new Date(),
    });

    // Create Patient User
    const patient = new User({
      name: 'John Smith',
      email: 'patient@curavia.com',
      password: 'patient123',
      role: 'patient',
      surgeryType: 'Cardiac Surgery',
      surgeryDate: new Date('2024-01-15'),
      age: 45,
      gender: 'Male',
      bloodGroup: 'O+',
      height: 175,
      weight: 80,
      bandId: 'CRV-2024-001',
      isBandActive: true,
      expectedRecoveryTime: 90,
      actualRecoveryProgress: 75,
      emergencyContact: {
        name: 'Jane Smith',
        phone: '+1-555-0123',
        relation: 'Wife'
      },
      medications: [
        {
          name: 'Ibuprofen',
          dosage: '400mg',
          frequency: 'Twice daily',
          timings: ['8:00 AM', '8:00 PM'],
          startDate: new Date('2024-01-16'),
          endDate: new Date('2024-04-16'),
          active: true
        },
        {
          name: 'Lisinopril',
          dosage: '10mg',
          frequency: 'Once daily',
          timings: ['8:00 AM'],
          startDate: new Date('2024-01-16'),
          endDate: new Date('2024-12-31'),
          active: true
        }
      ],
      dailySteps: {
        target: 5000,
        current: 3750
      },
      patientId: 'CRV2024001',
      thingspeakChannel: {
        channelId: '2631234',
        readApiKey: 'DEMO_READ_KEY_123',
        writeApiKey: 'DEMO_WRITE_KEY_456'
      }
    });

    // Save users
    await superAdmin.save();
    await doctor.save();
    await patient.save();

    // Assign doctor to patient
    patient.assignedDoctor = doctor._id;
    await patient.save();

    console.log('✅ Seed users created successfully:');
    console.log(`Super Admin: superadmin@curavia.com / superadmin123`);
    console.log(`Doctor: doctor@curavia.com / doctor123`);
    console.log(`Patient: patient@curavia.com / patient123`);

    return { superAdmin, doctor, patient };
  } catch (error) {
    console.error('❌ Error seeding users:', error);
    throw error;
  }
};

const seedSensorData = async (patient) => {
  try {
    // Clear existing sensor data
    await SensorData.deleteMany({});
    console.log('Cleared existing sensor data');

    // Generate sample sensor data for the last 7 days
    const sensorDataEntries = [];
    const now = new Date();

    for (let i = 0; i < 168; i++) { // 7 days * 24 hours
      const timestamp = new Date(now.getTime() - (i * 60 * 60 * 1000)); // Each hour
      
      // Generate realistic vital signs with some variation
      const baseHeartRate = 72;
      const baseSystolic = 120;
      const baseDiastolic = 80;
      const baseSpO2 = 98;
      const baseTemp = 98.6;

      const heartRate = baseHeartRate + (Math.random() - 0.5) * 20;
      const systolic = baseSystolic + (Math.random() - 0.5) * 30;
      const diastolic = baseDiastolic + (Math.random() - 0.5) * 20;
      const spO2 = baseSpO2 + (Math.random() - 0.5) * 4;
      const temperature = baseTemp + (Math.random() - 0.5) * 2;

      const sensorEntry = new SensorData({
        userId: patient._id,
        bandId: patient.bandId,
        heartRate: {
          value: Math.round(heartRate),
          timestamp: timestamp
        },
        bloodPressure: {
          systolic: Math.round(systolic),
          diastolic: Math.round(diastolic),
          timestamp: timestamp
        },
        spO2: {
          value: Math.round(spO2 * 10) / 10,
          timestamp: timestamp
        },
        temperature: {
          value: Math.round(temperature * 10) / 10,
          timestamp: timestamp
        },
        ecg: {
          value: Math.round((Math.random() * 100) + 50),
          timestamp: timestamp
        },
        movement: {
          steps: Math.round(Math.random() * 1000),
          distance: Math.round(Math.random() * 800), // meters
          calories: Math.round(Math.random() * 50),
          activityLevel: ['sedentary', 'light', 'moderate'][Math.floor(Math.random() * 3)],
          timestamp: timestamp
        },
        batteryLevel: Math.round(85 + (Math.random() * 15)),
        recordedAt: timestamp,
        syncedAt: new Date(),
        thingspeakData: {
          channelId: '3008199',
          entryId: 1000 + i,
          field1: Math.round(heartRate),
          field2: Math.round(spO2 * 10) / 10,
          field3: Math.round(temperature * 10) / 10,
          field4: Math.round((Math.random() * 100) + 50),
          createdAt: timestamp
        }
      });

      sensorDataEntries.push(sensorEntry);
    }

    await SensorData.insertMany(sensorDataEntries);
    console.log(`✅ Created ${sensorDataEntries.length} sensor data entries`);

    return sensorDataEntries;
  } catch (error) {
    console.error('❌ Error seeding sensor data:', error);
    throw error;
  }
};

const seedAlerts = async (patient) => {
  try {
    // Clear existing alerts
    await Alert.deleteMany({});
    console.log('Cleared existing alerts');

    const alerts = [
      {
        userId: patient._id,
        type: 'vital_breach',
        severity: 'high',
        title: 'High Heart Rate Alert',
        message: 'Heart rate exceeded normal range at 105 bpm',
        details: {
          parameter: 'heartRate',
          currentValue: 105,
          normalRange: { min: 60, max: 100 }
        },
        status: 'resolved',
        resolvedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000) // 3 hours ago
      },
      {
        userId: patient._id,
        type: 'medication_reminder',
        severity: 'medium',
        title: 'Medication Due',
        message: 'Time to take your evening Ibuprofen (400mg)',
        details: {
          medication: {
            name: 'Ibuprofen',
            dosage: '400mg',
            time: '8:00 PM'
          }
        },
        status: 'pending',
        createdAt: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
      },
      {
        userId: patient._id,
        type: 'inactivity',
        severity: 'low',
        title: 'Low Activity Alert',
        message: 'You have been sedentary for more than 3 hours',
        status: 'acknowledged',
        acknowledgedAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000) // 4 hours ago
      }
    ];

    await Alert.insertMany(alerts);
    console.log(`✅ Created ${alerts.length} sample alerts`);

    return alerts;
  } catch (error) {
    console.error('❌ Error seeding alerts:', error);
    throw error;
  }
};

const seedDietPlan = async (patient) => {
  try {
    // Clear existing diet plans
    await DietPlan.deleteMany({});

    const dietPlan = new DietPlan({
      userId: patient._id,
      surgeryType: patient.surgeryType,
      phase: 'mid_recovery',
      basedOnVitals: {
        bloodPressure: {
          status: 'normal',
          recommendations: ['Maintain current sodium intake', 'Continue heart-healthy foods']
        },
        heartRate: {
          status: 'normal',
          recommendations: ['Continue current diet pattern']
        }
      },
      meals: {
        breakfast: {
          time: '8:00 AM',
          items: ['Oatmeal with berries', 'Greek yogurt', 'Green tea'],
          calories: 350,
          proteins: 15,
          carbs: 45,
          fats: 8,
          instructions: 'Start with light, easily digestible foods'
        },
        midMorningSnack: {
          time: '10:30 AM',
          items: ['Apple slices', 'Almonds (10 pieces)'],
          calories: 150,
          instructions: 'Keep portions small'
        },
        lunch: {
          time: '1:00 PM',
          items: ['Grilled chicken breast', 'Quinoa', 'Steamed vegetables', 'Olive oil'],
          calories: 450,
          proteins: 35,
          carbs: 40,
          fats: 12,
          instructions: 'Focus on lean proteins and complex carbs'
        },
        eveningSnack: {
          time: '4:00 PM',
          items: ['Carrot sticks', 'Hummus'],
          calories: 100,
          instructions: 'Light and nutritious'
        },
        dinner: {
          time: '7:00 PM',
          items: ['Baked salmon', 'Sweet potato', 'Green salad', 'Lemon dressing'],
          calories: 400,
          proteins: 30,
          carbs: 35,
          fats: 15,
          instructions: 'Keep dinner light but nutritious'
        }
      },
      dailyTargets: {
        calories: { min: 1400, max: 1600 },
        proteins: { min: 80, max: 100 },
        carbs: { min: 120, max: 160 },
        fats: { min: 35, max: 50 },
        fiber: { min: 25, max: 35 },
        water: { min: 2, max: 3 }
      },
      restrictions: ['No spicy foods', 'Limited caffeine', 'No alcohol'],
      supplements: [
        {
          name: 'Vitamin D3',
          dosage: '1000 IU',
          timing: 'With breakfast',
          reason: 'Bone health and recovery'
        },
        {
          name: 'Omega-3',
          dosage: '1000mg',
          timing: 'With dinner',
          reason: 'Heart health and inflammation'
        }
      ],
      specialInstructions: [
        'Eat slowly and chew thoroughly',
        'Stay hydrated throughout the day',
        'Avoid large meals, eat smaller frequent meals'
      ],
      active: true,
      createdBy: patient.assignedDoctor
    });

    await dietPlan.save();
    console.log('✅ Created sample diet plan');

    return dietPlan;
  } catch (error) {
    console.error('❌ Error seeding diet plan:', error);
    throw error;
  }
};

const seedExercisePlan = async (patient) => {
  try {
    // Clear existing exercise plans
    await ExercisePlan.deleteMany({});

    const exercisePlan = new ExercisePlan({
      userId: patient._id,
      surgeryType: patient.surgeryType,
      phase: 'mid_recovery',
      weekNumber: 6,
      exercises: [
        {
          day: 'Monday',
          activities: [
            {
              name: 'Morning Walk',
              type: 'walking',
              duration: 20,
              intensity: 'light',
              instructions: 'Walk at comfortable pace, stop if you feel tired',
              completed: true,
              completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
            },
            {
              name: 'Breathing Exercises',
              type: 'breathing',
              duration: 10,
              sets: 3,
              reps: 10,
              intensity: 'very_light',
              instructions: 'Deep breathing, hold for 5 seconds',
              completed: true,
              completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
            }
          ],
          targetSteps: 3000,
          actualSteps: 3250
        },
        {
          day: 'Tuesday',
          activities: [
            {
              name: 'Gentle Stretching',
              type: 'stretching',
              duration: 15,
              intensity: 'very_light',
              instructions: 'Focus on arms and shoulders, avoid chest area',
              completed: true,
              completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
            }
          ],
          targetSteps: 2500,
          actualSteps: 2800
        },
        {
          day: 'Wednesday',
          activities: [
            {
              name: 'Walking',
              type: 'walking',
              duration: 25,
              intensity: 'light',
              instructions: 'Increase duration gradually',
              completed: false
            }
          ],
          targetSteps: 3500,
          actualSteps: 0
        }
      ],
      weeklyTargets: {
        totalSteps: 20000,
        activeMinutes: 150,
        exerciseSessions: 5,
        caloriesBurn: 800
      },
      restrictions: ['No heavy lifting', 'Avoid chest exercises', 'Stop if chest pain occurs'],
      precautions: ['Monitor heart rate', 'Stay hydrated', 'Rest when needed'],
      progressTracking: [
        {
          week: 5,
          stepsAchieved: 18500,
          exercisesCompleted: 4,
          totalExercises: 5,
          painLevel: 2,
          fatigue: 'mild',
          notes: 'Good progress, gradually increasing activity',
          recordedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      ],
      motivationalQuotes: [
        {
          quote: 'Every step forward is a step toward recovery.',
          author: 'Unknown',
          displayDate: new Date()
        }
      ],
      achievements: [
        {
          title: 'First Week Champion',
          description: 'Completed your first week of exercises!',
          icon: '🏆',
          unlockedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      ],
      active: true,
      createdBy: patient.assignedDoctor
    });

    await exercisePlan.save();
    console.log('✅ Created sample exercise plan');

    return exercisePlan;
  } catch (error) {
    console.error('❌ Error seeding exercise plan:', error);
    throw error;
  }
};

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Check if database is connected
    if (mongoose.connection.readyState !== 1) {
      console.log('Database not connected. Please ensure the server is running.');
      return;
    }

    // Seed users first
    const { superAdmin, doctor, patient } = await seedUsers();

    // Seed related data
    await Promise.all([
      seedSensorData(patient),
      seedAlerts(patient),
      seedDietPlan(patient),
      seedExercisePlan(patient)
    ]);

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📝 Login Credentials:');
    console.log('┌─────────────────────────────────────────┐');
    console.log('│ Role       │ Email                │ Password │');
    console.log('├─────────────────────────────────────────┤');
    console.log('│ SuperAdmin │ superadmin@curavia.com│superadmin123│');
    console.log('│ Doctor     │ doctor@curavia.com   │ doctor123│');
    console.log('│ Patient    │ patient@curavia.com  │ patient123│');
    console.log('└─────────────────────────────────────────┘');
    console.log('\n💡 You can now login with these credentials!');

  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    throw error;
  }
};

module.exports = {
  seedDatabase,
  seedUsers,
  seedSensorData,
  seedAlerts,
  seedDietPlan,
  seedExercisePlan
};