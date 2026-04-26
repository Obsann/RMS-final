import React, { useState, useMemo } from 'react';
import {
  Clock, Search, Filter, Users, AlertTriangle, Flame,
  ChevronRight, Loader2, RefreshCw, User,
} from 'lucide-react';

const PRIORITY_CONFIG = {
  urgent: { dot: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', ring: 'ring-red-200' },
  high:   { dot: 'bg-orange-500', text: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200', ring: 'ring-orange-200' },
  medium: { dot: 'bg-yellow-500', text: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200', ring: 'ring-yellow-200' },
  low:    { dot: 'bg-green-500', text: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200', ring: 'ring-green-200' },
};

function getWaitingTime(createdAt) {
  if (!createdAt) return '—';
  const diffMs = Date.now() - new Date(createdAt).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ${mins % 60}m`;
  return `${Math.floor(hrs / 24)}d`;
}

const QueueCard = React.memo(function QueueCard({ item, isActive, onClick }) {
  const priority = item.priority || 'medium';
  const pcfg = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium;
  const residentName = item.user?.username || item.resident?.username || 'Unknown Resident';
  const initial = (residentName.charAt(0) || 'R').toUpperCase();

  return (
    <button
      onClick={() => onClick(item)}
      className={`
        w-full text-left p-3.5 rounded-xl border-2 transition-all duration-200 group
        ${isActive
          ? 'border-blue-500 bg-blue-50/80 shadow-md shadow-blue-100'
          : 'border-transparent bg-white hover:bg-gray-50 hover:border-gray-200 hover:shadow-sm'
        }
      `}
      id={`queue-card-${item._id}`}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="relative shrink-0">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
            isActive ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
          }`}>
            {initial}
          </div>
          {/* Priority dot */}
          <div className={`absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${pcfg.dot}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <p className={`text-sm font-semibold truncate ${isActive ? 'text-blue-900' : 'text-gray-900'}`}>
              {residentName}
            </p>
            <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform ${
              isActive ? 'text-blue-500 translate-x-0' : 'text-gray-300 group-hover:translate-x-0.5'
            }`} />
          </div>

          {/* Service type badge */}
          <div className="flex items-center gap-1.5 mt-1">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border ${pcfg.bg} ${pcfg.text} ${pcfg.border}`}>
              {item.category || item.type || 'Service'}
            </span>
            {item.subject && (
              <span className="text-[10px] text-gray-400 truncate max-w-[100px]" title={item.subject}>
                {item.subject}
              </span>
            )}
          </div>

          {/* Time + Priority */}
          <div className="flex items-center justify-between mt-2">
            <span className="flex items-center gap-1 text-[10px] text-gray-400">
              <Clock className="w-3 h-3" />
              {getWaitingTime(item.createdAt)} ago
            </span>
            <span className={`flex items-center gap-1 text-[10px] font-bold uppercase ${pcfg.text}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${pcfg.dot}`} />
              {priority}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
});

export default function ResidentQueue({ items = [], loading, selectedId, onSelect, onRefresh }) {
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');

  const filtered = useMemo(() => {
    let list = items;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(item =>
        (item.user?.username || item.resident?.username || '').toLowerCase().includes(q) ||
        (item.subject || '').toLowerCase().includes(q) ||
        (item.category || '').toLowerCase().includes(q) ||
        (item.user?.phone || '').includes(q) ||
        (item.idNumber || '').toLowerCase().includes(q)
      );
    }
    if (priorityFilter !== 'all') {
      list = list.filter(item => (item.priority || 'medium') === priorityFilter);
    }
    // Sort: urgent first, then by creation date
    const pOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    return [...list].sort((a, b) => {
      const pa = pOrder[a.priority || 'medium'] ?? 2;
      const pb = pOrder[b.priority || 'medium'] ?? 2;
      if (pa !== pb) return pa - pb;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }, [items, search, priorityFilter]);

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden" id="resident-queue">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <Users className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Queue</h3>
              <p className="text-[10px] text-gray-500">{filtered.length} waiting</p>
            </div>
          </div>
          <button onClick={onRefresh} className="p-1.5 hover:bg-white rounded-lg text-gray-400 hover:text-blue-600 transition-colors" title="Refresh">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="px-3 py-2.5 border-b border-gray-100 space-y-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search queue..."
            className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-1">
          {['all', 'urgent', 'high', 'medium', 'low'].map(p => {
            const active = priorityFilter === p;
            return (
              <button
                key={p}
                onClick={() => setPriorityFilter(p)}
                className={`px-2 py-1 rounded-md text-[10px] font-semibold capitalize transition-colors ${
                  active ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>
      </div>

      {/* Queue List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5" style={{ maxHeight: 'calc(100vh - 380px)' }}>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
            <span className="ml-2 text-xs text-gray-400">Loading queue...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-400">Queue is empty</p>
            <p className="text-xs text-gray-300 mt-1">No residents waiting</p>
          </div>
        ) : (
          filtered.map(item => (
            <QueueCard
              key={item._id}
              item={item}
              isActive={selectedId === item._id}
              onClick={onSelect}
            />
          ))
        )}
      </div>

      {/* Footer stats */}
      <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50">
        <div className="flex items-center justify-between text-[10px] text-gray-500">
          <span className="flex items-center gap-1">
            <Flame className="w-3 h-3 text-red-500" />
            {items.filter(i => i.priority === 'urgent' || i.priority === 'high').length} urgent
          </span>
          <span>{items.length} total</span>
        </div>
      </div>
    </div>
  );
}
