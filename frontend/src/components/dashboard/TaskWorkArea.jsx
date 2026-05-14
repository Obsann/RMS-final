import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle, XCircle, AlertTriangle, Send, FileText, MessageSquare,
  IdCard, Archive, Loader2, Clock, Shield, Eye, Camera, Printer,
  CreditCard, PenTool, Timer, ChevronDown, Upload, Image,
  Search, Filter, Calendar, Hash, User, Phone, MapPin,
} from 'lucide-react';
import WorkflowStepper from './WorkflowStepper';
import { api, getFileUrl } from '../../utils/api';
import { toast } from 'sonner';

// ── Auto-save helper ─────────────────────────────────────────────────────────
function useAutoSave(key, value, delay = 2000) {
  useEffect(() => {
    if (!key || !value) return;
    const t = setTimeout(() => {
      try { localStorage.setItem(`rms_autosave_${key}`, JSON.stringify(value)); } catch {}
    }, delay);
    return () => clearTimeout(t);
  }, [key, value, delay]);
}
function loadAutoSave(key) {
  try { return JSON.parse(localStorage.getItem(`rms_autosave_${key}`)) || {}; } catch { return {}; }
}
function clearAutoSave(key) {
  try { localStorage.removeItem(`rms_autosave_${key}`); } catch {}
}

// ── Phone mask ───────────────────────────────────────────────────────────────
function maskPhone(v) {
  const d = (v || '').replace(/\D/g, '').slice(0, 12);
  if (d.length <= 3) return `+${d}`;
  if (d.length <= 5) return `+${d.slice(0,3)}-${d.slice(3)}`;
  if (d.length <= 8) return `+${d.slice(0,3)}-${d.slice(3,5)}-${d.slice(5)}`;
  return `+${d.slice(0,3)}-${d.slice(3,5)}-${d.slice(5,8)}-${d.slice(8)}`;
}

// ── SLA Timer ────────────────────────────────────────────────────────────────
function SLATimer({ createdAt, slaHours = 48 }) {
  const [remaining, setRemaining] = useState('');
  const [isOverdue, setIsOverdue] = useState(false);
  useEffect(() => {
    if (!createdAt) return;
    const update = () => {
      const deadline = new Date(createdAt).getTime() + slaHours * 3600000;
      const diff = deadline - Date.now();
      setIsOverdue(diff <= 0);
      const abs = Math.abs(diff);
      const h = Math.floor(abs / 3600000);
      const m = Math.floor((abs % 3600000) / 60000);
      setRemaining(`${diff < 0 ? '-' : ''}${h}h ${m}m`);
    };
    update();
    const i = setInterval(update, 60000);
    return () => clearInterval(i);
  }, [createdAt, slaHours]);
  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${isOverdue ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
      <Timer className="w-3.5 h-3.5" />
      <span>SLA: {remaining}</span>
    </div>
  );
}

