'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import ProjectCard from '@/components/project/ProjectCard';
import Modal from '@/components/common/Modal';
import { Plus, FolderKanban } from 'lucide-react';

const PROJECT_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
  '#f97316', '#eab308', '#22c55e', '#06b6d4',
  '#3b82f6', '#14b8a6',
];

export default function ProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '', color: '#6366f1' });
  const [creating, setCreating] = useState(false);

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

      // Also get projects the user created
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
          supabase.from('tasks').select('id, status, project_id').in('project_id', myProjectIds),
        ]);
        projectsData = projectsRes.data || [];
        tasksData = tasksRes.data || [];
      }

      setProjects(projectsData);
      setTasks(tasksData);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTaskStats = (projectId) => {
    const projectTasks = tasks.filter((t) => t.project_id === projectId);
    return {
      todo: projectTasks.filter((t) => t.status === 'todo').length,
      in_progress: projectTasks.filter((t) => t.status === 'in_progress').length,
      done: projectTasks.filter((t) => t.status === 'done').length,
    };
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newProject.name.trim()) return;

    setCreating(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          name: newProject.name.trim(),
          description: newProject.description.trim(),
          color: newProject.color,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Add creator as owner
      await supabase.from('project_members').insert({
        project_id: data.id,
        user_id: user.id,
        role: 'owner',
      });

      // Add default labels
      const defaultLabels = [
        { name: '버그', color: '#ef4444', project_id: data.id },
        { name: '기능', color: '#3b82f6', project_id: data.id },
        { name: '개선', color: '#22c55e', project_id: data.id },
        { name: '디자인', color: '#8b5cf6', project_id: data.id },
      ];
      await supabase.from('labels').insert(defaultLabels);

      setProjects([data, ...projects]);
      setShowCreate(false);
      setNewProject({ name: '', description: '', color: '#6366f1' });
    } catch (error) {
      console.error('Error creating project:', error);
    } finally {
      setCreating(false);
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
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>프로젝트</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            총 {projects.length}개의 프로젝트
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(true)}>
          <Plus size={18} />
          새 프로젝트
        </button>
      </div>

      {/* Projects grid */}
      {projects.length > 0 ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 16,
          }}
        >
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              taskStats={getTaskStats(project.id)}
            />
          ))}
        </div>
      ) : (
        <div
          className="card"
          style={{
            padding: 60,
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 64, height: 64,
              borderRadius: 16,
              backgroundColor: 'var(--bg-tertiary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <FolderKanban size={28} style={{ color: 'var(--text-tertiary)' }} />
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>
            아직 프로젝트가 없습니다
          </h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 20, fontSize: 14 }}>
            새 프로젝트를 생성하여 팀과 함께 작업을 시작하세요
          </p>
          <button className="btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={18} />
            첫 프로젝트 만들기
          </button>
        </div>
      )}

      {/* Create modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="새 프로젝트 만들기">
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
              프로젝트 이름 *
            </label>
            <input
              className="input"
              type="text"
              value={newProject.name}
              onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
              placeholder="프로젝트 이름을 입력하세요"
              required
              autoFocus
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
              설명
            </label>
            <textarea
              className="input"
              value={newProject.description}
              onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
              placeholder="프로젝트에 대한 간단한 설명"
              rows={3}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
              테마 색상
            </label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {PROJECT_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setNewProject({ ...newProject, color })}
                  style={{
                    width: 32, height: 32,
                    borderRadius: 8,
                    backgroundColor: color,
                    border: newProject.color === color ? '3px solid var(--text-primary)' : '3px solid transparent',
                    cursor: 'pointer',
                    transition: 'transform 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.15)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                />
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" className="btn-secondary" onClick={() => setShowCreate(false)}>
              취소
            </button>
            <button type="submit" className="btn-primary" disabled={creating || !newProject.name.trim()}>
              {creating ? '생성 중...' : '프로젝트 생성'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
