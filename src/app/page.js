'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { formatRelativeDate } from '@/lib/utils';
import Badge from '@/components/common/Badge';
import Avatar from '@/components/common/Avatar';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  FolderKanban,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export default function DashboardPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    try {
      // Get project IDs the user is a member of
      const { data: memberships } = await supabase
        .from('project_members')
        .select('project_id')
        .eq('user_id', user.id);
      const memberProjectIds = (memberships || []).map((m) => m.project_id);

      // Also get projects the user created (in case they weren't added as member)
      const { data: createdProjects } = await supabase
        .from('projects')
        .select('id')
        .eq('created_by', user.id);
      const createdProjectIds = (createdProjects || []).map((p) => p.id);

      // Combine unique project IDs
      const myProjectIds = [...new Set([...memberProjectIds, ...createdProjectIds])];

      let projectsData = [];
      let tasksData = [];

      if (myProjectIds.length > 0) {
        const [projectsRes, tasksRes] = await Promise.all([
          supabase.from('projects').select('*').in('id', myProjectIds).order('created_at', { ascending: false }),
          supabase.from('tasks').select('*, projects(name, color)').in('project_id', myProjectIds).order('created_at', { ascending: false }),
        ]);
        projectsData = projectsRes.data || [];
        tasksData = tasksRes.data || [];
      }

      setProjects(projectsData);
      setTasks(tasksData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => t.status === 'done').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress').length;
  const todoTasks = tasks.filter((t) => t.status === 'todo').length;
  const myTasks = tasks.filter((t) => t.assignee_id === user?.id).length;
  const overdueTasks = tasks.filter(
    (t) => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done'
  ).length;

  const pieData = [
    { name: '할 일', value: todoTasks, color: '#64748b' },
    { name: '진행 중', value: inProgressTasks, color: '#3b82f6' },
    { name: '완료', value: doneTasks, color: '#22c55e' },
  ].filter((d) => d.value > 0);

  const projectChartData = projects.slice(0, 6).map((p) => {
    const projectTasks = tasks.filter((t) => t.project_id === p.id);
    return {
      name: p.name.length > 8 ? p.name.slice(0, 8) + '...' : p.name,
      todo: projectTasks.filter((t) => t.status === 'todo').length,
      inProgress: projectTasks.filter((t) => t.status === 'in_progress').length,
      done: projectTasks.filter((t) => t.status === 'done').length,
    };
  });

  const recentTasks = tasks.slice(0, 5);

  const stats = [
    {
      label: '총 태스크',
      value: totalTasks,
      icon: FolderKanban,
      color: '#6366f1',
      bg: 'rgba(99,102,241,0.1)',
    },
    {
      label: '완료',
      value: doneTasks,
      icon: CheckCircle2,
      color: '#22c55e',
      bg: 'rgba(34,197,94,0.1)',
    },
    {
      label: '진행 중',
      value: inProgressTasks,
      icon: TrendingUp,
      color: '#3b82f6',
      bg: 'rgba(59,130,246,0.1)',
    },
    {
      label: '마감 임박',
      value: overdueTasks,
      icon: AlertTriangle,
      color: '#ef4444',
      bg: 'rgba(239,68,68,0.1)',
    },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div
          style={{
            width: 40, height: 40,
            border: '3px solid var(--border-primary)',
            borderTopColor: 'var(--accent-primary)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div>
      {/* Welcome */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>
          안녕하세요, {user?.name}님! 👋
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>
          오늘의 프로젝트 현황을 확인하세요
        </p>
      </div>

      {/* Stats Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
          marginBottom: 32,
        }}
      >
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="card stat-card"
              style={{ padding: 20 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>
                    {stat.label}
                  </p>
                  <p style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {stat.value}
                  </p>
                </div>
                <div
                  style={{
                    width: 48, height: 48,
                    borderRadius: 12,
                    backgroundColor: stat.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <Icon size={24} color={stat.color} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: totalTasks > 0 ? '2fr 1fr' : '1fr',
          gap: 16,
          marginBottom: 32,
        }}
      >
        {/* Bar chart */}
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>
            프로젝트별 태스크 현황
          </h3>
          {projectChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={projectChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} />
                <YAxis tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: 8,
                    fontSize: 13,
                  }}
                />
                <Bar dataKey="todo" fill="#64748b" name="할 일" radius={[2, 2, 0, 0]} />
                <Bar dataKey="inProgress" fill="#3b82f6" name="진행 중" radius={[2, 2, 0, 0]} />
                <Bar dataKey="done" fill="#22c55e" name="완료" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}>
              프로젝트를 생성하면 차트가 표시됩니다
            </div>
          )}
        </div>

        {/* Pie chart */}
        {totalTasks > 0 && (
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>
              태스크 상태 분포
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: 8,
                    fontSize: 13,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 8 }}>
              {pieData.map((d) => (
                <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: d.color }} />
                  <span style={{ color: 'var(--text-secondary)' }}>{d.name} ({d.value})</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recent tasks and projects */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Recent tasks */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600 }}>최근 태스크</h3>
            <Link href="/my-tasks" style={{ fontSize: 13, color: 'var(--accent-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              전체보기 <ArrowRight size={14} />
            </Link>
          </div>
          {recentTasks.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recentTasks.map((task) => (
                <div
                  key={task.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: 8,
                    backgroundColor: 'var(--bg-tertiary)',
                    gap: 12,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {task.title}
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>
                      {task.projects?.name || '프로젝트 미지정'}
                    </p>
                  </div>
                  <Badge variant="status" value={task.status} />
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-tertiary)', fontSize: 14, textAlign: 'center', padding: 20 }}>
              아직 태스크가 없습니다
            </p>
          )}
        </div>

        {/* Projects overview */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600 }}>프로젝트</h3>
            <Link href="/projects" style={{ fontSize: 13, color: 'var(--accent-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              전체보기 <ArrowRight size={14} />
            </Link>
          </div>
          {projects.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {projects.slice(0, 5).map((project) => {
                const projectTasks = tasks.filter((t) => t.project_id === project.id);
                const done = projectTasks.filter((t) => t.status === 'done').length;
                const total = projectTasks.length;
                const percent = total > 0 ? Math.round((done / total) * 100) : 0;

                return (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    style={{ textDecoration: 'none' }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '10px 12px',
                        borderRadius: 8,
                        backgroundColor: 'var(--bg-tertiary)',
                        transition: 'background-color 0.2s ease',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)')}
                    >
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: project.color || '#6366f1',
                          flexShrink: 0,
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {project.name}
                        </p>
                      </div>
                      <span style={{ fontSize: 12, color: percent > 0 ? 'var(--success)' : 'var(--text-tertiary)', fontWeight: 600 }}>
                        {percent}%
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p style={{ color: 'var(--text-tertiary)', fontSize: 14, textAlign: 'center', padding: 20 }}>
              아직 프로젝트가 없습니다
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
