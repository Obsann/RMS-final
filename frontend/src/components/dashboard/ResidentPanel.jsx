import React, { useState, useEffect, useMemo } from 'react';
import {
  User, Phone, MapPin, Mail, Calendar, Shield, Hash,
  Clock, CheckCircle, AlertTriangle, FileText, MessageSquare,
  ChevronRight, ExternalLink, Activity, BarChart2, Loader2, Home,
  AlertCircle
} from 'lucide-react';
import { getFileUrl } from '../../utils/api';

function DataCompleteness({ profile }) {
  const fields = ['username', 'email', 'phone', 'address', 'sex', 'dateOfBirth', 'unit', 'nationalId'];
  const filled = fields.filter(f => profile?.[f]).length;
  const pct = Math.round((filled / fields.length) * 100);

  const color = pct >= 80 ? 'text-green-600' : pct >= 50 ? 'text-yellow-600' : 'text-red-600';
  const bg = pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500';
  const bgTrack = pct >= 80 ? 'bg-green-100' : pct >= 50 ? 'bg-yellow-100' : 'bg-red-100';

  return (
    <div className="px-4 py-3 border-t border-gray-100">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Data Completeness</span>
        <span className={`text-xs font-bold ${color}`}>{pct}%</span>
      </div>
      <div className={`h-1.5 rounded-full ${bgTrack} overflow-hidden`}>
        <div className={`h-full rounded-full ${bg} transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-[10px] text-gray-400 mt-1">{filled}/{fields.length} fields populated</p>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  if (!value || value === '—') return null;
  return (
    <div className="flex items-center gap-2.5 py-1.5">
      <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
        <Icon className="w-3 h-3 text-blue-600" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-gray-400 uppercase tracking-wider">{label}</p>
        <p className="text-xs font-medium text-gray-900 truncate capitalize">{value}</p>
      </div>
    </div>
  );
}

const STATUS_DOT = {
  pending: 'bg-yellow-400',
  'in-progress': 'bg-blue-400',
  completed: 'bg-green-400',
  approved: 'bg-green-400',
  rejected: 'bg-red-400',
  resolved: 'bg-green-400',
};

function TimelineItem({ item }) {
  const dot = STATUS_DOT[item.status] || 'bg-gray-300';
  return (
    <div className="flex gap-3 relative">
      {/* Line */}
      <div className="flex flex-col items-center">
        <div className={`w-2.5 h-2.5 rounded-full ${dot} shrink-0 mt-1 z-10 border-2 border-white shadow-sm`} />
        <div className="w-px flex-1 bg-gray-200 -mt-px" />
      </div>
      {/* Content */}
      <div className="pb-4 min-w-0 flex-1">
        <p className="text-xs font-semibold text-gray-800 truncate">{item.subject || item.title || item.category || 'Request'}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium capitalize ${
            item.status === 'completed' || item.status === 'approved' ? 'bg-green-50 text-green-700' :
            item.status === 'pending' ? 'bg-yellow-50 text-yellow-700' :
            item.status === 'rejected' ? 'bg-red-50 text-red-700' :
            'bg-blue-50 text-blue-700'
          }`}>
            {(item.status || 'pending').replace('-', ' ')}
          </span>
          <span className="text-[10px] text-gray-400">{new Date(item.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}

export default function ResidentPanel({ resident, requestHistory = [], loading }) {
  if (!resident) {
    return (
      <div className="flex flex-col h-full bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden" id="resident-panel">
        <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-indigo-50">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-purple-600 rounded-lg flex items-center justify-center">
              <User className="w-3.5 h-3.5 text-white" />
            </div>
            <h3 className="text-sm font-bold text-gray-900">Resident Info</h3>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <User className="w-7 h-7 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-400">No Resident Selected</p>
            <p className="text-xs text-gray-300 mt-1">Select from queue to view details</p>
          </div>
        </div>
      </div>
    );
  }

  const name = (resident.username || 'Unknown').replace(/\./g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  const initial = (resident.username || 'R').charAt(0).toUpperCase();

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden" id="resident-panel">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-indigo-50">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-purple-600 rounded-lg flex items-center justify-center">
            <User className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">Resident Info</h3>
            <p className="text-[10px] text-gray-500">Quick reference</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 380px)' }}>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 text-purple-500 animate-spin" />
          </div>
        ) : (
          <>
            {/* Profile Card */}
            <div className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-purple-200">
                  {initial}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-gray-900 truncate">{name}</p>
                  <p className="text-[10px] text-gray-500">{resident.email || '—'}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border capitalize ${
                      resident.status === 'active' || resident.status === 'approved'
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                    }`}>
                      {resident.status || 'pending'}
                    </span>
                    {resident._id && (
                      <span className="text-[10px] text-gray-400 font-mono">
                        #{resident._id.slice(-6).toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Info Fields */}
              <div className="space-y-0.5">
                <InfoRow icon={Phone} label="Phone" value={resident.phone} />
                <InfoRow icon={MapPin} label="Address" value={resident.address} />
                <InfoRow icon={Home} label="Unit" value={resident.unit} />
                <InfoRow icon={User} label="Sex" value={resident.sex} />
                <InfoRow icon={Calendar} label="Registered" value={resident.createdAt ? new Date(resident.createdAt).toLocaleDateString() : null} />
                <InfoRow icon={Hash} label="National ID" value={resident.nationalId} />
              </div>

              {/* ID Verification & Fake Credential Banner */}
              <div className="mt-4 border-t border-gray-100 pt-3">
                {(!resident.nationalId?.toUpperCase().startsWith('HMK') && !resident.address?.toLowerCase().includes('hermata')) && (
                  <div className="mb-3 bg-amber-50 border border-amber-200 rounded-lg p-2.5 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-bold text-amber-800 uppercase">Verification Required</p>
                      <p className="text-[10px] text-amber-700 leading-tight mt-0.5">
                        Address or ID outside Hermata Merkato Kebele. Please check the ID Card Photo.
                      </p>
                    </div>
                  </div>
                )}
                
                {resident.idCardPhoto ? (
                  <div className="space-y-1">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">ID Card Photo Document</p>
                    <a href={getFileUrl(resident.idCardPhoto)} target="_blank" rel="noopener noreferrer" className="block relative w-full h-24 rounded-lg overflow-hidden border border-gray-200 hover:border-blue-500 transition-colors group">
                      <img src={getFileUrl(resident.idCardPhoto)} alt="ID Card" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-xs font-medium">Click to view</span>
                      </div>
                    </a>
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-dashed border-gray-200 rounded-lg p-3 text-center">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1">ID Card Photo Document</p>
                    <p className="text-xs text-red-500 italic">No ID photo uploaded</p>
                  </div>
                )}
              </div>

              {/* Dependents */}
              {resident.dependents?.length > 0 && (
                <div className="mt-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                  <p className="text-[10px] font-bold text-blue-800 uppercase tracking-wider mb-1.5">
                    Household ({resident.dependents.length})
                  </p>
                  {resident.dependents.map((d, i) => (
                    <p key={i} className="text-xs text-blue-700">
                      {d.name} — {d.relationship}{d.age ? `, ${d.age}y` : ''}
                    </p>
                  ))}
                </div>
              )}
            </div>

            {/* Data Completeness */}
            <DataCompleteness profile={resident} />

            {/* Request Timeline */}
            <div className="px-4 py-3 border-t border-gray-100">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Activity className="w-3 h-3" />
                Request History ({requestHistory.length})
              </p>
              {requestHistory.length === 0 ? (
                <p className="text-xs text-gray-400 italic">No prior requests found</p>
              ) : (
                <div className="space-y-0">
                  {requestHistory.slice(0, 8).map((item, idx) => (
                    <TimelineItem key={item._id || idx} item={item} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
