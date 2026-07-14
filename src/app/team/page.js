'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Avatar from '@/components/common/Avatar';
import Modal from '@/components/common/Modal';
import { Users, Plus, Mail, Trash2, Crown, UserPlus } from 'lucide-react';

export default function TeamPage() {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [taskCounts, setTaskCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      const [usersRes, tasksRes] = await Promise.all([
        supabase.from('users').select('*').order('created_at'),
        supabase.from('tasks').select('id, assignee_id, status'),
      ]);

      setMembers(usersRes.data || []);

      // Count tasks per user
      const counts = {};
      (tasksRes.data || []).forEach((task) => {
        if (task.assignee_id) {
          if (!counts[task.assignee_id]) {
            counts[task.assignee_id] = { total: 0, done: 0, in_progress: 0 };
          }
          counts[task.assignee_id].total++;
          if (task.status === 'done') counts[task.assignee_id].done++;
          if (task.status === 'in_progress') counts[task.assignee_id].in_progress++;
        }
      });
      setTaskCounts(counts);
    } catch (error) {
      console.error('Error loading members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) return;

    setInviting(true);
    try {
      // Check if user already exists
      const { data: existing } = await supabase
        .from('users')
        .select('*')
        .eq('email', inviteEmail.trim().toLowerCase())
        .single();

      if (existing) {
        alert('이미 등록된 이메일입니다.');
        setInviting(false);
        return;
      }

      const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#06b6d4'];
      const avatarColor = colors[Math.floor(Math.random() * colors.length)];

      const { data, error } = await supabase
        .from('users')
        .insert({
          name: inviteName.trim(),
          email: inviteEmail.trim().toLowerCase(),
          avatar_color: avatarColor,
        })
        .select()
        .single();

      if (error) throw error;

      setMembers([...members, data]);
      setShowInvite(false);
      setInviteName('');
      setInviteEmail('');
    } catch (error) {
      console.error('Error inviting member:', error);
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (memberId) => {
    if (memberId === user?.id) {
      alert('자기 자신은 삭제할 수 없습니다.');
      return;
    }
    if (!confirm('이 팀원을 삭제하시겠습니까?')) return;

    try {
      await supabase.from('users').delete().eq('id', memberId);
      setMembers(members.filter((m) => m.id !== memberId));
    } catch (error) {
      console.error('Error removing member:', error);
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>팀원 관리</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            총 {members.length}명의 팀원
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowInvite(true)}>
          <UserPlus size={18} />
          팀원 추가
        </button>
      </div>

      {/* Members grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 16,
        }}
      >
        {members.map((member) => {
          const counts = taskCounts[member.id] || { total: 0, done: 0, in_progress: 0 };
          const isMe = member.id === user?.id;

          return (
            <div
              key={member.id}
              className="card"
              style={{ padding: 20 }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Avatar name={member.name} color={member.avatar_color} size="lg" />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <h3 style={{ fontSize: 16, fontWeight: 600 }}>{member.name}</h3>
                      {isMe && (
                        <span
                          className="badge"
                          style={{ backgroundColor: 'var(--accent-primary)', color: 'white', fontSize: 10 }}
                        >
                          나
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      <Mail size={12} />
                      {member.email}
                    </p>
                  </div>
                </div>
                {!isMe && (
                  <button
                    className="btn-ghost"
                    onClick={() => handleRemove(member.id)}
                    title="팀원 삭제"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              {/* Task stats */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: 8,
                  marginTop: 16,
                  padding: 12,
                  backgroundColor: 'var(--bg-tertiary)',
                  borderRadius: 8,
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {counts.total}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>전체</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--info)' }}>
                    {counts.in_progress}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>진행 중</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--success)' }}>
                    {counts.done}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>완료</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Invite modal */}
      <Modal isOpen={showInvite} onClose={() => setShowInvite(false)} title="팀원 추가">
        <form onSubmit={handleInvite} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
              이름 *
            </label>
            <input
              className="input"
              type="text"
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              placeholder="팀원 이름"
              required
              autoFocus
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
              이메일 *
            </label>
            <input
              className="input"
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="팀원 이메일"
              required
            />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" className="btn-secondary" onClick={() => setShowInvite(false)}>
              취소
            </button>
            <button type="submit" className="btn-primary" disabled={inviting}>
              {inviting ? '추가 중...' : '팀원 추가'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
