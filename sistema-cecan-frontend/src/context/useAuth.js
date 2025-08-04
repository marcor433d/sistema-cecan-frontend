/**
 * Hook personalizado `useAuth`:
 * - Facilita el acceso al contexto de autenticación (`AuthContext`) desde cualquier componente.
 * - Lanza error si se usa fuera de `AuthContextProvider`.
 * Returns:
 * - `{ token, user, login, logout }`
 */
import { useContext } from 'react';
import { AuthContext } from './AuthContext';

//Hook personalizado para usar el contesto fácilmente
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}