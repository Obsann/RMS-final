import React, { useState, useEffect, useContext } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import {
  Clock, CheckCircle, AlertTriangle, Calendar, Loader2,
  Bell, Megaphone, Send, FileText, BarChart2, User, Briefcase
} from 'lucide-react';
import Modal from '../../components/ui/Modal';
import { toast } from 'sonner';
import { getJobs, updateJobStatus, getNotifications, getMeAPI } from '../../utils/api';
import { AuthContext } from '../../App';
import { useNavigate } from 'react-router-dom';

export default function EmployeeDashboard() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [jobCategory, setJobCategory] = useState('');

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskNotes, setTaskNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [jobData, notifData, meData] = await Promise.allSettled([
        getJobs(),
        getNotifications(),
        getMeAPI(),
      ]);
      if (jobData.status === 'fulfilled') setJobs(jobData.value?.jobs || []);
      if (meData.status === 'fulfilled') {
        const me = meData.value?.user || meData.value;
        setJobCategory(me?.jobCategory || '');
      }
      if (notifData.status === 'fulfilled') {
        // Treat "announcement" or "message" from admin/sp as announcements
        const allNotifs = notifData.value?.notifications || [];
        setAnnouncements(
          allNotifs.filter(n => n.type === 'announcement' || n.type === 'message').slice(0, 5)
        );
      }
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (status) => {
    if (!selectedTask) return;
    setSubmitting(true);
    try {
      await updateJobStatus(selectedTask._id, status, taskNotes);
      toast.success(`Task marked as ${status.replace('-', ' ')}`);
      setShowTaskModal(false);
      setTaskNotes('');
      fetchData();
    } catch (error) {
      toast.error(error.message || 'Failed to update task');
    } finally {
      setSubmitting(false);
    }
  };

  const priorityColors = {
    critical: 'text-red-700 bg-red-50 border-red-200',
    high: 'text-orange-700 bg-orange-50 border-orange-200',
    medium: 'text-yellow-700 bg-yellow-50 border-yellow-200',
    low: 'text-green-700 bg-green-50 border-green-200',
  };

  const statusColors = {
    assigned: 'text-blue-700 bg-blue-50',
    'in-progress': 'text-purple-700 bg-purple-50',
    completed: 'text-green-700 bg-green-50',
    pending: 'text-gray-600 bg-gray-50',
  };

  const displayName = (user?.username || user?.name || 'Employee')
    .replace(/\./g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());

  const activeJobs = jobs.filter(j => j.status !== 'completed');
  const completedJobs = jobs.filter(j => j.status === 'completed');
  const inProgressJobs = jobs.filter(j => j.status === 'in-progress');
  const today = new Date().toISOString().split('T')[0];
  const dueTodayJobs = activeJobs.filter(j => j.dueDate && j.dueDate.startsWith(today));

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <span className="ml-3 text-gray-600">Loading your workspace...</span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-blue-100 text-sm font-medium mb-1">Welcome back,</p>
              <h1 className="text-2xl font-bold">{displayName}</h1>
              <p className="text-blue-200 mt-1 text-sm">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
              {jobCategory && (
                <p className="mt-1">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 backdrop-blur-sm rounded-full text-sm font-medium text-blue-100">
                    <Briefcase className="w-3.5 h-3.5" />
                    {jobCategory}
                  </span>
                </p>
              )}
              <p className="mt-3 text-blue-100 text-sm">
                You have <strong className="text-white">{activeJobs.length}</strong> active task{activeJobs.length !== 1 ? 's' : ''}
                {dueTodayJobs.length > 0 && (
                  <> and <strong className="text-yellow-300">{dueTodayJobs.length} due today</strong></>
                )}.
              </p>
            </div>
            <div className="hidden sm:flex items-center justify-center w-16 h-16 bg-white/20 rounded-full">
              <User className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        {/* Task Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: 'Active Tasks', value: activeJobs.length, icon: <Clock className="w-6 h-6" />, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
            { label: 'In Progress', value: inProgressJobs.length, icon: <BarChart2 className="w-6 h-6" />, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
            { label: 'Due Today', value: dueTodayJobs.length, icon: <AlertTriangle className="w-6 h-6" />, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
            { label: 'Completed', value: completedJobs.length, icon: <CheckCircle className="w-6 h-6" />, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
            { label: 'Position', value: jobCategory || 'Unassigned', icon: <Briefcase className="w-6 h-6" />, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200', isText: true },
          ].map((stat, idx) => (
            <div key={idx} className={`bg-white p-5 rounded-xl shadow-sm border ${stat.border}`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                  <p className={`${stat.isText ? 'text-sm' : 'text-2xl'} font-bold text-gray-900 mt-1`}>{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>{stat.icon}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Active Tasks */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" /> My Active Tasks
              </h2>
              <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">{activeJobs.length} tasks</span>
            </div>
            <div className="divide-y divide-gray-100">
              {activeJobs.length === 0 ? (
                <div className="p-8 text-center">
                  <CheckCircle className="w-10 h-10 text-green-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">All tasks complete! Great work.</p>
                </div>
              ) : (
                activeJobs.map(task => (
                  <div key={task._id} className="p-5 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-gray-900 text-sm">{task.title}</h3>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${priorityColors[task.priority] || priorityColors.medium}`}>
                            {task.priority}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[task.status] || 'bg-gray-50 text-gray-600'}`}>
                            {task.status?.replace('-', ' ')}
                          </span>
                        </div>
                        <p className="text-gray-500 text-sm line-clamp-2">{task.description}</p>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                          <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Assigned: {new Date(task.assignedAt || task.createdAt).toLocaleDateString()}</span>
                          {task.dueDate && (
                            <span className={`flex items-center gap-1 font-medium ${task.dueDate.startsWith(today) ? 'text-red-500' : 'text-gray-500'}`}>
                              <AlertTriangle className="w-3.5 h-3.5" /> Due: {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => { setSelectedTask(task); setTaskNotes(task.completionNotes || ''); setShowTaskModal(true); }}
                        className="shrink-0 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Update Progress
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Announcements Panel */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-orange-500" /> Announcements
              </h2>
              <button
                onClick={() => navigate('/employee/notifications')}
                className="text-xs text-blue-600 hover:underline"
              >
                View all
              </button>
            </div>
            <div className="divide-y divide-gray-100">
              {announcements.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">No announcements yet.</p>
                </div>
              ) : (
                announcements.map((a) => (
                  <div key={a._id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                        <Megaphone className="w-4 h-4 text-orange-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 leading-snug line-clamp-2">{a.title}</p>
                        <p className="text-xs text-gray-400 mt-1">{new Date(a.createdAt).toLocaleDateString()}</p>
                      </div>
                      {!(a.isRead || a.read) && <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-1.5" />}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="p-4 border-t border-gray-100">
              <button
                onClick={() => navigate('/employee/notifications')}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <Bell className="w-4 h-4" /> Open Notifications
              </button>
            </div>
          </div>
        </div>

        {/* Completed Tasks Summary */}
        {completedJobs.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" /> Recently Completed
              </h2>
            </div>
            <div className="divide-y divide-gray-100">
              {completedJobs.slice(0, 3).map(task => (
                <div key={task._id} className="px-6 py-4 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                      <div>
                        <p className="font-medium text-gray-900">{task.title}</p>
                        {task.completedAt && <p className="text-gray-400 text-xs">Completed: {new Date(task.completedAt).toLocaleDateString()}</p>}
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded-full text-xs font-medium shrink-0">Done</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Task Update Modal */}
      <Modal isOpen={showTaskModal} onClose={() => setShowTaskModal(false)} title="Update Task Progress" size="md">
        {selectedTask && (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <h3 className="font-semibold text-gray-900 text-base">{selectedTask.title}</h3>
              <p className="text-sm text-gray-600 mt-1">{selectedTask.description}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className={`text-xs px-2.5 py-1 border rounded-lg font-medium ${priorityColors[selectedTask.priority] || priorityColors.medium}`}>
                  {selectedTask.priority} priority
                </span>
                <span className={`text-xs px-2.5 py-1 rounded-lg font-medium ${statusColors[selectedTask.status] || 'bg-gray-50 text-gray-600'}`}>
                  Currently: {selectedTask.status?.replace('-', ' ')}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Work Notes / Findings</label>
              <textarea
                value={taskNotes}
                onChange={(e) => setTaskNotes(e.target.value)}
                rows={3}
                placeholder="Describe what you've done, any issues found, or progress made..."
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
              />
            </div>

            <div className="pt-3 border-t border-gray-200 flex gap-3">
              {selectedTask.status === 'assigned' && (
                <button
                  disabled={submitting}
                  onClick={() => handleUpdateStatus('in-progress')}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium text-sm"
                >
                  {submitting ? 'Updating...' : '🔄 Mark In-Progress'}
                </button>
              )}
              {(selectedTask.status === 'assigned' || selectedTask.status === 'in-progress') && (
                <button
                  disabled={submitting}
                  onClick={() => handleUpdateStatus('completed')}
                  className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium text-sm"
                >
                  {submitting ? 'Saving...' : '✅ Mark Completed'}
                </button>
              )}
              <button onClick={() => setShowTaskModal(false)} className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
