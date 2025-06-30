
import { useContext } from 'react';
import { AuthContext } from './AuthContext';

//Hook personalizado para usar el contesto fácilmente
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}