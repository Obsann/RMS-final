/**
 * Centralized category definitions for the RMS system
 * This ensures consistency between frontend and backend
 */

const employeeCategories = {
  // Maintenance & Technical
  'maintenance': {
    label: 'Maintenance',
    description: 'Building maintenance, repairs, and facilities management',
    color: 'from-orange-400 to-amber-500',
    icon: 'wrench'
  },
  'cleaning': {
    label: 'Cleaning',
    description: 'Sanitation and cleaning services',
    color: 'from-teal-400 to-cyan-500',
    icon: 'sparkles'
  },
  'security': {
    label: 'Security',
    description: 'Security and safety personnel',
    color: 'from-blue-500 to-indigo-600',
    icon: 'shield'
  },
  'administration': {
    label: 'Administration',
    description: 'Administrative and office staff',
    color: 'from-purple-500 to-violet-600',
    icon: 'clipboard'
  },
  'it': {
    label: 'IT Support',
    description: 'Information technology and technical support',
    color: 'from-sky-500 to-blue-600',
    icon: 'cpu'
  },
  'finance': {
    label: 'Finance',
    description: 'Financial and accounting staff',
    color: 'from-emerald-500 to-green-600',
    icon: 'dollar-sign'
  },
  'health': {
    label: 'Health Services',
    description: 'Medical and health personnel',
    color: 'from-red-400 to-pink-500',
    icon: 'heart'
  },
  'education': {
    label: 'Education',
    description: 'Educational and training staff',
    color: 'from-violet-400 to-purple-500',
    icon: 'graduation-cap'
  },
  'transport': {
    label: 'Transport',
    description: 'Transportation and logistics',
    color: 'from-yellow-400 to-orange-500',
    icon: 'truck'
  },
  'general': {
    label: 'General Staff',
    description: 'General service personnel',
    color: 'from-gray-400 to-gray-600',
    icon: 'users'
  }
};

const jobCategories = [
  'Identity & Registration',
  'Certificates',
  'Permits',
  'Feedback & Support',
];

const taskPriorities = {
  'low': { label: 'Low', color: 'bg-gray-100 text-gray-700' },
  'medium': { label: 'Medium', color: 'bg-blue-100 text-blue-700' },
  'high': { label: 'High', color: 'bg-orange-100 text-orange-700' },
  'urgent': { label: 'Urgent', color: 'bg-red-100 text-red-700' }
};

const statusColors = {
  'pending': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  'approved': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'rejected': 'bg-red-100 text-red-700 border-red-200',
  'active': 'bg-blue-100 text-blue-700 border-blue-200',
  'inactive': 'bg-gray-100 text-gray-700 border-gray-200',
  'completed': 'bg-green-100 text-green-700 border-green-200',
  'in-progress': 'bg-orange-100 text-orange-700 border-orange-200',
  'cancelled': 'bg-gray-100 text-gray-700 border-gray-200'
};

// Helper functions
const getEmployeeCategory = (category) => {
  return employeeCategories[category] || employeeCategories.general;
};

const getCategoryColor = (category) => {
  return employeeCategories[category]?.color || employeeCategories.general.color;
};

const getPriorityInfo = (priority) => {
  return taskPriorities[priority] || taskPriorities.medium;
};

const getStatusColor = (status) => {
  return statusColors[status] || statusColors.pending;
};

// Export everything
module.exports = {
  employeeCategories,
  jobCategories,
  taskPriorities,
  statusColors,
  getEmployeeCategory,
  getCategoryColor,
  getPriorityInfo,
  getStatusColor
};