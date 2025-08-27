const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Indian patient names with realistic medical data
const PATIENTS_DATA = [
  {
    name: 'Aarav Sharma',
    email: 'aarav.sharma@patient.curavia.com',
    age: 45,
    gender: 'Male',
    surgeryType: 'Cardiac Surgery',
    surgeryDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
    bloodGroup: 'B+',
    height: 175,
    weight: 78,
    riskLevel: 'medium',
    phone: '+91 9876543210',
    address: 'MG Road, Bangalore, Karnataka 560001',
    emergencyContact: { name: 'Priya Sharma', phone: '+91 9876543211', relation: 'Wife' }
  },
  {
    name: 'Vivaan Patel',
    email: 'vivaan.patel@patient.curavia.com',
    age: 52,
    gender: 'Male',
    surgeryType: 'Orthopedic Surgery',
    surgeryDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
    bloodGroup: 'A+',
    height: 168,
    weight: 72,
    riskLevel: 'low',
    phone: '+91 9876543212',
    address: 'Satellite Road, Ahmedabad, Gujarat 380015',
    emergencyContact: { name: 'Meera Patel', phone: '+91 9876543213', relation: 'Wife' }
  },
  {
    name: 'Arjun Kumar',
    email: 'arjun.kumar@patient.curavia.com',
    age: 38,
    gender: 'Male',
    surgeryType: 'Neurological Surgery',
    surgeryDate: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000), // 22 days ago
    bloodGroup: 'O+',
    height: 180,
    weight: 85,
    riskLevel: 'high',
    phone: '+91 9876543214',
    address: 'Connaught Place, New Delhi, Delhi 110001',
    emergencyContact: { name: 'Sunita Kumar', phone: '+91 9876543215', relation: 'Mother' }
  },
  {
    name: 'Sai Krishna Reddy',
    email: 'sai.krishna@patient.curavia.com',
    age: 29,
    gender: 'Male',
    surgeryType: 'General Surgery',
    surgeryDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    bloodGroup: 'AB+',
    height: 172,
    weight: 68,
    riskLevel: 'low',
    phone: '+91 9876543216',
    address: 'Banjara Hills, Hyderabad, Telangana 500034',
    emergencyContact: { name: 'Lakshmi Reddy', phone: '+91 9876543217', relation: 'Mother' }
  },
  {
    name: 'Reyansh Singh',
    email: 'reyansh.singh@patient.curavia.com',
    age: 41,
    gender: 'Male',
    surgeryType: 'Cardiac Surgery',
    surgeryDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    bloodGroup: 'B-',
    height: 177,
    weight: 80,
    riskLevel: 'medium',
    phone: '+91 9876543218',
    address: 'Civil Lines, Jaipur, Rajasthan 302006',
    emergencyContact: { name: 'Kavita Singh', phone: '+91 9876543219', relation: 'Wife' }
  },
  {
    name: 'Kavya Reddy',
    email: 'kavya.reddy@patient.curavia.com',
    age: 35,
    gender: 'Female',
    surgeryType: 'General Surgery',
    surgeryDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000), // 12 days ago
    bloodGroup: 'A-',
    height: 162,
    weight: 58,
    riskLevel: 'low',
    phone: '+91 9876543220',
    address: 'Jubilee Hills, Hyderabad, Telangana 500033',
    emergencyContact: { name: 'Rajesh Reddy', phone: '+91 9876543221', relation: 'Husband' }
  },
  {
    name: 'Ananya Gupta',
    email: 'ananya.gupta@patient.curavia.com',
    age: 44,
    gender: 'Female',
    surgeryType: 'Orthopedic Surgery',
    surgeryDate: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000), // 18 days ago
    bloodGroup: 'O-',
    height: 158,
    weight: 55,
    riskLevel: 'medium',
    phone: '+91 9876543222',
    address: 'Sector 21, Noida, Uttar Pradesh 201301',
    emergencyContact: { name: 'Amit Gupta', phone: '+91 9876543223', relation: 'Husband' }
  },
  {
    name: 'Diya Joshi',
    email: 'diya.joshi@patient.curavia.com',
    age: 27,
    gender: 'Female',
    surgeryType: 'General Surgery',
    surgeryDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    bloodGroup: 'AB-',
    height: 165,
    weight: 52,
    riskLevel: 'low',
    phone: '+91 9876543224',
    address: 'Koregaon Park, Pune, Maharashtra 411001',
    emergencyContact: { name: 'Rohit Joshi', phone: '+91 9876543225', relation: 'Father' }
  },
  {
    name: 'Aadhya Nair',
    email: 'aadhya.nair@patient.curavia.com',
    age: 39,
    gender: 'Female',
    surgeryType: 'Cardiac Surgery',
    surgeryDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), // 25 days ago
    bloodGroup: 'B+',
    height: 160,
    weight: 60,
    riskLevel: 'high',
    phone: '+91 9876543226',
    address: 'Marine Drive, Kochi, Kerala 682031',
    emergencyContact: { name: 'Suresh Nair', phone: '+91 9876543227', relation: 'Husband' }
  },
  {
    name: 'Myra Verma',
    email: 'myra.verma@patient.curavia.com',
    age: 33,
    gender: 'Female',
    surgeryType: 'Neurological Surgery',
    surgeryDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
    bloodGroup: 'A+',
    height: 163,
    weight: 57,
    riskLevel: 'medium',
    phone: '+91 9876543228',
    address: 'Park Street, Kolkata, West Bengal 700016',
    emergencyContact: { name: 'Vikash Verma', phone: '+91 9876543229', relation: 'Brother' }
  }
];

