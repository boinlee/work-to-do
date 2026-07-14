'use client';

import { useAuth } from '@/contexts/AuthContext';
import ThemeToggle from '@/components/common/ThemeToggle';
import Avatar from '@/components/common/Avatar';
import { Search, Bell, LogOut } from 'lucide-react';

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <header
      style={{
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-primary)',
        padding: '0 24px',
        flexShrink: 0,
      }}
    >
      {/* Search */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          backgroundColor: 'var(--bg-tertiary)',
          borderRadius: 8,
          padding: '0 12px',
          width: 320,
          maxWidth: '40%',
        }}
      >
        <Search size={16} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
        <input
          type="text"
          placeholder="검색..."
          style={{
            border: 'none',
            background: 'transparent',
            height: 40,
            flex: 1,
            fontSize: 14,
            color: 'var(--text-primary)',
            outline: 'none',
            fontFamily: "'Inter', sans-serif",
          }}
        />
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button className="btn-ghost" title="알림" style={{ position: 'relative' }}>
          <Bell size={18} />
          <span
            style={{
              position: 'absolute',
              top: 4,
              right: 4,
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: 'var(--danger)',
              border: '2px solid var(--bg-secondary)',
            }}
          />
        </button>

        <ThemeToggle />

        <div
          style={{
            width: 1,
            height: 24,
            backgroundColor: 'var(--border-primary)',
            margin: '0 4px',
          }}
        />

        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Avatar name={user.name} color={user.avatar_color} size="sm" />
            <span
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: 'var(--text-primary)',
                whiteSpace: 'nowrap',
              }}
            >
              {user.name}
            </span>
          </div>
        )}

        <button className="btn-ghost" onClick={logout} title="로그아웃">
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
