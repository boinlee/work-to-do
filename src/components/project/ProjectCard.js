'use client';

import Link from 'next/link';

export default function ProjectCard({ project, taskStats = { todo: 0, in_progress: 0, done: 0 } }) {
  const total = taskStats.todo + taskStats.in_progress + taskStats.done;
  const completionPercent = total > 0 ? Math.round((taskStats.done / total) * 100) : 0;

  return (
    <Link href={`/projects/${project.id}`} style={{ textDecoration: 'none' }}>
      <div
        className="card"
        style={{
          padding: 20,
          borderLeft: `4px solid ${project.color || '#6366f1'}`,
          cursor: 'pointer',
        }}
      >
        <h3
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: 'var(--text-primary)',
            marginBottom: 4,
          }}
        >
          {project.name}
        </h3>
        <p
          style={{
            fontSize: 13,
            color: 'var(--text-secondary)',
            marginBottom: 16,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            lineHeight: '1.5',
            minHeight: 39,
          }}
        >
          {project.description || '설명이 없습니다'}
        </p>

        {/* Progress bar */}
        <div
          style={{
            height: 6,
            borderRadius: 3,
            backgroundColor: 'var(--bg-tertiary)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${completionPercent}%`,
              height: '100%',
              background: 'var(--accent-gradient)',
              borderRadius: 3,
              transition: 'width 0.3s ease',
            }}
          />
        </div>

        {/* Stats row */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 8,
          }}
        >
          <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
            총 {total}개 태스크
          </span>
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: completionPercent > 0 ? 'var(--success)' : 'var(--text-tertiary)',
            }}
          >
            {completionPercent}% 완료
          </span>
        </div>
      </div>
    </Link>
  );
}
