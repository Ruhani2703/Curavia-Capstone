# Curavia Healthcare Monitoring System

A comprehensive healthcare monitoring platform for post-surgery patient care with real-time vital sign monitoring, ML-powered anomaly detection, and multi-role dashboard management.

## 🏥 System Overview

**Curavia** is a full-stack healthcare monitoring solution that provides:

- **Real-time Patient Monitoring**: Continuous vital signs tracking with smart band integration
- **ML-Powered Analytics**: Anomaly detection and risk prediction for patient safety
- **Multi-Role Access Control**: Separate dashboards for patients, doctors, and administrators
- **Emergency Response System**: Critical alert management and emergency notifications
- **Recovery Management**: Comprehensive recovery plans with milestone tracking
- **Report Generation**: Automated medical reports with export capabilities

## 🏗️ System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │    Database     │
│   (React)       │◄──►│   (Node.js)     │◄──►│   (MongoDB)     │
│   Port: 3039    │    │   Port: 4000    │    │   Port: 27017   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Tech Stack
- **Frontend**: React 18, TypeScript, Material-UI, Vite
- **Backend**: Node.js, Express, MongoDB, Mongoose
- **Authentication**: JWT with role-based access control
- **Real-time**: WebSocket connections for live data
- **ML/Analytics**: Custom anomaly detection algorithms
- **External**: ThingSpeak API for IoT device integration

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v5 or higher)
- Git

### 1. Clone the Repository
```bash
git clone <repository-url>
cd Thappar
```

### 2. Backend Setup
```bash
cd backend
npm install
npm run dev
```
Backend will run on: `http://localhost:4000`

### 3. Frontend Setup
```bash
cd admin
npm install
npm run dev
```
Frontend will run on `http://localhost:3039`

### 4. Database Setup
Ensure MongoDB is running locally on port 27017. The application will automatically:
- Create the database
- Seed initial data
- Set up required collections

## 👥 User Roles & Access

### 🩺 **Super Admin** (`superadmin@curavia.com` / `superadmin123`)
- **Dashboard**: `http://localhost:3039/admin`
- **Capabilities**:
  - Complete system administration
  - Patient and staff management
  - System configuration and analytics
  - ML anomaly detection monitoring
  - Report generation and analysis

### 👨‍⚕️ **Doctor** (`doctor@curavia.com` / `doctor123`)
- **Dashboard**: `http://localhost:3039/doctor`
- **Capabilities**:
  - Patient care management
  - Alert monitoring and response
  - Recovery plan creation and tracking
  - Medical report generation
  - Emergency response coordination

### 🏥 **Patient** (`patient@curavia.com` / `patient123`)
- **Dashboard**: `http://localhost:3039/patient`
- **Capabilities**:
  - Personal health monitoring
  - Vital signs tracking
  - Recovery progress viewing
  - Medication management
  - Emergency alert system

## 📱 Key Features

### 🚨 **Real-Time Monitoring**
- Continuous vital sign tracking (Heart Rate, Blood Pressure, SpO2, Temperature)
- Smart band integration with automatic data collection
- Real-time dashboard updates every 30 seconds
- Critical threshold monitoring with instant alerts

### 🤖 **ML-Powered Analytics**
- Anomaly detection for predicting health risks
- Pattern recognition for early warning systems
- Risk scoring based on multiple health parameters
- Predictive analytics for recovery outcomes

### 📊 **Dashboard Features**

#### Admin Dashboard
- Patient management and onboarding
- Medical staff administration
- System-wide analytics and reporting
- Emergency response center
- Diet and exercise plan management
- ML model monitoring

#### Doctor Dashboard
- Patient alerts and notifications
- Medical report generation
- Emergency response system
- Recovery plan management
- Patient analytics and trends

#### Patient Dashboard
- Personal health metrics
- Medication tracking
- Recovery milestones
- Emergency SOS functionality
- Diet and exercise guidance

### 🚑 **Emergency System**
- Critical alert detection and escalation
- Emergency response team coordination
- Hospital contact integration
- Real-time emergency status tracking
- SOS functionality for immediate help

## 🛠️ Development

### Backend Development
```bash
cd backend
npm run dev        # Start development server
npm run seed       # Seed database with sample data
npm test           # Run tests
```

### Frontend Development
```bash
cd admin
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
```

### Environment Configuration

#### Backend (.env)
```env
PORT=4000
MONGODB_URI=mongodb://localhost:27017/curavia
JWT_SECRET=your-secret-key
NODE_ENV=development
```

#### Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:4000/api
VITE_APP_NAME=Curavia
```

## 📂 Project Structure

```
Thappar/
├── backend/                 # Node.js Backend
│   ├── models/             # MongoDB Models
│   ├── routes/             # API Routes
│   ├── middleware/         # Authentication & Middleware
│   ├── services/           # Business Logic
│   ├── utils/              # Utilities & Helpers
│   └── server.js           # Main Server File
├── admin/                  # React Frontend
│   ├── src/
│   │   ├── components/     # Reusable Components
│   │   ├── sections/       # Page Sections
│   │   ├── pages/          # Route Pages
│   │   ├── layouts/        # Layout Components
│   │   ├── contexts/       # React Contexts
│   │   └── utils/          # Frontend Utilities
│   └── public/             # Static Assets
└── README.md               # This file
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user

### Patient Management
- `GET /api/patient` - Get all patients
- `POST /api/patient` - Create patient
- `PUT /api/patient/:id` - Update patient
- `DELETE /api/patient/:id` - Delete patient

### Alerts & Notifications
- `GET /api/alert` - Get alerts
- `POST /api/alert` - Create alert
- `PUT /api/alert/:id` - Update alert status

### Reports & Analytics
- `GET /api/report` - Get reports
- `POST /api/report/generate` - Generate report
- `GET /api/analytics` - Get analytics data

## 🚨 Troubleshooting

### Common Issues

1. **Backend not starting**
   - Ensure MongoDB is running
   - Check port 4000 is not in use
   - Verify Node.js version (v16+)

2. **Frontend build errors**
   - Clear node_modules: `rm -rf node_modules && npm install`
   - Check Node.js and npm versions
   - Ensure all dependencies are installed

3. **Authentication issues**
   - Clear browser localStorage
   - Check JWT token validity
   - Verify user credentials

4. **Database connection**
   - Ensure MongoDB service is running
   - Check connection string in .env
   - Verify database permissions

### Getting Help

1. Check console logs for detailed error messages
2. Verify all services are running on correct ports
3. Clear browser cache and localStorage
4. Restart both backend and frontend services

## 📈 Performance & Monitoring

- **Real-time Updates**: 30-second polling intervals
- **Database Indexing**: Optimized queries for alerts and patient data
- **Caching**: Redis integration for session management
- **Monitoring**: Built-in health checks and performance metrics

## 🔒 Security Features

- JWT-based authentication
- Role-based access control (RBAC)
- Input validation and sanitization
- HTTPS enforcement in production
- Rate limiting on API endpoints
- Secure session management

## 🎯 Future Enhancements

- [ ] Mobile app development
- [ ] Advanced ML models for health prediction
- [ ] Integration with more IoT devices
- [ ] Telemedicine video consultation
- [ ] Advanced reporting and analytics
- [ ] Multi-language support

---

## 📄 License

This project is proprietary software developed for healthcare monitoring applications.

## 👨‍💻 Development Team

Built with ❤️ for better healthcare monitoring and patient care.