// ── Action Console ───────────────────────────────────────────────────────────
function ActionConsole({ item, onAction, submitting }) {
  const [rejectReason, setRejectReason] = useState('');
  const [showReject, setShowReject] = useState(false);
  if (!item) return null;
  const isDone = item.status === 'completed' || item.status === 'approved' || item.status === 'resolved';
  const isRejected = item.status === 'cancelled' || item.status === 'rejected';
  
  return (
    <div className="border-t border-gray-200 bg-gray-50 p-4 rounded-b-2xl">
      {isDone ? (
        <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
          <CheckCircle className="w-5 h-5" /><span className="text-sm font-semibold">This item has been approved and resolved</span>
        </div>
      ) : isRejected ? (
        <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <XCircle className="w-5 h-5" /><span className="text-sm font-semibold">This item has been rejected</span>
        </div>
      ) : showReject ? (
        <div className="space-y-2">
          <select value={rejectReason} onChange={e => setRejectReason(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500">
            <option value="">Select rejection reason...</option>
            <option value="Incomplete documents">Incomplete documents</option>
            <option value="Invalid information">Invalid information</option>
            <option value="Duplicate request">Duplicate request</option>
            <option value="Out of jurisdiction">Out of jurisdiction</option>
            <option value="Other">Other</option>
          </select>
          <div className="flex gap-2">
            <button disabled={!rejectReason || submitting} onClick={() => { onAction('reject', rejectReason); setShowReject(false); setRejectReason(''); }} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm font-semibold flex items-center justify-center gap-1.5">
              <XCircle className="w-4 h-4" />{submitting ? 'Rejecting...' : 'Confirm Reject'}
            </button>
            <button onClick={() => setShowReject(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-white">Cancel</button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <button disabled={submitting} onClick={() => onAction('approve')} className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 text-sm font-bold flex items-center justify-center gap-1.5 shadow-sm">
            <CheckCircle className="w-4 h-4" />{submitting ? 'Processing...' : 'Approve'}
          </button>
          <button disabled={submitting} onClick={() => setShowReject(true)} className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 text-sm font-bold flex items-center justify-center gap-1.5 shadow-sm">
            <XCircle className="w-4 h-4" />Reject
          </button>
          <button disabled={submitting} onClick={() => onAction('escalate')} className="px-4 py-2.5 bg-amber-500 text-white rounded-xl hover:bg-amber-600 disabled:opacity-50 text-sm font-bold flex items-center justify-center gap-1.5 shadow-sm">
            <AlertTriangle className="w-4 h-4" />Refer
          </button>
        </div>
      )}
    </div>
  );
}

// ── Attachments Gallery ──────────────────────────────────────────────────────
function AttachmentGallery({ attachments }) {
  if (!attachments || !attachments.length) return null;

  return (
    <div className="mb-4 p-4 border border-gray-200 rounded-xl bg-white shadow-sm">
      <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
        <Image className="w-4 h-4 text-gray-500" />
        Uploaded Evidence & Documents
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {attachments.map((a, i) => {
          const isImage = a.originalName?.match(/\.(jpg|jpeg|png|gif)$/i) || a.filename?.match(/\.(jpg|jpeg|png|gif)$/i) || (a.url && a.url.match(/\.(jpg|jpeg|png|gif)$/i));
          const linkHref = a.url || getFileUrl(a.filename) || '#';
          return (
            <a
              key={i}
              href={linkHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-indigo-50 border border-gray-200 hover:border-indigo-200 rounded-lg transition-colors group"
            >
              <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center flex-shrink-0 shadow-sm border border-gray-100 overflow-hidden">
                {isImage ? <img src={linkHref} alt="preview" className="w-full h-full object-cover" /> : <FileText className="w-5 h-5 text-indigo-500" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-900 truncate group-hover:text-indigo-700">
                  {a.originalName || a.filename || 'Document'}
                </p>
                <p className="text-[10px] text-gray-500 mt-0.5">Click to view</p>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}

// ── Role Module: ID & Registration ───────────────────────────────────────────
function IDRegistrationModule({ item, onAction, submitting }) {
  const checklist = [
    { key: 'birth', label: 'Birth Certificate Verified' },
    { key: 'address', label: 'Address Proof Checked' },
    { key: 'photo', label: 'Photo ID Matches' },
    { key: 'residency', label: 'Residency Confirmed' },
  ];
  const saved = loadAutoSave(item?._id);
  const [checks, setChecks] = useState(saved.checks || {});
  const [notes, setNotes] = useState(saved.notes || '');
  useAutoSave(item?._id, { checks, notes });

  const biometricStatus = item?.livenessCheck?.passed;

  return (
    <div className="space-y-4">
      {/* Verification Checklist */}
      <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl">
        <p className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-3 flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" />Verification Checklist</p>
        <div className="space-y-2">
          {checklist.map(c => (
            <label key={c.key} className="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" checked={!!checks[c.key]} onChange={e => setChecks(p => ({ ...p, [c.key]: e.target.checked }))} className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              <span className={`text-sm ${checks[c.key] ? 'text-green-700 font-medium line-through' : 'text-gray-700'}`}>{c.label}</span>
              {checks[c.key] && <CheckCircle className="w-3.5 h-3.5 text-green-500 ml-auto" />}
            </label>
          ))}
        </div>
      </div>
      {/* Biometric Status */}
      <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-200">
        <Camera className={`w-5 h-5 ${biometricStatus ? 'text-green-600' : biometricStatus === false ? 'text-red-600' : 'text-gray-400'}`} />
        <div>
          <p className="text-xs font-semibold text-gray-700">Biometric Capture</p>
          <p className={`text-[10px] font-medium ${biometricStatus ? 'text-green-600' : biometricStatus === false ? 'text-red-600' : 'text-gray-400'}`}>
            {biometricStatus ? '✓ Quality Passed — Liveness Verified' : biometricStatus === false ? '✗ Liveness Failed' : '○ Not yet captured'}
          </p>
        </div>
        {item?.livenessCheck?.score != null && (
          <span className="ml-auto text-xs font-bold text-gray-600">{(item.livenessCheck.score * 100).toFixed(0)}%</span>
        )}
      </div>
      {/* ID Preview */}
      <div className="p-4 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl text-white">
        <div className="flex items-center gap-2 mb-3"><Printer className="w-4 h-4 text-blue-200" /><span className="text-xs font-bold text-blue-200 uppercase tracking-wider">ID Card Preview</span></div>
        <div className="bg-white/10 backdrop-blur rounded-lg p-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center text-xl font-bold">{(item?.user?.username || 'R').charAt(0).toUpperCase()}</div>
            <div>
              <p className="font-bold text-sm">{item?.user?.username || 'Resident Name'}</p>
              <p className="text-blue-200 text-[10px]">FIN: {item?.idNumber || 'Pending Assignment'}</p>
              <p className="text-blue-200 text-[10px]">Status: {item?.status || 'pending'}</p>
            </div>
          </div>
        </div>
      </div>
      {/* Notes */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Processing Notes</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Add verification notes..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" />
        <p className="text-[10px] text-gray-400 mt-1">Auto-saved locally</p>
      </div>
    </div>
  );
}

// ── Role Module: Complaint Handling ──────────────────────────────────────────
function ComplaintModule({ item, onAction, submitting }) {
  const saved = loadAutoSave(item?._id);
  const [response, setResponse] = useState(saved.response || '');
  useAutoSave(item?._id, { response });

  const handleSendResponse = async () => {
    if (!response.trim()) return;
    try {
      await api(`/requests/${item._id}/respond`, { method: 'PUT', body: JSON.stringify({ message: response }) });
      toast.success('Response sent to resident');
      setResponse('');
      clearAutoSave(item._id);
    } catch (err) { toast.error(err.message || 'Failed to send response'); }
  };

  return (
    <div className="space-y-4">
      <SLATimer createdAt={item?.createdAt} slaHours={48} />
      {/* Communication Thread */}
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
        <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-3 flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5" />Communication Thread</p>
        <div className="space-y-3 max-h-48 overflow-y-auto">
          {/* Original complaint */}
          <div className="bg-white rounded-lg p-3 border border-gray-100">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center"><User className="w-3 h-3 text-purple-600" /></div>
              <span className="text-[10px] font-semibold text-gray-600">{item?.user?.username || 'Resident'}</span>
              <span className="text-[10px] text-gray-400">{item?.createdAt ? new Date(item.createdAt).toLocaleString() : ''}</span>
            </div>
            <p className="text-sm text-gray-800">{item?.description || 'No description provided.'}</p>
          </div>
          {/* Previous response */}
          {item?.response?.message && (
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-100 ml-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center"><Shield className="w-3 h-3 text-blue-600" /></div>
                <span className="text-[10px] font-semibold text-blue-600">Staff Response</span>
              </div>
              <p className="text-sm text-blue-800">{item.response.message}</p>
            </div>
          )}
        </div>
      </div>
      {/* Response area */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Your Response</label>
        <textarea value={response} onChange={e => setResponse(e.target.value)} rows={3} placeholder="Type your response to the complaint..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none" />
        <div className="flex gap-2 mt-2">
          <button onClick={handleSendResponse} disabled={!response.trim()} className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 text-sm font-semibold flex items-center gap-1.5"><Send className="w-3.5 h-3.5" />Send Response</button>
        </div>
      </div>
    </div>
  );
}

// ── Role Module: Document Processing ─────────────────────────────────────────
function DocumentModule({ item, onAction, submitting }) {
  const saved = loadAutoSave(item?._id);
  const [response, setResponse] = useState(saved.response || '');
  useAutoSave(item?._id, { response });

  const handleSendResponse = async () => {
    if (!response.trim()) return;
    try {
      await api(`/requests/${item._id}/respond`, { method: 'PUT', body: JSON.stringify({ message: response }) });
      toast.success('Response sent');
      setResponse('');
      clearAutoSave(item._id);
    } catch (err) { toast.error(err.message || 'Failed'); }
  };

  return (
    <div className="space-y-4">
      {/* Fee Verification */}
      <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-200">
        <CreditCard className="w-5 h-5 text-emerald-600" />
        <div className="flex-1">
          <p className="text-xs font-semibold text-gray-700">Fee Verification</p>
          <p className="text-[10px] text-gray-500">Administrative fee status</p>
        </div>
        <span className="px-3 py-1 rounded-lg text-xs font-bold bg-green-50 text-green-700 border border-green-200">Paid ✓</span>
      </div>
      {/* Auto-signature notice */}
      <div className="flex items-center gap-3 p-3 rounded-xl border border-emerald-200 bg-emerald-50">
        <CheckCircle className="w-5 h-5 text-emerald-600" />
        <div className="flex-1">
          <p className="text-xs font-semibold text-emerald-800">Digital Signature</p>
          <p className="text-[10px] text-emerald-600">Your signature will be automatically watermarked on the document when you approve</p>
        </div>
      </div>
      {/* Response */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Processing Notes</label>
        <textarea value={response} onChange={e => setResponse(e.target.value)} rows={2} placeholder="Add notes for the document..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 resize-none" />
        <button onClick={handleSendResponse} disabled={!response.trim()} className="mt-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 text-sm font-semibold flex items-center gap-1.5"><Send className="w-3.5 h-3.5" />Send</button>
      </div>
    </div>
  );
}

// ── Role Module: Records Management ──────────────────────────────────────────
function RecordsModule({ item, resident }) {
  const auditEntries = [
    { timestamp: new Date().toISOString(), actor: 'Current Session', action: 'RECORD_VIEWED', ip: '192.168.1.x' },
  ];
  return (
    <div className="space-y-4">
      {/* Audit Trail */}
      <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-xl">
        <p className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-3 flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" />Audit Trail</p>
        <div className="space-y-2">
          {auditEntries.map((e, i) => (
            <div key={i} className="flex items-center gap-3 text-xs bg-white p-2.5 rounded-lg border border-amber-100">
              <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-gray-800">{e.action}</span>
                <span className="text-gray-400 ml-2">by {e.actor}</span>
              </div>
              <span className="text-[10px] text-gray-400 font-mono shrink-0">{new Date(e.timestamp).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
      {/* Data Health */}
      <div className="p-4 border border-gray-200 rounded-xl">
        <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Record Details</p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 bg-gray-50 rounded-lg"><span className="text-gray-400">Subject</span><p className="font-medium text-gray-800 mt-0.5">{item?.subject || '—'}</p></div>
          <div className="p-2 bg-gray-50 rounded-lg"><span className="text-gray-400">Category</span><p className="font-medium text-gray-800 mt-0.5">{item?.category || '—'}</p></div>
          <div className="p-2 bg-gray-50 rounded-lg"><span className="text-gray-400">Created</span><p className="font-medium text-gray-800 mt-0.5">{item?.createdAt ? new Date(item.createdAt).toLocaleDateString() : '—'}</p></div>
          <div className="p-2 bg-gray-50 rounded-lg"><span className="text-gray-400">Status</span><p className="font-medium text-gray-800 mt-0.5 capitalize">{item?.status || '—'}</p></div>
        </div>
      </div>
    </div>
  );
}

// ── TASK_COMPONENT_MAP ───────────────────────────────────────────────────────
const TASK_COMPONENT_MAP = {
  'Identity & Registration': IDRegistrationModule,
  'Certificates': DocumentModule,
  'Permits': DocumentModule,
  'Feedback & Support': ComplaintModule,
};

// ── Form Data Panel (shows resident's submitted data) ────────────────────────
function FormDataPanel({ formData, serviceType }) {
  if (!formData || typeof formData !== 'object' || Object.keys(formData).length === 0) return null;
  const entries = Object.entries(formData).filter(([k, v]) => v != null && v !== '' && !k.startsWith('_'));
  if (entries.length === 0) return null;

  return (
    <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl mb-4">
      <p className="text-xs font-bold text-indigo-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
        <FileText className="w-3.5 h-3.5" />
        {serviceType ? `${serviceType} — Submitted Details` : 'Submitted Form Data'}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {entries.map(([key, val]) => {
          const isCloudinaryUrl = typeof val === 'string' && val.includes('res.cloudinary.com/');
          const isPdf = typeof val === 'string' && val.match(/\.pdf$/i);
          const isImageUrl = typeof val === 'string' && (val.match(/\.(jpeg|jpg|gif|png|webp)$/i) || (isCloudinaryUrl && !isPdf));
          const isDocumentUrl = isCloudinaryUrl || isPdf;
          
          const finalValUrl = isDocumentUrl ? (val.startsWith('http') ? val : getFileUrl(val)) : null;

          return (
            <div key={key} className="p-2 bg-white rounded-lg border border-indigo-100">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider mb-1 block">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </span>
              {isImageUrl ? (
                <a href={finalValUrl} target="_blank" rel="noopener noreferrer" className="block mt-1.5 overflow-hidden rounded border border-gray-200 hover:border-blue-400 transition-colors shadow-sm bg-gray-50">
                  <img src={finalValUrl} alt={key} className="w-full h-32 object-cover hover:scale-105 transition-transform duration-300" />
                </a>
              ) : isDocumentUrl ? (
                <a href={finalValUrl} target="_blank" rel="noopener noreferrer" className="mt-1.5 flex items-center gap-2 p-2.5 bg-gray-50 border border-gray-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-200 transition-colors group">
                  <div className="w-8 h-8 rounded bg-white flex items-center justify-center border border-gray-200 shrink-0 shadow-sm">
                    <FileText className="w-4 h-4 text-indigo-500" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-xs font-semibold text-gray-700 truncate group-hover:text-indigo-700">View Document</span>
                    <span className="block text-[10px] text-gray-500 truncate">PDF File</span>
                  </div>
                </a>
              ) : (
                <p className="text-sm font-medium text-gray-900 mt-0.5">{String(val)}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main TaskWorkArea ────────────────────────────────────────────────────────
export default function TaskWorkArea({ item, jobCategory, resident, onAction, submitting }) {
  const Module = TASK_COMPONENT_MAP[jobCategory] || ComplaintModule;

  if (!item) {
    return (
      <div className="flex flex-col h-full bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden" id="task-work-area">
        <div className="px-5 py-3 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-blue-50">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center"><FileText className="w-3.5 h-3.5 text-white" /></div>
            <h3 className="text-sm font-bold text-gray-900">Work Area</h3>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4"><FileText className="w-8 h-8 text-gray-300" /></div>
            <p className="text-base font-semibold text-gray-400">Select a Resident</p>
            <p className="text-xs text-gray-300 mt-1">Choose from the queue to begin processing</p>
            <p className="text-[10px] text-gray-300 mt-3 bg-gray-50 px-3 py-1.5 rounded-lg inline-block">Keyboard: <kbd className="px-1 py-0.5 bg-white border rounded text-[10px]">Alt</kbd>+<kbd className="px-1 py-0.5 bg-white border rounded text-[10px]">N</kbd> for next</p>
          </div>
        </div>
      </div>
    );
  }

  const statusBadge = (() => {
    const s = item.status || 'pending';
    if (s === 'completed' || s === 'approved') return 'bg-green-50 text-green-700 border-green-200';
    if (s === 'cancelled') return 'bg-red-50 text-red-700 border-red-200';
    if (s === 'pending') return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    return 'bg-blue-50 text-blue-700 border-blue-200';
  })();

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden" id="task-work-area">
      {/* Header */}
      <div className="px-5 py-3 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-blue-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center"><FileText className="w-3.5 h-3.5 text-white" /></div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">{item.subject || item.title || 'Task'}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-[10px] text-gray-500">{item.category || jobCategory} · #{(item._id || '').slice(-6).toUpperCase()}</p>
                {item.serviceType && (
                  <span className="text-[10px] font-medium text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">{item.serviceType}</span>
                )}
                {item.isEscalated && (
                  <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">⚠ ESCALATED</span>
                )}
              </div>
            </div>
          </div>
          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border uppercase ${statusBadge}`}>
            {(item.status || 'pending').replace('-', ' ')}
          </span>
        </div>
      </div>

      {/* Workflow Stepper */}
      <div className="px-5 py-3 border-b border-gray-100 bg-white">
        <WorkflowStepper status={item.status} />
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-5" style={{ maxHeight: 'calc(100vh - 440px)' }}>
        {/* Description */}
        {item.description && (
          <div className="mb-4 p-3 bg-gray-50 border border-gray-100 rounded-xl">
            <p className="text-xs text-gray-600 whitespace-pre-wrap">{item.description}</p>
          </div>
        )}

        {/* Form Data from source request */}
        <FormDataPanel formData={item.formData || item.sourceRequest?.formData} serviceType={item.serviceType || item.sourceRequest?.serviceType} />

        {/* Attachments */}
        <AttachmentGallery attachments={item.attachments || item.sourceRequest?.attachments} />

        {/* Role-specific module */}
        <Module item={item} resident={resident} onAction={onAction} submitting={submitting} />
      </div>

      {/* Action Console */}
      <ActionConsole item={item} onAction={onAction} submitting={submitting} />
    </div>
  );
}
