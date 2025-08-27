import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import apiHelper from '../utils/apiHelper';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'patient' | 'doctor' | 'super_admin';
  patientId?: string;
  surgeryType?: string;
  surgeryDate?: string;
  bandId?: string;
  isBandActive?: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');

      if (token && savedUser) {
        try {
          // Parse saved user
          const parsedUser = JSON.parse(savedUser);
          
          // Verify token is still valid by fetching current user
          const response = await apiHelper.get('/auth/me');
          setUser(response.user);
          console.log('🔄 AuthContext: User restored from token verification');
        } catch (error) {
          // Token is invalid, clear auth state
          console.log('❌ AuthContext: Token verification failed, clearing auth');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        }
      } else if (savedUser) {
        // If we have user data but no token, use the saved user
        try {
          const parsedUser = JSON.parse(savedUser);
          setUser(parsedUser);
          console.log('📱 AuthContext: User restored from localStorage');
        } catch (error) {
          console.log('❌ AuthContext: Failed to parse saved user data');
          localStorage.removeItem('user');
        }
      }
      
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await apiHelper.post('/auth/login', { email, password });

      // Store token and user data
      if (response.token && response.user) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        setUser(response.user);
        console.log('✅ AuthContext: Login successful, user stored');
      }

      return response;
    } catch (error) {
      console.log('❌ AuthContext: Login failed', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    console.log('👋 AuthContext: User logged out');
    // Redirect to login will be handled by route protection
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      console.log('🔄 AuthContext: User data updated');
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    logout,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};