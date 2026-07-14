'use client';

import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      className="btn-ghost"
      onClick={toggleTheme}
      title={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
      style={{ position: 'relative' }}
    >
      {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
