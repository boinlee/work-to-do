'use client';

import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import LayoutContent from './layout-content';

export function Providers({ children }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <LayoutContent>{children}</LayoutContent>
      </AuthProvider>
    </ThemeProvider>
  );
}
