// Development authentication helper
// This file is for development purposes only
import apiHelper from './apiHelper';

export const getCurrentUserRole = (): 'doctor' | 'super_admin' | null => {
  const user = localStorage.getItem('user');
  
  if (user) {
    try {
      const userData = JSON.parse(user);
      if (userData.role === 'doctor' || userData.role === 'super_admin') {
        return userData.role;
      }
    } catch (e) {
      console.error('❌ Dev Auth: Failed to parse user data');
    }
  }
  
  return null;
};

export const setupDevAuth = async (preferredRole?: 'doctor' | 'super_admin'): Promise<boolean> => {
  try {
    // If no preferred role specified, try to maintain current user's role
    const currentRole = getCurrentUserRole();
    const role = preferredRole || currentRole || 'doctor';
    
    let credentials;
    
    if (role === 'doctor') {
      // Try to login with doctor credentials first
      credentials = {
        email: 'doctor@curavia.com',
        password: 'doctor123'
      };
    } else {
      // Fallback to super admin credentials
      credentials = {
        email: 'superadmin@curavia.com',
        password: 'superadmin123'
      };
    }

    const response = await apiHelper.post('/auth/login', credentials);

    if (response.token && response.user) {
      // Store authentication data
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      console.log(`✅ Dev Auth: ${role} logged in successfully`);
      return true;
    }

    console.error('❌ Dev Auth: Login failed - no token received');
    return false;
  } catch (error) {
    console.error('❌ Dev Auth: Login failed:', error);
    
    // If doctor login fails, try super admin as fallback
    if ((preferredRole || 'doctor') === 'doctor') {
      console.log('⚠️ Dev Auth: Doctor login failed, trying super admin...');
      return setupDevAuth('super_admin');
    }
    
    return false;
  }
};

export const checkDevAuth = (): boolean => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  if (token && user) {
    try {
      const userData = JSON.parse(user);
      if (userData.role === 'doctor' || userData.role === 'super_admin') {
        console.log(`✅ Dev Auth: ${userData.role} session found`);
        return true;
      }
    } catch (e) {
      console.error('❌ Dev Auth: Failed to parse user data');
    }
  }
  
  console.log('⚠️ Dev Auth: No valid session found');
  return false;
};