// Indian doctor names with specializations
const DOCTORS_DATA = [
  {
    name: 'Dr. Rajesh Mehta',
    email: 'rajesh.mehta@doctor.curavia.com',
    specialization: 'Cardiologist',
    department: 'Cardiology',
    licenseNumber: 'MCI-CAR-001',
    phone: '+91 9876540001',
    experience: 15,
    education: 'MBBS, MD Cardiology - AIIMS New Delhi'
  },
  {
    name: 'Dr. Priya Sharma',
    email: 'priya.sharma@doctor.curavia.com',
    specialization: 'Orthopedic Surgeon',
    department: 'Orthopedics',
    licenseNumber: 'MCI-ORT-002',
    phone: '+91 9876540002',
    experience: 12,
    education: 'MBBS, MS Orthopedics - JIPMER Puducherry'
  },
  {
    name: 'Dr. Vikram Patel',
    email: 'vikram.patel@doctor.curavia.com',
    specialization: 'Neurologist',
    department: 'Neurology',
    licenseNumber: 'MCI-NEU-003',
    phone: '+91 9876540003',
    experience: 18,
    education: 'MBBS, DM Neurology - PGI Chandigarh'
  },
  {
    name: 'Dr. Sneha Reddy',
    email: 'sneha.reddy@doctor.curavia.com',
    specialization: 'General Surgeon',
    department: 'General Surgery',
    licenseNumber: 'MCI-GEN-004',
    phone: '+91 9876540004',
    experience: 10,
    education: 'MBBS, MS General Surgery - CMC Vellore'
  },
  {
    name: 'Dr. Arjun Gupta',
    email: 'arjun.gupta@doctor.curavia.com',
    specialization: 'Cardiac Surgeon',
    department: 'Cardiac Surgery',
    licenseNumber: 'MCI-CTS-005',
    phone: '+91 9876540005',
    experience: 20,
    education: 'MBBS, MCh Cardiac Surgery - SGPGI Lucknow'
  }
];

// Doctor-Patient assignments (each doctor gets 2 patients)
const DOCTOR_PATIENT_ASSIGNMENTS = [
  { doctorEmail: 'rajesh.mehta@doctor.curavia.com', patientEmails: ['aarav.sharma@patient.curavia.com', 'reyansh.singh@patient.curavia.com'] },
  { doctorEmail: 'priya.sharma@doctor.curavia.com', patientEmails: ['vivaan.patel@patient.curavia.com', 'ananya.gupta@patient.curavia.com'] },
  { doctorEmail: 'vikram.patel@doctor.curavia.com', patientEmails: ['arjun.kumar@patient.curavia.com', 'myra.verma@patient.curavia.com'] },
  { doctorEmail: 'sneha.reddy@doctor.curavia.com', patientEmails: ['sai.krishna@patient.curavia.com', 'diya.joshi@patient.curavia.com'] },
  { doctorEmail: 'arjun.gupta@doctor.curavia.com', patientEmails: ['kavya.reddy@patient.curavia.com', 'aadhya.nair@patient.curavia.com'] }
];

class DevelopmentDataSeeder {
  constructor() {
    this.createdUsers = {
      patients: [],
      doctors: []
    };
  }

