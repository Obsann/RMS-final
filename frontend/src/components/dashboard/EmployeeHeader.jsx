import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  User, Shield, Search, Zap, Clock, Coffee, WifiOff,
  Briefcase, Hash, Activity, CheckCircle, AlertTriangle,
  MessageSquare, FileText, ChevronDown,
} from 'lucide-react';
import { AuthContext } from '../../App';
import { getMeAPI, api } from '../../utils/api';

const DUTY_STATES = [
  { key: 'active', label: 'Active', icon: Zap, color: 'bg-green-500', ring: 'ring-green-300', text: 'text-green-700', bg: 'bg-green-50' },
  { key: 'break', label: 'On Break', icon: Coffee, color: 'bg-yellow-500', ring: 'ring-yellow-300', text: 'text-yellow-700', bg: 'bg-yellow-50' },
  { key: 'offline', label: 'Offline', icon: WifiOff, color: 'bg-gray-400', ring: 'ring-gray-300', text: 'text-gray-600', bg: 'bg-gray-100' },
];

export default function EmployeeHeader({ profile, stats, onSearch }) {
  const { user } = useContext(AuthContext);
  const [dutyStatus, setDutyStatus] = useState(() => localStorage.getItem('rms_duty_status') || 'active');
  const [dutyOpen, setDutyOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    localStorage.setItem('rms_duty_status', dutyStatus);
  }, [dutyStatus]);

  const handleSearch = useCallback((e) => {
    e.preventDefault();
    if (searchQuery.trim() && onSearch) onSearch(searchQuery.trim());
  }, [searchQuery, onSearch]);

  const displayName = (profile?.username || user?.username || user?.name || 'Employee')
    .replace(/\./g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
  const jobCategory = profile?.jobCategory || '';
  const employeeId = profile?._id?.slice(-6)?.toUpperCase() || 'N/A';
  const currentDuty = DUTY_STATES.find(d => d.key === dutyStatus) || DUTY_STATES[0];
  const DutyIcon = currentDuty.icon;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden" id="employee-header">
      {/* Gradient strip */}
      <div className="h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />

      <div className="p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left — Identity */}
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-blue-200">
                {(profile?.username || user?.username || 'E').charAt(0).toUpperCase()}
              </div>
              {/* Duty dot */}
              <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white ${currentDuty.color}`} />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gray-900">{displayName}</h2>
                <span className="px-2.5 py-0.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider">
                  {jobCategory || user?.role?.replace('-', ' ') || 'Staff'}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <Hash className="w-3 h-3" />EMP-{employeeId}
                </span>
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <Shield className="w-3 h-3" />{user?.role?.replace('-', ' ') || 'employee'}
                </span>
              </div>
            </div>
          </div>

          {/* Center — Session Stats */}
          <div className="flex items-center gap-3 flex-wrap">
            {[
              { icon: CheckCircle, label: 'Completed', value: stats?.completed ?? 0, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
              { icon: Activity, label: 'In Progress', value: stats?.inProgress ?? 0, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
              { icon: AlertTriangle, label: 'Pending', value: stats?.pending ?? 0, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
              { icon: Clock, label: 'Avg Time', value: stats?.avgTime ?? '—', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200', isText: true },
            ].map((s, i) => (
              <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${s.border} ${s.bg}`}>
                <s.icon className={`w-4 h-4 ${s.color}`} />
                <div>
                  <p className={`text-sm font-bold ${s.color} tabular-nums leading-none`}>{s.value}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Right — Duty Toggle */}
          <div className="relative">
            <button
              onClick={() => setDutyOpen(!dutyOpen)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border font-semibold text-sm transition-all ${currentDuty.bg} ${currentDuty.text} border-current/20 hover:shadow-md`}
            >
              <DutyIcon className="w-4 h-4" />
              {currentDuty.label}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${dutyOpen ? 'rotate-180' : ''}`} />
            </button>
            {dutyOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setDutyOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-xl shadow-xl border border-gray-200 z-40 overflow-hidden">
                  {DUTY_STATES.map(d => {
                    const Icon = d.icon;
                    return (
                      <button
                        key={d.key}
                        onClick={() => { setDutyStatus(d.key); setDutyOpen(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium hover:bg-gray-50 transition-colors ${
                          dutyStatus === d.key ? `${d.bg} ${d.text}` : 'text-gray-700'
                        }`}
                      >
                        <div className={`w-2.5 h-2.5 rounded-full ${d.color}`} />
                        <Icon className="w-4 h-4" />
                        {d.label}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Global Search */}
        <form onSubmit={handleSearch} className="mt-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search resident by Name, Phone, or National ID..."
              className="w-full pl-11 pr-28 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
              id="global-resident-search"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              Search
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
