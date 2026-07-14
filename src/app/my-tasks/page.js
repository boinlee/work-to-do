'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { formatDate, getStatusLabel, getStatusColor } from '@/lib/utils';
import Badge from '@/components/common/Badge';
import { CheckSquare, Circle, CircleDot, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function MyTasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadTasks();
  }, [user]);

  const loadTasks = async () => {
    if (!user) return;
    try {
      // Get tasks assigned to me
      const { data: assignedTasks } = await supabase
        .from('tasks')
        .select('*, projects(id, name, color)')
        .eq('assignee_id', user.id)
        .order('created_at', { ascending: false });

      // Get tasks created by me (that aren't already in assigned)
      const { data: createdTasks } = await supabase
        .from('tasks')
        .select('*, projects(id, name, color)')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      // Merge and deduplicate
      const allTasks = [...(assignedTasks || [])];
      const existingIds = new Set(allTasks.map((t) => t.id));
      (createdTasks || []).forEach((t) => {
        if (!existingIds.has(t.id)) {
          allTasks.push(t);
        }
      });

      setTasks(allTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (e, taskId, currentStatus) => {
    e.preventDefault();
    e.stopPropagation();

    // Cycle: todo → in_progress → done → todo
    const nextStatus =
      currentStatus === 'todo'
        ? 'in_progress'
        : currentStatus === 'in_progress'
        ? 'done'
        : 'todo';

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: nextStatus } : t))
    );

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: nextStatus })
        .eq('id', taskId);
      if (error) throw error;
    } catch (error) {
      console.error('Error updating status:', error);
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: currentStatus } : t))
      );
    }
  };

  const filteredTasks = filter === 'all' ? tasks : tasks.filter((t) => t.status === filter);

  const groupedByProject = filteredTasks.reduce((acc, task) => {
    const projectName = task.projects?.name || '프로젝트 미지정';
    if (!acc[projectName]) {
      acc[projectName] = { color: task.projects?.color || '#64748b', projectId: task.projects?.id, tasks: [] };
    }
    acc[projectName].tasks.push(task);
    return acc;
  }, {});

  const statusCounts = {
    all: tasks.length,
    todo: tasks.filter((t) => t.status === 'todo').length,
    in_progress: tasks.filter((t) => t.status === 'in_progress').length,
    done: tasks.filter((t) => t.status === 'done').length,
  };

  const filters = [
    { id: 'all', label: '전체', count: statusCounts.all },
    { id: 'todo', label: '할 일', count: statusCounts.todo },
    { id: 'in_progress', label: '진행 중', count: statusCounts.in_progress },
    { id: 'done', label: '완료', count: statusCounts.done },
  ];

  const getStatusIcon = (status) => {
    switch (status) {
      case 'todo':
        return <Circle size={20} style={{ color: 'var(--text-tertiary)' }} />;
      case 'in_progress':
        return <CircleDot size={20} style={{ color: 'var(--info)' }} />;
      case 'done':
        return <CheckCircle2 size={20} style={{ color: 'var(--success)' }} />;
      default:
        return <Circle size={20} style={{ color: 'var(--text-tertiary)' }} />;
    }
  };

  const getStatusTooltip = (status) => {
    switch (status) {
      case 'todo':
        return '클릭하여 "진행 중"으로 변경';
      case 'in_progress':
        return '클릭하여 "완료"로 변경';
      case 'done':
        return '클릭하여 "할 일"로 변경';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ width: 40, height: 40, border: '3px solid var(--border-primary)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>내 태스크</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          나에게 배정된 태스크 {tasks.length}개
        </p>
      </div>

      {/* Filter tabs */}
      <div
        style={{
          display: 'flex',
          gap: 4,
          marginBottom: 24,
          backgroundColor: 'var(--bg-tertiary)',
          padding: 4,
          borderRadius: 10,
          width: 'fit-content',
        }}
      >
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              backgroundColor: filter === f.id ? 'var(--bg-card)' : 'transparent',
              color: filter === f.id ? 'var(--text-primary)' : 'var(--text-secondary)',
              boxShadow: filter === f.id ? 'var(--shadow-sm)' : 'none',
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {f.label}
            <span
              style={{
                marginLeft: 6,
                fontSize: 11,
                color: 'var(--text-tertiary)',
                fontWeight: 600,
              }}
            >
              {f.count}
            </span>
          </button>
        ))}
      </div>

      {/* Status change hint */}
      <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 16 }}>
        💡 왼쪽 아이콘을 클릭하면 상태를 변경할 수 있습니다 (할 일 → 진행 중 → 완료)
      </p>

      {/* Tasks grouped by project */}
      {Object.keys(groupedByProject).length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {Object.entries(groupedByProject).map(([projectName, group]) => (
            <div key={projectName}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: group.color,
                  }}
                />
                {group.projectId ? (
                  <Link
                    href={`/projects/${group.projectId}`}
                    style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', textDecoration: 'none' }}
                  >
                    {projectName}
                  </Link>
                ) : (
                  <span style={{ fontSize: 15, fontWeight: 600 }}>{projectName}</span>
                )}
                <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                  ({group.tasks.length})
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {group.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="card"
                    style={{
                      padding: '14px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    {/* Status toggle button */}
                    <button
                      onClick={(e) => handleStatusChange(e, task.id, task.status)}
                      title={getStatusTooltip(task.status)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                        transition: 'all 0.2s ease',
                        flexShrink: 0,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                        e.currentTarget.style.transform = 'scale(1.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      {getStatusIcon(task.status)}
                    </button>

                    {/* Task title - clickable to go to project board */}
                    <Link
                      href={`/projects/${task.project_id}`}
                      style={{
                        flex: 1,
                        minWidth: 0,
                        textDecoration: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <p
                        style={{
                          fontSize: 14,
                          fontWeight: 500,
                          color: task.status === 'done' ? 'var(--text-tertiary)' : 'var(--text-primary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          textDecoration: task.status === 'done' ? 'line-through' : 'none',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {task.title}
                      </p>
                    </Link>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      <Badge variant="priority" value={task.priority} />
                      <Badge variant="status" value={task.status} />
                      {task.due_date && (
                        <span
                          style={{
                            fontSize: 12,
                            color:
                              new Date(task.due_date) < new Date() && task.status !== 'done'
                                ? 'var(--danger)'
                                : 'var(--text-tertiary)',
                          }}
                        >
                          {formatDate(task.due_date)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          className="card"
          style={{ padding: 60, textAlign: 'center' }}
        >
          <div
            style={{
              width: 64, height: 64, borderRadius: 16,
              backgroundColor: 'var(--bg-tertiary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <CheckSquare size={28} style={{ color: 'var(--text-tertiary)' }} />
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
            {filter === 'all' ? '배정된 태스크가 없습니다' : `${filters.find((f) => f.id === filter)?.label} 상태의 태스크가 없습니다`}
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            프로젝트에서 태스크를 배정받으면 여기에 표시됩니다
          </p>
        </div>
      )}
    </div>
  );
}
