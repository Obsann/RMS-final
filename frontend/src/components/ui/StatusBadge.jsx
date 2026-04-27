import React from 'react';

export default function StatusBadge({ status, size = 'md' }) {
  const getStatusStyles = () => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const sizeClass = size === 'sm' ? 'px-2 py-1' : 'px-3 py-1';

  const displayLabel = (status || '').replace(/_/g, ' ').replace(/-/g, ' ');

  return (
    <span className={`inline-flex items-center rounded-full ${getStatusStyles()} ${sizeClass} capitalize`}>
      {displayLabel}
    </span>
  );
}
