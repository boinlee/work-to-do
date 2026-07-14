'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  Briefcase,
} from 'lucide-react';

const navItems = [
  { name: '대시보드', href: '/', icon: LayoutDashboard },
  { name: '프로젝트', href: '/projects', icon: FolderKanban },
  { name: '내 태스크', href: '/my-tasks', icon: CheckSquare },
  { name: '팀원 관리', href: '/team', icon: Users },
  { name: '설정', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  const isActive = (href) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <aside
      className="sidebar-transition"
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        height: '100vh',
        width: collapsed ? 72 : 260,
        backgroundColor: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border-primary)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 40,
        overflow: 'hidden',
      }}
    >
      {/* Logo */}
      <div
        style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px',
          gap: 12,
          borderBottom: '1px solid var(--border-primary)',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'var(--accent-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Briefcase size={18} color="white" />
        </div>
        {!collapsed && (
          <span
            className="gradient-text"
            style={{ fontSize: 18, fontWeight: 700, whiteSpace: 'nowrap' }}
          >
            Work To Do
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: collapsed ? '10px 0' : '10px 16px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                borderRadius: 8,
                gap: 12,
                textDecoration: 'none',
                color: active ? 'white' : 'var(--text-secondary)',
                background: active ? 'var(--accent-primary)' : 'transparent',
                transition: 'all 0.2s ease',
                fontSize: 14,
                fontWeight: active ? 600 : 400,
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.background = 'var(--bg-hover)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
            >
              <Icon size={20} style={{ flexShrink: 0 }} />
              {!collapsed && <span style={{ whiteSpace: 'nowrap' }}>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div
        style={{
          padding: 12,
          borderTop: '1px solid var(--border-primary)',
          flexShrink: 0,
        }}
      >
        <button
          className="btn-ghost"
          onClick={() => setCollapsed(!collapsed)}
          style={{
            width: '100%',
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: '10px 16px',
            gap: 12,
          }}
          title={collapsed ? '사이드바 펼치기' : '사이드바 접기'}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          {!collapsed && (
            <span style={{ fontSize: 13, whiteSpace: 'nowrap' }}>사이드바 접기</span>
          )}
        </button>
      </div>
    </aside>
  );
}
