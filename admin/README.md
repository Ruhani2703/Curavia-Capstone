# Curavia Frontend Application

React-based frontend application for the Curavia Healthcare Monitoring System, built with TypeScript, Material-UI, and Vite.

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation & Setup

1. **Install Dependencies**
```bash
npm install
```

2. **Environment Configuration**
Create a `.env` file in the admin directory:
```env
VITE_API_BASE_URL=http://localhost:4000/api
VITE_APP_NAME=Curavia
VITE_APP_VERSION=1.0.0
```

3. **Start Development Server**
```bash
npm run dev
```

The application will start on `http://localhost:3039`

4. **Build for Production**
```bash
npm run build
npm run preview  # Preview production build
```

## 🏥 Application Overview

Curavia is a comprehensive healthcare monitoring system with three distinct user interfaces:

### 🩺 Super Admin Dashboard (`/admin`)
**Access**: `superadmin@curavia.com` / `superadmin123`
- Complete system administration and oversight
- Patient and medical staff management
- System configuration and security settings
- Advanced analytics and ML anomaly detection
- Global report generation and system monitoring

### 👨‍⚕️ Doctor Dashboard (`/doctor`)  
**Access**: `doctor@curavia.com` / `doctor123`
- Patient care and medical decision support
- Real-time alert monitoring and response
- Medical report generation and analysis  
- Recovery plan creation and management
- Emergency response coordination

### 🏥 Patient Dashboard (`/patient`)
**Access**: `patient@curavia.com` / `patient123`
- Personal health monitoring and tracking
- Vital signs visualization and trends
- Medication schedule and reminders
- Recovery milestone progress
- Emergency SOS functionality

## 📁 Project Structure

```
admin/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── iconify/        # Icon components
│   │   ├── label/          # Label components
│   │   ├── RouteGuard.tsx  # Route protection
│   │   └── AuthRedirect.tsx # Auth redirection
│   ├── contexts/            # React Context providers
│   │   └── AuthContext.tsx # Authentication state
│   ├── layouts/             # Layout components
│   │   ├── dashboard/      # Dashboard layout
│   │   ├── auth/           # Authentication layout
│   │   └── nav-config-*.tsx # Navigation configurations
│   ├── pages/               # Route page components
│   │   ├── admin/          # Admin pages
│   │   ├── doctor/         # Doctor pages
│   │   ├── patient/        # Patient pages
│   │   └── auth/           # Authentication pages
│   ├── sections/            # Page-specific sections
│   │   ├── admin/          # Admin dashboard sections
│   │   ├── doctor/         # Doctor dashboard sections
│   │   └── patient/        # Patient dashboard sections
│   ├── routes/              # Routing configuration
│   │   └── sections.tsx    # Route definitions
│   ├── theme/               # Material-UI theme
│   ├── utils/               # Utility functions
│   │   ├── apiHelper.ts    # API communication
│   │   └── devAuth.ts      # Development authentication
│   └── App.tsx              # Main application component
├── public/                  # Static assets
├── package.json             # Dependencies and scripts
└── vite.config.ts          # Vite configuration
```

## 🔐 Authentication System

### Role-Based Access Control
The application implements strict role-based routing with the following guards:

```typescript
// Route protection examples
<SuperAdminGuard>  // Only super_admin access
<DoctorGuard>      // doctor + super_admin access  
<PatientGuard>     // Only patient access
<PublicGuard>      // Unauthenticated users only
```

### Authentication Flow
1. Users login with email/password
2. JWT token stored in localStorage
3. Route guards check user role and permissions
4. Automatic redirection based on user role
5. Token validation on each API request

## 🎨 UI Components & Styling

### Material-UI Theme
Custom theme with healthcare-focused color palette:
```typescript
// Primary colors
primary: '#2065D1',    // Medical blue
secondary: '#7C4DFF',  // Healthcare purple
success: '#00C853',    // Health green
error: '#FF1744',      // Alert red
warning: '#FF9100',    // Warning orange
```

### Key Components
- **DashboardContent**: Main layout wrapper
- **Iconify**: SVG icon system with 100,000+ icons
- **Label**: Status and category labels
- **Charts**: Data visualization components
- **Tables**: Sortable and filterable data tables
- **Forms**: Validation-ready form components

## 🔧 Development Scripts

```bash
# Development
npm run dev         # Start development server (port 3039)
npm run build       # Build for production
npm run preview     # Preview production build

# Quality Assurance  
npm run lint        # Run ESLint
npm run lint:fix    # Fix ESLint errors
npm run type-check  # TypeScript type checking

# Utilities
npm run clean       # Clean build artifacts
npm run analyze     # Bundle size analysis
```

## 📊 Feature Breakdown

### Admin Dashboard Features
- **Patient Management**: Complete patient lifecycle management
- **Medical Staff Administration**: Doctor and staff management
- **System Analytics**: Real-time system performance monitoring
- **ML Anomaly Detection**: AI-powered health risk detection
- **Report Generation**: Automated medical and system reports
- **Emergency Response**: Critical alert management
- **Diet & Exercise Plans**: Patient wellness program management

### Doctor Dashboard Features  
- **Patient Alerts**: Real-time patient health alerts and notifications
- **Medical Reports**: Generate and manage patient medical reports
- **Emergency Response**: Rapid response to critical patient situations
- **Recovery Plans**: Comprehensive patient recovery tracking
- **Patient Analytics**: Data-driven patient care insights

