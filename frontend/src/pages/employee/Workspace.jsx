import React, { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { AuthContext } from '../../App';
import { toast } from 'sonner';
import { Loader2, Briefcase, AlertCircle, ChevronRight, Home } from 'lucide-react';
import { getMeAPI, api, getJobs, updateJobStatus, escalateRequest } from '../../utils/api';

// Dashboard components
import EmployeeHeader from '../../components/dashboard/EmployeeHeader';
import ResidentQueue from '../../components/dashboard/ResidentQueue';
import TaskWorkArea from '../../components/dashboard/TaskWorkArea';
import ResidentPanel from '../../components/dashboard/ResidentPanel';
import PerformanceMetrics from '../../components/dashboard/PerformanceMetrics';

// ── Category config (kept for header gradient) ──────────────────────────────
const CATEGORIES = {
  'Identity & Registration': { gradient: 'from-blue-600 to-cyan-500' },
  'Certificates': { gradient: 'from-emerald-600 to-teal-500' },
  'Permits': { gradient: 'from-violet-600 to-purple-500' },
  'Feedback & Support': { gradient: 'from-orange-600 to-red-500' },
};

/**
 * Normalize a Job (with populated sourceRequest) into a unified queue item.
 * This is the key change: the queue is now JOB-based, not request-based.
 */
function normalizeJobToQueueItem(job) {
  const req = job.sourceRequest || {};
  const resident = req.resident || {};
  return {
    _id: job._id,
    // Job fields
    title: job.title,
    description: job.description,
    category: job.category,
    priority: job.priority || req.priority || 'medium',
    status: job.status,
    createdAt: job.createdAt,
    assignedAt: job.assignedAt,
    dueDate: job.dueDate,
    completionNotes: job.completionNotes,
    // Source request fields (for TaskWorkArea formData display)
    sourceRequestId: req._id || null,
    subject: req.subject || job.title,
    type: req.type,
    serviceType: req.serviceType,
    categoryTag: req.categoryTag,
    formData: req.formData || null,
    attachments: req.attachments || [],
    requestStatus: req.status,
    response: req.response || null,
    isEscalated: req.isEscalated || false,
    // Resident info
    user: resident,
    resident: resident,
    unit: req.unit || resident.unit || '',
  };
}

export default function EmployeeWorkspace() {
  const { user } = useContext(AuthContext);

  // Profile & category
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Queue data — now jobs, not raw requests
  const [queueItems, setQueueItems] = useState([]);
  const [allJobs, setAllJobs] = useState([]);
  const [queueLoading, setQueueLoading] = useState(false);

  // Selection
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedResident, setSelectedResident] = useState(null);
  const [residentHistory, setResidentHistory] = useState([]);
  const [residentLoading, setResidentLoading] = useState(false);

  // Action state
  const [submitting, setSubmitting] = useState(false);

  const jobCategory = profile?.jobCategory || user?.jobCategory || '';

  // ── Initial Load ──────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await getMeAPI();
        setProfile(res.user || res);
      } catch {}
      finally { setLoading(false); }
    })();
  }, []);

  // ── Fetch Queue (Job-based) ───────────────────────────────────────────────
  const fetchQueue = useCallback(async () => {
    if (!jobCategory) return;
    setQueueLoading(true);
    try {
      // Fetch assigned jobs — the backend already filters to assignedTo=currentUser for employees
      const data = await getJobs('limit=200');
      const jobs = data?.jobs || [];
      setAllJobs(jobs);

      // Normalize jobs into queue items
      const items = jobs.map(normalizeJobToQueueItem);
      setQueueItems(items);
    } catch (err) {
      toast.error('Failed to load queue data');
    } finally {
      setQueueLoading(false);
    }
  }, [jobCategory]);

  useEffect(() => { fetchQueue(); }, [fetchQueue]);

  // ── Select a queue item ───────────────────────────────────────────────────
  const handleSelect = useCallback(async (item) => {
    setSelectedItem(item);
    const residentId = item.user?._id || item.resident?._id;
    if (!residentId) {
      setSelectedResident(item.user || item.resident || null);
      setResidentHistory([]);
      return;
    }
    setResidentLoading(true);
    try {
      const [userRes, histRes] = await Promise.allSettled([
        api(`/users/${residentId}`),
        api(`/requests?user=${residentId}&limit=20`),
      ]);
      if (userRes.status === 'fulfilled') {
        setSelectedResident(userRes.value?.user || userRes.value);
      } else {
        setSelectedResident(item.user || item.resident || null);
      }
      if (histRes.status === 'fulfilled') {
        setResidentHistory(histRes.value?.requests || []);
      }
    } catch {
      setSelectedResident(item.user || item.resident || null);
      setResidentHistory([]);
    } finally {
      setResidentLoading(false);
    }
  }, []);

  // ── Actions (Approve / Reject / Escalate) ─────────────────────────────────
  const handleAction = useCallback(async (action, reason) => {
    if (!selectedItem) return;
    setSubmitting(true);

    // Optimistic UI — update locally first
    const prevItems = queueItems;
    const optimisticStatus = action === 'approve' ? 'completed' : action === 'reject' ? 'cancelled' : 'in-progress';
    setQueueItems(items => items.map(i => i._id === selectedItem._id ? { ...i, status: optimisticStatus } : i));
    setSelectedItem(prev => prev ? { ...prev, status: optimisticStatus } : prev);

    try {
      const jobId = selectedItem._id;
      const sourceRequestId = selectedItem.sourceRequestId;

      if (action === 'approve') {
        // Update job → cascades to request via backend
        await updateJobStatus(jobId, 'completed', reason || 'Approved by employee');
        toast.success('Request approved — resident will be notified');
      } else if (action === 'reject') {
        // Update job to cancelled → cascades to request
        await updateJobStatus(jobId, 'cancelled', `Rejected: ${reason || 'Not approved'}`);
        toast.success('Request rejected');
      } else if (action === 'escalate') {
        // Escalate the source request to admin
        if (sourceRequestId) {
          await escalateRequest(sourceRequestId, reason || 'Requires admin review');
          toast.success('Request escalated to admin');
        } else {
          toast.error('No linked request to escalate');
        }
      }
    } catch (err) {
      // Rollback optimistic update
      toast.error(err.message || 'Action failed — changes reverted');
      setQueueItems(prevItems);
      setSelectedItem(prev => {
        const original = prevItems.find(i => i._id === prev?._id);
        return original || prev;
      });
    } finally {
      setSubmitting(false);
    }
  }, [selectedItem, queueItems]);

  // ── Global Search ─────────────────────────────────────────────────────────
  const handleGlobalSearch = useCallback(async (query) => {
    try {
      const data = await api(`/users?search=${encodeURIComponent(query)}&role=resident&limit=20`);
      const users = data.users || [];
      if (users.length === 0) {
        toast.info('No residents found');
        return;
      }
      // Auto-select first match
      const resident = users[0];
      setSelectedResident(resident);
      toast.success(`Found ${users.length} resident(s) — showing ${resident.username}`);
      // Fetch their requests
      try {
        const histRes = await api(`/requests?user=${resident._id}&limit=20`);
        setResidentHistory(histRes.requests || []);
      } catch {}
    } catch (err) {
      toast.error('Search failed');
    }
  }, []);

  // ── Keyboard Shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (e.altKey && e.key === 'n') {
        // Alt+N: select next queue item
        e.preventDefault();
        const currentIdx = queueItems.findIndex(i => i._id === selectedItem?._id);
        const nextIdx = (currentIdx + 1) % queueItems.length;
        if (queueItems[nextIdx]) handleSelect(queueItems[nextIdx]);
      }
      if (e.altKey && e.key === 'r') {
        // Alt+R: refresh queue
        e.preventDefault();
        fetchQueue();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [queueItems, selectedItem, handleSelect, fetchQueue]);

  // ── Session Stats ─────────────────────────────────────────────────────────
  const sessionStats = useMemo(() => {
    const completed = queueItems.filter(i => i.status === 'completed').length;
    const inProgress = queueItems.filter(i => i.status === 'in-progress' || i.status === 'assigned').length;
    const pending = queueItems.filter(i => i.status === 'pending').length;
    return { completed, inProgress, pending, avgTime: '~8 min' };
  }, [queueItems]);

  // ── Loading / No Category ─────────────────────────────────────────────────
  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <span className="ml-3 text-gray-600">Loading workspace...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (!jobCategory) {
    return (
      <DashboardLayout>
        <div className="max-w-xl mx-auto text-center py-16">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Briefcase className="w-10 h-10 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">No Workspace Assigned</h1>
          <p className="text-gray-600 mb-6">
            Your administrator has not assigned a job category to your account yet.
            Once assigned, your personalized workspace with task-specific tools will appear here.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
            <AlertCircle className="w-4 h-4" />Contact your administrator
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4">

        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1.5 text-xs text-gray-500">
          <Home className="w-3.5 h-3.5" />
          <span>Home</span>
          <ChevronRight className="w-3 h-3" />
          <span>{jobCategory}</span>
          {selectedItem && (
            <>
              <ChevronRight className="w-3 h-3" />
              <span className="text-blue-600 font-medium">#{(selectedItem._id || '').slice(-6).toUpperCase()}</span>
            </>
          )}
        </nav>

        {/* 1. Employee Header */}
        <EmployeeHeader
          profile={profile}
          stats={sessionStats}
          onSearch={handleGlobalSearch}
        />

        {/* 2. Three-Pane Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4" style={{ minHeight: 'calc(100vh - 360px)' }}>
          {/* Left — Queue (25%) */}
          <div className="lg:col-span-1">
            <ResidentQueue
              items={queueItems}
              loading={queueLoading}
              selectedId={selectedItem?._id}
              onSelect={handleSelect}
              onRefresh={fetchQueue}
            />
          </div>

          {/* Center — Work Area (50%) */}
          <div className="lg:col-span-2">
            <TaskWorkArea
              item={selectedItem}
              jobCategory={jobCategory}
              resident={selectedResident}
              onAction={handleAction}
              submitting={submitting}
            />
          </div>

          {/* Right — Resident Info (25%) */}
          <div className="lg:col-span-1">
            <ResidentPanel
              resident={selectedResident}
              requestHistory={residentHistory}
              loading={residentLoading}
            />
          </div>
        </div>

        {/* 3. Performance Metrics Table */}
        <PerformanceMetrics jobs={allJobs} requests={queueItems} />

        {/* Keyboard shortcut hint */}
        <div className="text-center py-2">
          <p className="text-[10px] text-gray-400">
            Shortcuts: <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-[10px] font-mono">Alt+N</kbd> Next Resident · <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-[10px] font-mono">Alt+R</kbd> Refresh Queue
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