  async connectToDatabase() {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('✅ Connected to MongoDB');
    } catch (error) {
      console.error('❌ MongoDB connection error:', error);
      process.exit(1);
    }
  }

  async clearExistingData() {
    try {
      // Clear existing development users (keep super admin)
      await User.deleteMany({ 
        role: { $in: ['patient', 'doctor'] },
        email: { $regex: '@patient\.curavia\.com|@doctor\.curavia\.com' }
      });
      console.log('✅ Cleared existing development data');
    } catch (error) {
      console.error('❌ Error clearing existing data:', error);
      throw error;
    }
  }

  async createPatients() {
    console.log('👥 Creating patients with Indian names...');
    
    for (let i = 0; i < PATIENTS_DATA.length; i++) {
      const patientData = PATIENTS_DATA[i];
      
      try {
        // Generate patient ID
        const patientId = `CRV-2024-${String(i + 1).padStart(3, '0')}`;
        
        const patient = new User({
          ...patientData,
          patientId,
          role: 'patient',
          password: 'patient123', // Will be hashed by the model
          status: 'active',
          // Generate mock ThingSpeak channel info
          thingspeakChannel: {
            channelId: `200819${i + 1}`,
            readApiKey: `MOCK_READ_API_KEY_${i + 1}`,
            writeApiKey: `MOCK_WRITE_API_KEY_${i + 1}`
          },
          // Mock band information
          bandId: `CRV_BAND_${String(i + 1).padStart(3, '0')}`,
          isBandActive: true,
          createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random date in last 30 days
        });

        await patient.save();
        this.createdUsers.patients.push(patient);
        console.log(`  ✅ Created patient: ${patient.name} (${patient.patientId})`);
      } catch (error) {
        console.error(`  ❌ Error creating patient ${patientData.name}:`, error.message);
      }
    }
  }

  async createDoctors() {
    console.log('👨‍⚕️ Creating doctors with Indian names...');
    
    for (const doctorData of DOCTORS_DATA) {
      try {
        const doctor = new User({
          ...doctorData,
          role: 'doctor',
          password: 'doctor123', // Will be hashed by the model
          status: 'active',
          createdAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000) // Random date in last 60 days
        });

        await doctor.save();
        this.createdUsers.doctors.push(doctor);
        console.log(`  ✅ Created doctor: ${doctor.name} (${doctor.specialization})`);
      } catch (error) {
        console.error(`  ❌ Error creating doctor ${doctorData.name}:`, error.message);
      }
    }
  }

  async assignPatientsToDoctor() {
    console.log('🔗 Assigning patients to doctors...');
    
    for (const assignment of DOCTOR_PATIENT_ASSIGNMENTS) {
      try {
        // Find doctor
        const doctor = await User.findOne({ email: assignment.doctorEmail, role: 'doctor' });
        if (!doctor) {
          console.error(`  ❌ Doctor not found: ${assignment.doctorEmail}`);
          continue;
        }

        // Find patients
        const patients = await User.find({ 
          email: { $in: assignment.patientEmails }, 
          role: 'patient' 
        });

        if (patients.length !== assignment.patientEmails.length) {
          console.error(`  ❌ Some patients not found for doctor ${doctor.name}`);
          continue;
        }

        // Assign patients to doctor
        const patientIds = patients.map(p => p._id);
        await User.updateMany(
          { _id: { $in: patientIds } },
          { $set: { assignedDoctor: doctor._id } }
        );

        console.log(`  ✅ Assigned ${patients.length} patients to Dr. ${doctor.name}:`);
        patients.forEach(patient => {
          console.log(`    - ${patient.name} (${patient.patientId})`);
        });

      } catch (error) {
        console.error(`  ❌ Error assigning patients to doctor:`, error.message);
      }
    }
  }

  async createSuperAdmin() {
    try {
      // Check if super admin already exists
      const existingSuperAdmin = await User.findOne({ 
        role: 'super_admin',
        email: 'admin@curavia.com'
      });

      if (!existingSuperAdmin) {
        const superAdmin = new User({
          name: 'Super Admin',
          email: 'admin@curavia.com',
          password: 'admin123',
          role: 'super_admin',
          status: 'active'
        });

        await superAdmin.save();
        console.log('👑 Created Super Admin user');
        console.log('   Email: admin@curavia.com');
        console.log('   Password: admin123');
      } else {
        console.log('👑 Super Admin already exists');
      }
    } catch (error) {
      console.error('❌ Error creating super admin:', error.message);
    }
  }

  async generateSummary() {
    console.log('\n📊 DEVELOPMENT DATA SUMMARY');
    console.log('================================');
    
    const patientCount = await User.countDocuments({ role: 'patient' });
    const doctorCount = await User.countDocuments({ role: 'doctor' });
    const assignedPatientsCount = await User.countDocuments({ 
      role: 'patient', 
      assignedDoctor: { $exists: true } 
    });

    console.log(`👥 Patients created: ${patientCount}`);
    console.log(`👨‍⚕️ Doctors created: ${doctorCount}`);
    console.log(`🔗 Patients assigned to doctors: ${assignedPatientsCount}`);
    
    console.log('\n🔑 LOGIN CREDENTIALS:');
    console.log('Super Admin: admin@curavia.com / admin123');
    console.log('Doctors: doctor@curavia.com / doctor123');
    console.log('Patients: patient@curavia.com / patient123');
    
    console.log('\n🔧 ENVIRONMENT SETUP:');
    console.log('THINGSPEAK_MODE=development');
    console.log('MOCK_DATA_ENABLED=true');
    console.log('MOCK_DATA_INTERVAL=30000');
    
    console.log('\n✅ Development environment is ready!');
    console.log('   Start the server and mock data will generate automatically');
  }

  async seedAll() {
    try {
      console.log('🌱 Starting development data seeding...\n');
      
      await this.connectToDatabase();
      await this.clearExistingData();
      await this.createSuperAdmin();
      await this.createDoctors();
      await this.createPatients();
      await this.assignPatientsToDoctor();
      await this.generateSummary();
      
    } catch (error) {
      console.error('❌ Seeding failed:', error);
    } finally {
      await mongoose.disconnect();
      console.log('\n🔌 Disconnected from MongoDB');
    }
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  const seeder = new DevelopmentDataSeeder();
  seeder.seedAll();
}

module.exports = DevelopmentDataSeeder;