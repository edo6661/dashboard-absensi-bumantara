import { useState, useEffect, type ReactNode, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import { authService } from '../services/auth.service';
import type { ActionResult } from '../types/common';
import { storage } from '../utils/storage';
import { handleApiError } from '../utils/errorHandler';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!storage.getToken());
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const logout = useCallback(() => {
    storage.clearAuth();
    setIsAuthenticated(false);
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => logout();
    window.addEventListener('auth-unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth-unauthorized', handleUnauthorized);
  }, [logout]);

  const login = async (email: string, pass: string): Promise<ActionResult> => {
    setIsLoading(true);
    try {
      const response = await authService.login(email, pass);
      if (response.success && response.data) {
        storage.setToken(response.data.token);
        storage.setUser(response.data.user);
        setIsAuthenticated(true);
        return { success: true };
      }
      return { success: false, message: response.message || 'Login gagal.' };
    } catch (error) {
      return handleApiError(error);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};