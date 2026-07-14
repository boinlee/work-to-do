import { format, formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

export function formatDate(date) {
  if (!date) return '';
  return format(new Date(date), 'yyyy. M. d');
}

export function formatRelativeDate(date) {
  if (!date) return '';
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ko });
}

export function getInitials(name) {
  if (!name) return '?';
  return name.slice(0, 2).toUpperCase();
}

export function getPriorityColor(priority) {
  const colors = {
    high: { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' },
    medium: { bg: '#fefce8', text: '#ca8a04', border: '#fef08a' },
    low: { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0' },
  };
  return colors[priority] || colors.medium;
}

export function getStatusLabel(status) {
  const labels = {
    todo: '할 일',
    in_progress: '진행 중',
    done: '완료',
  };
  return labels[status] || status;
}

export function getStatusColor(status) {
  const colors = {
    todo: { bg: '#f1f5f9', text: '#64748b' },
    in_progress: { bg: '#dbeafe', text: '#2563eb' },
    done: { bg: '#dcfce7', text: '#16a34a' },
  };
  return colors[status] || colors.todo;
}

export function getAvatarColors() {
  return [
    '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
    '#f97316', '#eab308', '#22c55e', '#06b6d4',
  ];
}

export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}
