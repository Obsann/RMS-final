import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import IssuedDocument from '../../components/services/IssuedDocument';
import { getRequests } from '../../utils/api';
import { toast } from 'sonner';
import {
  Award, Shield, Home, ChevronRight, Loader2,
  FileText, RefreshCw, Search, Filter, Download,
} from 'lucide-react';

const TABS = [
  { key: 'all', label: 'All Documents', icon: FileText },
  { key: 'certificates', label: 'Certificates', icon: Award },
  { key: 'permits', label: 'Permits', icon: Shield },
];

export default function MyDocuments() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const fetchData = useCallback(async (showToast = false) => {
    try {
      if (showToast) setRefreshing(true);
      else setLoading(true);
      const data = await getRequests('status=completed');
      // Only keep requests with issued documents
      const issued = (data.requests || []).filter(r => r.issuedDocument?.documentNumber);
      setRequests(issued);
      if (showToast) toast.success('Documents refreshed');
    } catch {
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = useMemo(() => {
    return requests.filter(r => {
      const doc = r.issuedDocument;
      const matchesTab =
        activeTab === 'all' ||
        (activeTab === 'certificates' && r.type === 'certificate') ||
        (activeTab === 'permits' && r.type === 'permit');
      const matchesSearch =
        !searchTerm ||
        (doc.documentNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (doc.documentType || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.subject || '').toLowerCase().includes(searchTerm.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [requests, activeTab, searchTerm]);

  const stats = useMemo(() => ({
    total: requests.length,
    certificates: requests.filter(r => r.type === 'certificate').length,
    permits: requests.filter(r => r.type === 'permit').length,
  }), [requests]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-gray-500">
          <Home className="w-3.5 h-3.5" />
          <span>Home</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-blue-600 font-medium">My Documents</span>
        </nav>

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Documents</h1>
            <p className="text-gray-600 mt-1">All your issued certificates and permits in one place</p>
          </div>
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Documents', value: stats.total, icon: FileText, color: 'text-gray-600', bg: 'bg-gray-50' },
            { label: 'Certificates', value: stats.certificates, icon: Award, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Permits', value: stats.permits, icon: Shield, color: 'text-violet-600', bg: 'bg-violet-50' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 ${stat.bg} rounded-lg flex items-center justify-center`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">{stat.label}</p>
                  <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs + Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row gap-3">
            {/* Tabs */}
            <div className="flex gap-1.5">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    activeTab === tab.key
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by document number, type, or subject..."
                className="w-full pl-11 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
              />
            </div>
          </div>

          {/* Document List */}
          <div className="p-4">
            {loading ? (
              <div className="p-12 text-center">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
                <p className="text-gray-500">Loading your documents...</p>
              </div>
            ) : filtered.length > 0 ? (
              <div className="space-y-4">
                {filtered.map((req) => {
                  const doc = req.issuedDocument;
                  const isExpanded = expandedId === req._id;
                  const isCert = req.type === 'certificate';

                  return (
                    <div key={req._id} className="border border-gray-200 rounded-xl overflow-hidden">
                      {/* Compact header */}
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : req._id)}
                        className="w-full text-left"
                      >
                        <IssuedDocument issuedDocument={doc} compact />
                      </button>

                      {/* Expanded view */}
                      {isExpanded && (
                        <div className="p-6 border-t border-gray-100 bg-gray-50/50">
                          <IssuedDocument issuedDocument={doc} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">No documents found</h3>
                <p className="text-gray-500 mb-6">
                  {searchTerm || activeTab !== 'all'
                    ? 'Try adjusting your filters.'
                    : 'You don\'t have any issued certificates or permits yet.'}
                </p>
                <button
                  onClick={() => navigate('/resident/services')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
                >
                  <Award className="w-4 h-4" />
                  Request a Certificate or Permit
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
