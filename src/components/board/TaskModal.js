'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { formatRelativeDate, formatDate, getStatusLabel } from '@/lib/utils';
import Modal from '@/components/common/Modal';
import Badge from '@/components/common/Badge';
import Avatar from '@/components/common/Avatar';
import {
  Calendar,
  User,
  Tag,
  Flag,
  MessageSquare,
  Send,
  Trash2,
  Clock,
} from 'lucide-react';

export default function TaskModal({ task, project, members, labels, onClose, onUpdate, onDelete }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description || '');
  const [loadingComments, setLoadingComments] = useState(true);

  useEffect(() => {
    loadComments();
  }, [task.id]);

  const loadComments = async () => {
    try {
      const { data } = await supabase
        .from('comments')
        .select('*, users(name, avatar_color)')
        .eq('task_id', task.id)
        .order('created_at', { ascending: true });
      setComments(data || []);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          content: newComment.trim(),
          task_id: task.id,
          user_id: user.id,
        })
        .select('*, users(name, avatar_color)')
        .single();

      if (error) throw error;
      setComments([...comments, data]);
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleSaveEdit = () => {
    onUpdate(task.id, {
      title: editTitle.trim(),
      description: editDescription.trim(),
    });
    setEditing(false);
  };

  const handleToggleLabel = async (labelId) => {
    const taskLabelIds = task.task_labels?.map((tl) => tl.label_id) || [];
    const hasLabel = taskLabelIds.includes(labelId);

    try {
      if (hasLabel) {
        await supabase
          .from('task_labels')
          .delete()
          .eq('task_id', task.id)
          .eq('label_id', labelId);
      } else {
        await supabase
          .from('task_labels')
          .insert({ task_id: task.id, label_id: labelId });
      }
      // Reload will happen via realtime
    } catch (error) {
      console.error('Error toggling label:', error);
    }
  };

  const taskLabelIds = task.task_labels?.map((tl) => tl.label_id) || [];

  return (
    <Modal isOpen={true} onClose={onClose} title="" maxWidth="640px">
      <div style={{ margin: '-24px', marginTop: '-24px' }}>
        {/* Title area */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-primary)' }}>
          {editing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                className="input"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                style={{ fontSize: 18, fontWeight: 600, padding: '8px 12px' }}
                autoFocus
              />
              <textarea
                className="input"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="설명 추가..."
                rows={3}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-primary" onClick={handleSaveEdit} style={{ fontSize: 13 }}>
                  저장
                </button>
                <button className="btn-secondary" onClick={() => setEditing(false)} style={{ fontSize: 13 }}>
                  취소
                </button>
              </div>
            </div>
          ) : (
            <div>
              <h2
                style={{ fontSize: 20, fontWeight: 600, marginBottom: 4, cursor: 'pointer' }}
                onClick={() => setEditing(true)}
                title="클릭하여 수정"
              >
                {task.title}
              </h2>
              {task.description && (
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginTop: 8, cursor: 'pointer' }}
                   onClick={() => setEditing(true)}>
                  {task.description}
                </p>
              )}
              {!task.description && (
                <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 4, cursor: 'pointer' }}
                   onClick={() => setEditing(true)}>
                  설명을 추가하려면 클릭하세요
                </p>
              )}
            </div>
          )}
        </div>

        {/* Properties */}
        <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 14, borderBottom: '1px solid var(--border-primary)' }}>
          {/* Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: 100, color: 'var(--text-secondary)', fontSize: 13 }}>
              <Clock size={14} /> 상태
            </div>
            <select
              className="input"
              value={task.status}
              onChange={(e) => onUpdate(task.id, { status: e.target.value })}
              style={{ flex: 1, padding: '6px 10px', fontSize: 13 }}
            >
              <option value="todo">할 일</option>
              <option value="in_progress">진행 중</option>
              <option value="done">완료</option>
            </select>
          </div>

          {/* Priority */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: 100, color: 'var(--text-secondary)', fontSize: 13 }}>
              <Flag size={14} /> 우선순위
            </div>
            <select
              className="input"
              value={task.priority}
              onChange={(e) => onUpdate(task.id, { priority: e.target.value })}
              style={{ flex: 1, padding: '6px 10px', fontSize: 13 }}
            >
              <option value="high">높음</option>
              <option value="medium">중간</option>
              <option value="low">낮음</option>
            </select>
          </div>

          {/* Assignee */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: 100, color: 'var(--text-secondary)', fontSize: 13 }}>
              <User size={14} /> 담당자
            </div>
            <select
              className="input"
              value={task.assignee_id || ''}
              onChange={(e) => onUpdate(task.id, { assignee_id: e.target.value || null })}
              style={{ flex: 1, padding: '6px 10px', fontSize: 13 }}
            >
              <option value="">미배정</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Due date */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: 100, color: 'var(--text-secondary)', fontSize: 13 }}>
              <Calendar size={14} /> 마감일
            </div>
            <input
              type="date"
              className="input"
              value={task.due_date || ''}
              onChange={(e) => onUpdate(task.id, { due_date: e.target.value || null })}
              style={{ flex: 1, padding: '6px 10px', fontSize: 13 }}
            />
          </div>

          {/* Labels */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: 100, color: 'var(--text-secondary)', fontSize: 13, paddingTop: 4 }}>
              <Tag size={14} /> 라벨
            </div>
            <div style={{ flex: 1, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {labels.map((label) => {
                const isActive = taskLabelIds.includes(label.id);
                return (
                  <button
                    key={label.id}
                    onClick={() => handleToggleLabel(label.id)}
                    style={{
                      padding: '3px 10px',
                      borderRadius: 9999,
                      fontSize: 12,
                      fontWeight: 500,
                      border: `1px solid ${label.color}40`,
                      backgroundColor: isActive ? label.color + '30' : 'transparent',
                      color: label.color,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      opacity: isActive ? 1 : 0.5,
                    }}
                  >
                    {label.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Comments section */}
        <div style={{ padding: '16px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
            <MessageSquare size={16} style={{ color: 'var(--text-secondary)' }} />
            <h3 style={{ fontSize: 14, fontWeight: 600 }}>
              댓글 ({comments.length})
            </h3>
          </div>

          {/* Comments list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
            {comments.map((comment) => (
              <div key={comment.id} style={{ display: 'flex', gap: 10 }}>
                <Avatar
                  name={comment.users?.name}
                  color={comment.users?.avatar_color}
                  size="sm"
                />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{comment.users?.name}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                      {formatRelativeDate(comment.created_at)}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {comment.content}
                  </p>
                </div>
              </div>
            ))}
            {comments.length === 0 && !loadingComments && (
              <p style={{ fontSize: 13, color: 'var(--text-tertiary)', textAlign: 'center', padding: 12 }}>
                아직 댓글이 없습니다
              </p>
            )}
          </div>

          {/* Add comment */}
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              className="input"
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="댓글을 입력하세요..."
              onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
              style={{ fontSize: 13, padding: '8px 12px' }}
            />
            <button
              className="btn-primary"
              onClick={handleAddComment}
              disabled={!newComment.trim()}
              style={{ padding: '8px 12px', flexShrink: 0 }}
            >
              <Send size={16} />
            </button>
          </div>
        </div>

        {/* Delete button */}
        <div style={{ padding: '12px 24px', borderTop: '1px solid var(--border-primary)', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            className="btn-danger"
            onClick={() => {
              if (confirm('이 태스크를 삭제하시겠습니까?')) {
                onDelete(task.id);
              }
            }}
            style={{ fontSize: 13 }}
          >
            <Trash2 size={14} />
            태스크 삭제
          </button>
        </div>
      </div>
    </Modal>
  );
}
