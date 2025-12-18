'use client';

import { createContext, useContext } from 'react';
import { useOrganization, useUser } from '@clerk/nextjs';

interface AuthContextType {
  userId: string | null;
  organizationId: string | null;
  isLoaded: boolean;
}

const AuthContext = createContext<AuthContextType>({
  userId: null,
  organizationId: null,
  isLoaded: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoaded: isUserLoaded } = useUser();
  const { organization, isLoaded: isOrgLoaded } = useOrganization();

  const userId = user?.id || null;
  const organizationId = organization?.id || null;
  const isLoaded = isUserLoaded && isOrgLoaded;

  return (
    <AuthContext.Provider value={{ userId, organizationId, isLoaded }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
};