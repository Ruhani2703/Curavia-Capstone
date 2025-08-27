const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const cron = require('node-cron');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3039', 
    'http://localhost:3040',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/curavia';

mongoose.connect(MONGODB_URI)
.then(() => {
  console.log('Connected to MongoDB successfully');
})
.catch((error) => {
  console.error('MongoDB connection error:', error);
  process.exit(1);
});

// Import routes
const authRoutes = require('./routes/auth');
const patientRoutes = require('./routes/patient');
const sensorRoutes = require('./routes/sensor');
const alertRoutes = require('./routes/alert');
const reportRoutes = require('./routes/report');
const adminRoutes = require('./routes/admin');
const doctorRoutes = require('./routes/doctor');
const dietExerciseRoutes = require('./routes/diet-exercise');
const mlRoutes = require('./routes/ml');
const thingspeakRoutes = require('./routes/thingspeak');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/patient', patientRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/sensor', sensorRoutes);
app.use('/api/sensor-data', sensorRoutes);  // For analytics dashboard
app.use('/api/alert', alertRoutes);
app.use('/api/report', reportRoutes);
app.use('/api/diet-exercise', dietExerciseRoutes);
app.use('/api/ml', mlRoutes);
app.use('/api/thingspeak', thingspeakRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Curavia backend is running',
    timestamp: new Date().toISOString()
  });
});

// Development debug endpoints (no auth required)
if (process.env.NODE_ENV === 'development') {
  app.get('/api/debug/mock-status', async (req, res) => {
    try {
      const mockService = require('./services/mockThingSpeak');
      const User = require('./models/User');
      const SensorData = require('./models/SensorData');
      
      const patientCount = await User.countDocuments({ role: 'patient' });
      const sensorDataCount = await SensorData.countDocuments({});
      const latestData = await SensorData.findOne({}).sort({ recordedAt: -1 });
      
      res.json({
        success: true,
        data: {
          mockServiceStatus: mockService.getStatus(),
          patients: patientCount,
          mockSensorDataPoints: sensorDataCount,
          latestDataPoint: latestData ? {
            timestamp: latestData.timestamp,
            vitals: latestData.vitals
          } : null
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });
}

// Seed database endpoint (for development only)
if (process.env.NODE_ENV === 'development') {
  app.post('/api/seed', async (req, res) => {
    try {
      const { seedDatabase } = require('./utils/seedData');
      await seedDatabase();
      res.json({ 
        success: true,
        message: 'Database seeded successfully',
        credentials: {
          admin: { email: 'admin@curavia.com', password: 'admin123' },
          doctor: { email: 'doctor@curavia.com', password: 'doctor123' },
          patient: { email: 'patient@curavia.com', password: 'patient123' }
        }
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  });

  // Development data seeding endpoint
  app.post('/api/seed-development', async (req, res) => {
    try {
      const DevelopmentDataSeeder = require('./scripts/seedDevelopmentData');
      const seeder = new DevelopmentDataSeeder();
      
      // Run seeding without disconnecting (server handles connection)
      await seeder.connectToDatabase();
      await seeder.clearExistingData();
      await seeder.createSuperAdmin();
      await seeder.createDoctors();
      await seeder.createPatients();
      await seeder.assignPatientsToDoctor();
      
      res.json({
        success: true,
        message: 'Development database seeded successfully',
        data: {
          patients: 10,
          doctors: 5,
          credentials: {
            superAdmin: { email: 'admin@curavia.com', password: 'admin123' },
            doctors: { email: '[doctor-name]@doctor.curavia.com', password: 'doctor123' },
            patients: { email: '[patient-name]@patient.curavia.com', password: 'patient123' }
          }
        }
      });
    } catch (error) {
      console.error('Development seeding error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to seed development database',
        error: error.message
      });
    }
  });
}

// ThingSpeak data handling - environment-aware
const fetchThingSpeakData = require('./services/thingspeak');
const mockThingSpeakService = require('./services/mockThingSpeak');

// Initialize mock ThingSpeak service if in development mode
if (process.env.THINGSPEAK_MODE === 'development' && process.env.MOCK_DATA_ENABLED === 'true') {
  console.log('🚀 Initializing development mode with mock ThingSpeak data...');
  
  // Start mock data generation with delay to allow DB connection
  setTimeout(async () => {
    try {
      await mockThingSpeakService.startDataGeneration();
      console.log('✅ Mock ThingSpeak service started successfully');
    } catch (error) {
      console.error('❌ Failed to start mock ThingSpeak service:', error);
    }
  }, 2000);
} else {
  // Production mode - use real ThingSpeak
  console.log('🌐 Production mode - using real ThingSpeak data');
  
  cron.schedule('*/30 * * * * *', () => {
    fetchThingSpeakData();
  });
  
  // Fallback test data generation if needed
  if (process.env.NODE_ENV === 'development') {
    const { generateTestSensorData } = require('./services/thingspeak');
    cron.schedule('*/2 * * * *', async () => {
      try {
        console.log('Generating fallback test sensor data...');
        await generateTestSensorData();
      } catch (error) {
        console.error('Error in fallback test data generation:', error);
      }
    });
  }
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: err.message 
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Curavia backend server running on port ${PORT}`);
});