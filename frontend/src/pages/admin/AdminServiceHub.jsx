import React from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import {
  IdCard, MessageSquare,
  GitBranch, Building2,
  ChevronRight, Home, Sparkles, ArrowRight, Activity, Shield
} from 'lucide-react';

const ADMIN_SERVICE_CARDS = [
  {
    id: 'pipeline',
    label: 'Service Pipeline',
    description: 'Manage and monitor all active service workflows, task distributions, and employee job assignments.',
    icon: GitBranch,
    gradient: 'from-blue-600 to-cyan-500',
    path: '/admin/service-pipeline',
    tag: 'Workflow Monitor',
  },
  {
    id: 'digitalid',
    label: 'Digital ID System',
    description: 'Review, approve, and securely issue Kebele Digital IDs and biometric profiles for residents.',
    icon: IdCard,
    gradient: 'from-emerald-600 to-teal-500',
    path: '/admin/digital-id',
    tag: 'ID Management',
  },
  {
    id: 'requests',
    label: 'Requests & Complaints',
    description: 'Handle escalated requests, critical community feedback, and severe complaints from residents.',
    icon: MessageSquare,
    gradient: 'from-orange-500 to-red-500',
    path: '/admin/requests',
    tag: 'Resolution Center',
  }
];

export default function AdminServiceHub() {
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-gray-500">
          <Home className="w-3.5 h-3.5" />
          <button onClick={() => navigate('/admin/dashboard')} className="hover:text-blue-600 transition-colors">
            Home
          </button>
          <ChevronRight className="w-3 h-3" />
          <span className="text-blue-600 font-medium">Services & Operations</span>
        </nav>

        {/* Hero Banner */}
        <div className="bg-gradient-to-r from-slate-800 via-indigo-900 to-slate-900 text-white rounded-2xl p-8 relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-1/3 w-32 h-32 bg-white/5 rounded-full translate-y-1/2" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/20">
                <Shield className="w-5 h-5 text-indigo-300" />
              </div>
              <div className="px-3 py-1 bg-white/10 border border-white/20 rounded-full text-xs font-medium backdrop-blur-sm flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-300" />
                Admin Central
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Operations Hub</h1>
            <p className="text-indigo-200 max-w-xl text-sm leading-relaxed">
              Centralized command center for managing digital identities, overseeing service workflows, and resolving escalated resident complaints.
            </p>
          </div>
        </div>

        {/* Quick Info */}
        <div className="flex items-center gap-3 p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-indigo-900">System Activity Overview</p>
            <p className="text-xs text-indigo-700">Select an operational module below to manage and oversee specific administrative functions.</p>
          </div>
        </div>

        {/* Category Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {ADMIN_SERVICE_CARDS.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => navigate(cat.path)}
                className="group relative text-left rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
              >
                {/* Gradient background */}
                <div className={`bg-gradient-to-br ${cat.gradient} p-6 h-full flex flex-col`}>
                  {/* Decorative circle */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/3 translate-x-1/3 group-hover:scale-125 transition-transform duration-700" />

                  <div className="relative z-10 flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md group-hover:scale-110 transition-transform duration-300 border border-white/20 shadow-inner">
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <span className="px-3 py-1 bg-white/10 border border-white/20 rounded-full text-[10px] font-bold text-white uppercase tracking-wider backdrop-blur-md">
                        {cat.tag}
                      </span>
                    </div>
                    
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-white transition-colors">{cat.label}</h3>
                    <p className="text-sm text-white/80 mb-6 leading-relaxed group-hover:text-white/90 transition-colors">
                      {cat.description}
                    </p>
                  </div>

                  <div className="relative z-10 mt-auto pt-4 border-t border-white/20">
                    <div className="flex items-center justify-between text-white font-medium group-hover:text-white transition-colors">
                      <span className="text-sm">Manage Module</span>
                      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white group-hover:text-gray-900 transition-all duration-300">
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
