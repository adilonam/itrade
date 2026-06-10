'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode
} from 'react';

type UserManagementSidebarContextValue = {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  toggleMobileSidebar: () => void;
};

const UserManagementSidebarContext =
  createContext<UserManagementSidebarContextValue | null>(null);

export function UserManagementSidebarProvider({
  children
}: {
  children: ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const toggleMobileSidebar = useCallback(
    () => setMobileOpen((open) => !open),
    []
  );

  const value = useMemo(
    () => ({ mobileOpen, setMobileOpen, toggleMobileSidebar }),
    [mobileOpen, toggleMobileSidebar]
  );

  return (
    <UserManagementSidebarContext.Provider value={value}>
      {children}
    </UserManagementSidebarContext.Provider>
  );
}

export function useUserManagementSidebar() {
  const context = useContext(UserManagementSidebarContext);
  if (!context) {
    throw new Error(
      'useUserManagementSidebar must be used within UserManagementSidebarProvider'
    );
  }
  return context;
}
