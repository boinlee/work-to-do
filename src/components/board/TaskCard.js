'use client';

import Badge from '@/components/common/Badge';
import Avatar from '@/components/common/Avatar';
import { Calendar, MessageSquare } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function TaskCard({ task, labels = [], members = [], onClick }) {
  const assignee = members.find((m) => m.id === task.assignee_id);
  const taskLabelIds = task.task_labels?.map((tl) => tl.label_id) || [];
  const taskLabels = labels.filter((l) => taskLabelIds.includes(l.id));

  return (
    <div
      className="card"
      onClick={onClick}
      style={{
        padding: 14,
        cursor: 'pointer',
        borderRadius: 10,
      }}
    >
      {/* Labels */}
      {taskLabels.length > 0 && (
        <div style={{ display: 'flex', gap: 4, marginBottom: 8, flexWrap: 'wrap' }}>
          {taskLabels.map((label) => (
            <Badge key={label.id} variant="label" value={label.name} color={label.color} />
          ))}
        </div>
      )}

      {/* Title */}
      <h4
        style={{
          fontSize: 14,
          fontWeight: 500,
          color: 'var(--text-primary)',
          marginBottom: 8,
          lineHeight: 1.4,
        }}
      >
        {task.title}
      </h4>

      {/* Footer row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Priority */}
          <Badge variant="priority" value={task.priority} />

          {/* Due date */}
          {task.due_date && (
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 11,
                color:
                  new Date(task.due_date) < new Date() && task.status !== 'done'
                    ? 'var(--danger)'
                    : 'var(--text-tertiary)',
              }}
            >
              <Calendar size={12} />
              {formatDate(task.due_date)}
            </span>
          )}
        </div>

        {/* Assignee */}
        {assignee && (
          <Avatar name={assignee.name} color={assignee.avatar_color} size="sm" />
        )}
      </div>
    </div>
  );
}
