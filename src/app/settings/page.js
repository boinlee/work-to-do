'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import Avatar from '@/components/common/Avatar';
import { Sun, Moon, Monitor, User, Palette, Save } from 'lucide-react';

const AVATAR_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
  '#f97316', '#eab308', '#22c55e', '#06b6d4',
  '#3b82f6', '#14b8a6', '#a855f7', '#e11d48',
];

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [avatarColor, setAvatarColor] = useState(user?.avatar_color || '#6366f1');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await updateUser({
      name: name.trim(),
      avatar_color: avatarColor,
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ maxWidth: 640 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>설정</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 32 }}>
        프로필과 환경설정을 관리하세요
      </p>

      {/* Profile section */}
      <div className="card" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
          <User size={18} style={{ color: 'var(--accent-primary)' }} />
          <h2 style={{ fontSize: 17, fontWeight: 600 }}>프로필</h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
          <Avatar name={name} color={avatarColor} size="lg" />
          <div>
            <p style={{ fontSize: 16, fontWeight: 600 }}>{name || '이름 없음'}</p>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{email}</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
              이름
            </label>
            <input
              className="input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
              이메일 (변경 불가)
            </label>
            <input
              className="input"
              type="email"
              value={email}
              disabled
              style={{ opacity: 0.6, cursor: 'not-allowed' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
              아바타 색상
            </label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {AVATAR_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setAvatarColor(color)}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    backgroundColor: color,
                    border: avatarColor === color ? '3px solid var(--text-primary)' : '3px solid transparent',
                    cursor: 'pointer',
                    transition: 'transform 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.15)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                />
              ))}
            </div>
          </div>

          <button
            className="btn-primary"
            onClick={handleSave}
            disabled={saving}
            style={{ alignSelf: 'flex-start', marginTop: 8 }}
          >
            <Save size={16} />
            {saving ? '저장 중...' : saved ? '저장됨 ✓' : '변경사항 저장'}
          </button>
        </div>
      </div>

      {/* Theme section */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
          <Palette size={18} style={{ color: 'var(--accent-primary)' }} />
          <h2 style={{ fontSize: 17, fontWeight: 600 }}>테마</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <button
            onClick={() => theme !== 'light' && toggleTheme()}
            style={{
              padding: 20,
              borderRadius: 12,
              border: `2px solid ${theme === 'light' ? 'var(--accent-primary)' : 'var(--border-primary)'}`,
              backgroundColor: theme === 'light' ? 'rgba(99,102,241,0.05)' : 'var(--bg-tertiary)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 10,
              fontFamily: "'Inter', sans-serif",
            }}
          >
            <div
              style={{
                width: 48, height: 48,
                borderRadius: 12,
                backgroundColor: '#f8fafc',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid #e2e8f0',
              }}
            >
              <Sun size={24} color="#f59e0b" />
            </div>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
              라이트 모드
            </span>
          </button>

          <button
            onClick={() => theme !== 'dark' && toggleTheme()}
            style={{
              padding: 20,
              borderRadius: 12,
              border: `2px solid ${theme === 'dark' ? 'var(--accent-primary)' : 'var(--border-primary)'}`,
              backgroundColor: theme === 'dark' ? 'rgba(99,102,241,0.05)' : 'var(--bg-tertiary)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 10,
              fontFamily: "'Inter', sans-serif",
            }}
          >
            <div
              style={{
                width: 48, height: 48,
                borderRadius: 12,
                backgroundColor: '#1e293b',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid #334155',
              }}
            >
              <Moon size={24} color="#818cf8" />
            </div>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
              다크 모드
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
