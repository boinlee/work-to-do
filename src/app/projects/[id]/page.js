'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import TaskCard from '@/components/board/TaskCard';
import TaskModal from '@/components/board/TaskModal';
import Modal from '@/components/common/Modal';
import Avatar from '@/components/common/Avatar';
import { Plus, MoreHorizontal, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const COLUMNS = [
  { id: 'todo', title: '할 일', color: '#64748b' },
  { id: 'in_progress', title: '진행 중', color: '#3b82f6' },
  { id: 'done', title: '완료', color: '#22c55e' },
];

export default function KanbanBoardPage() {
  const params = useParams();
  const projectId = params.id;
  const { user } = useAuth();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [labels, setLabels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showAddTask, setShowAddTask] = useState(null); // column id
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const loadData = useCallback(async () => {
    if (!projectId) return;
    try {
      const [projectRes, tasksRes, membersRes, labelsRes] = await Promise.all([
        supabase.from('projects').select('*').eq('id', projectId).single(),
        supabase.from('tasks').select('*, task_labels(label_id)').eq('project_id', projectId).order('position'),
        supabase.from('project_members').select('*, users(*)').eq('project_id', projectId),
        supabase.from('labels').select('*').eq('project_id', projectId),
      ]);

      setProject(projectRes.data);
      setTasks(tasksRes.data || []);
      setMembers(membersRes.data?.map((m) => m.users).filter(Boolean) || []);
      setLabels(labelsRes.data || []);
    } catch (error) {
      console.error('Error loading board:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Realtime subscription
  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel(`board-${projectId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks', filter: `project_id=eq.${projectId}` },
        () => {
          loadData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'comments' },
        () => {
          if (selectedTask) {
            loadData();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, loadData, selectedTask]);

  const getColumnTasks = (status) => {
    return tasks
      .filter((t) => t.status === status)
      .sort((a, b) => a.position - b.position);
  };

  const handleDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const taskId = draggableId;
    const newStatus = destination.droppableId;
    const newPosition = destination.index;

    // Optimistic update
    const updatedTasks = tasks.map((t) => {
      if (t.id === taskId) {
        return { ...t, status: newStatus, position: newPosition };
      }
      return t;
    });
    setTasks(updatedTasks);

    // Update in database
    try {
      await supabase
        .from('tasks')
        .update({ status: newStatus, position: newPosition })
        .eq('id', taskId);

      // Reorder other tasks in destination column
      const destTasks = updatedTasks
        .filter((t) => t.status === newStatus && t.id !== taskId)
        .sort((a, b) => a.position - b.position);

      const updates = destTasks.map((t, index) => {
        const pos = index >= newPosition ? index + 1 : index;
        return supabase.from('tasks').update({ position: pos }).eq('id', t.id);
      });
      await Promise.all(updates);
    } catch (error) {
      console.error('Error updating task position:', error);
      loadData();
    }
  };

  const handleAddTask = async (status) => {
    if (!newTaskTitle.trim()) return;

    const columnTasks = getColumnTasks(status);
    const position = columnTasks.length;

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          title: newTaskTitle.trim(),
          status,
          position,
          project_id: projectId,
          created_by: user.id,
          priority: 'medium',
        })
        .select()
        .single();

      if (error) throw error;

      setTasks([...tasks, data]);
      setNewTaskTitle('');
      setShowAddTask(null);
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await supabase.from('tasks').delete().eq('id', taskId);
      setTasks(tasks.filter((t) => t.id !== taskId));
      setSelectedTask(null);
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleUpdateTask = async (taskId, updates) => {
    try {
      const { error } = await supabase.from('tasks').update(updates).eq('id', taskId);
      if (error) throw error;

      setTasks(tasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t)));
      if (selectedTask?.id === taskId) {
        setSelectedTask({ ...selectedTask, ...updates });
      }
    } catch (error) {
      console.error('Error updating task:', error);
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

  if (!project) {
    return (
      <div style={{ textAlign: 'center', padding: 60 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>프로젝트를 찾을 수 없습니다</h2>
        <Link href="/projects" style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>
          프로젝트 목록으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div style={{ height: 'calc(100vh - 112px)', display: 'flex', flexDirection: 'column' }}>
      {/* Board header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/projects" style={{ textDecoration: 'none' }}>
            <button className="btn-ghost">
              <ArrowLeft size={18} />
            </button>
          </Link>
          <div
            style={{
              width: 12, height: 12,
              borderRadius: 4,
              backgroundColor: project.color || '#6366f1',
            }}
          />
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>{project.name}</h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Member avatars */}
          <div style={{ display: 'flex', marginRight: 8 }}>
            {members.slice(0, 4).map((member, i) => (
              <div
                key={member.id}
                style={{ marginLeft: i > 0 ? -8 : 0, zIndex: 4 - i }}
                title={member.name}
              >
                <Avatar name={member.name} color={member.avatar_color} size="sm" />
              </div>
            ))}
            {members.length > 4 && (
              <div
                style={{
                  marginLeft: -8,
                  width: 28, height: 28,
                  borderRadius: '50%',
                  backgroundColor: 'var(--bg-tertiary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)',
                }}
              >
                +{members.length - 4}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Kanban columns */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 16,
            flex: 1,
            minHeight: 0,
          }}
        >
          {COLUMNS.map((column) => {
            const columnTasks = getColumnTasks(column.id);
            return (
              <div key={column.id} className="kanban-column" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {/* Column header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 12,
                    padding: '0 4px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div
                      style={{
                        width: 8, height: 8,
                        borderRadius: '50%',
                        backgroundColor: column.color,
                      }}
                    />
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {column.title}
                    </h3>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: 'var(--text-tertiary)',
                        backgroundColor: 'var(--bg-hover)',
                        padding: '1px 8px',
                        borderRadius: 10,
                      }}
                    >
                      {columnTasks.length}
                    </span>
                  </div>
                  <button
                    className="btn-ghost"
                    onClick={() => {
                      setShowAddTask(column.id);
                      setNewTaskTitle('');
                    }}
                    style={{ padding: 4 }}
                  >
                    <Plus size={16} />
                  </button>
                </div>

                {/* Add task input */}
                {showAddTask === column.id && (
                  <div style={{ marginBottom: 8 }}>
                    <input
                      className="input"
                      type="text"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      placeholder="태스크 제목 입력..."
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddTask(column.id);
                        if (e.key === 'Escape') setShowAddTask(null);
                      }}
                      style={{ fontSize: 13, padding: '8px 12px' }}
                    />
                    <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                      <button
                        className="btn-primary"
                        onClick={() => handleAddTask(column.id)}
                        style={{ fontSize: 12, padding: '4px 12px' }}
                      >
                        추가
                      </button>
                      <button
                        className="btn-ghost"
                        onClick={() => setShowAddTask(null)}
                        style={{ fontSize: 12, padding: '4px 8px' }}
                      >
                        취소
                      </button>
                    </div>
                  </div>
                )}

                {/* Task list */}
                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      style={{
                        flex: 1,
                        overflowY: 'auto',
                        minHeight: 100,
                        borderRadius: 8,
                        padding: 4,
                        backgroundColor: snapshot.isDraggingOver ? 'var(--bg-hover)' : 'transparent',
                        transition: 'background-color 0.2s ease',
                      }}
                    >
                      {columnTasks.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              style={{
                                marginBottom: 8,
                                ...provided.draggableProps.style,
                              }}
                              className={snapshot.isDragging ? 'task-card-dragging' : ''}
                            >
                              <TaskCard
                                task={task}
                                labels={labels}
                                members={members}
                                onClick={() => setSelectedTask(task)}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {/* Task detail modal */}
      {selectedTask && (
        <TaskModal
          task={selectedTask}
          project={project}
          members={members}
          labels={labels}
          onClose={() => setSelectedTask(null)}
          onUpdate={handleUpdateTask}
          onDelete={handleDeleteTask}
        />
      )}
    </div>
  );
}