### Patient Dashboard Features
- **Health Monitoring**: Personal vital signs tracking and trends
- **Recovery Progress**: Post-surgery recovery milestone tracking
- **Medications**: Medicine schedule and adherence tracking
- **Diet & Exercise**: Personalized wellness plans
- **Emergency SOS**: One-click emergency alert system

## 🌐 API Integration

### API Helper Utility
Centralized API communication with automatic token handling:

```typescript
// Example usage
import apiHelper from 'src/utils/apiHelper';

// GET request
const patients = await apiHelper.get('/patient');

// POST request
const newAlert = await apiHelper.post('/alert', alertData);

// PUT request with authentication
const updatedPatient = await apiHelper.put(`/patient/${id}`, updates);
```

### Error Handling
- Automatic JWT token refresh
- Network error recovery
- User-friendly error messages
- Fallback to offline mode when possible

## 🔄 Real-Time Features

### Live Data Updates
- Patient vital signs: 30-second polling
- Alert notifications: Real-time WebSocket connections
- Emergency alerts: Immediate push notifications
- Dashboard metrics: Auto-refresh every minute

### WebSocket Integration
```typescript
// Real-time alert system
const alertSocket = new WebSocket('ws://localhost:4000/alerts');
alertSocket.onmessage = (event) => {
  const alert = JSON.parse(event.data);
  // Update UI with new alert
};
```

## 📱 Responsive Design

### Breakpoints
- **xs**: 0px - 599px (Mobile)
- **sm**: 600px - 959px (Tablet)
- **md**: 960px - 1279px (Desktop)
- **lg**: 1280px - 1919px (Large Desktop)
- **xl**: 1920px+ (Extra Large)

### Mobile-First Approach
All components are designed mobile-first with progressive enhancement:
```tsx
// Responsive grid example
<Grid container spacing={3}>
  <Grid xs={12} sm={6} md={4}>
    <PatientCard />
  </Grid>
</Grid>
```

## ⚡ Performance Optimization

### Code Splitting
- Route-based code splitting with React.lazy()
- Component-level splitting for large features
- Dynamic imports for heavy libraries

### Bundle Optimization
```bash
# Analyze bundle size
npm run analyze

# Build with source maps
npm run build -- --sourcemap
```

### Caching Strategy
- Browser caching for static assets
- API response caching for patient data
- Local storage for user preferences
- Service worker for offline capability

## 🧪 Testing & Quality

### Testing Setup
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Code Quality Tools
- **ESLint**: Code linting and style enforcement
- **TypeScript**: Static type checking
- **Prettier**: Code formatting (integrated with ESLint)
- **Husky**: Pre-commit hooks for quality gates

## 🚀 Deployment

### Production Build
```bash
# Create production build
npm run build

# Test production build locally
npm run preview
```

### Environment Variables
```env
# Production environment
VITE_API_BASE_URL=https://api.curavia.com/api
VITE_APP_NAME=Curavia
VITE_APP_VERSION=1.0.0
VITE_ENVIRONMENT=production
```

### Docker Deployment
```dockerfile
FROM node:16-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 🐛 Troubleshooting

### Common Issues

1. **Port 3039 already in use**
```bash
# Kill process on port 3039
lsof -ti:3039 | xargs kill -9

# Or use different port
npm run dev -- --port 3040
```

2. **Build failures**
```bash
# Clear cache and reinstall
rm -rf node_modules dist
npm install
```

3. **Authentication issues**
```bash
# Clear browser localStorage
localStorage.clear();

# Check token in browser console
console.log(localStorage.getItem('token'));
```

4. **API connection errors**
- Verify backend is running on port 4000
- Check CORS configuration
- Validate API base URL in .env

### Debug Mode
```bash
# Enable debug logging
DEBUG=true npm run dev

# TypeScript debug
npm run type-check -- --verbose
```

## 🎯 Future Enhancements

### Planned Features
- [ ] Progressive Web App (PWA) support
- [ ] Offline mode with data synchronization  
- [ ] Push notifications for mobile devices
- [ ] Advanced charting and visualization
- [ ] Multi-language internationalization
- [ ] Dark mode theme support
- [ ] Accessibility (WCAG 2.1 AA compliance)

### Performance Goals
- [ ] First Contentful Paint < 1.5s
- [ ] Largest Contentful Paint < 2.5s  
- [ ] Time to Interactive < 3s
- [ ] Bundle size < 500KB gzipped

## 🔧 Development Guidelines

### Component Development
```tsx
// Component template
import { FC } from 'react';
import { Box, Typography } from '@mui/material';

interface MyComponentProps {
  title: string;
  onAction?: () => void;
}

export const MyComponent: FC<MyComponentProps> = ({ title, onAction }) => (
  <Box>
    <Typography variant="h6">{title}</Typography>
    {/* Component content */}
  </Box>
);
```

### State Management
- React Context for global state (auth, theme)
- Local component state with useState/useReducer
- Custom hooks for complex logic
- API state management with SWR or React Query

### Styling Guidelines
- Use Material-UI's sx prop for component styling
- Theme-based spacing and colors
- Consistent component patterns
- Mobile-first responsive design

---

## 🤝 Contributing

1. Follow TypeScript best practices
2. Use Material-UI components when possible
3. Maintain consistent code style with ESLint/Prettier
4. Add proper TypeScript types for all props
5. Test components thoroughly before submission

## 📞 Support

For development support:
- Check browser console for errors
- Review network tab for API issues  
- Use React Developer Tools for debugging
- Check TypeScript compiler output