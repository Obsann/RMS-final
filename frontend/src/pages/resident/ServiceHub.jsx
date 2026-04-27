import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import ServiceForm from '../../components/services/ServiceForm';
import { getServiceById, SERVICE_GROUPS } from '../../components/services/serviceConfig';
import {
  IdCard, Award, Shield, MessageCircle,
  ChevronRight, Home, Sparkles, ArrowRight, ArrowLeft,
  UserPlus, RefreshCw, Baby, Heart, FileText,
  Building2, Briefcase, Calendar, AlertTriangle, Lock
} from 'lucide-react';
import { toast } from 'sonner';

// Icon lookup
const ICONS = {
  IdCard, UserPlus, RefreshCw, Award, Baby, Heart, FileText,
  Shield, Building2, Briefcase, Calendar, MessageCircle, AlertTriangle,
};

// Category card styling
const CATEGORY_CARDS = [
  {
    groupId: 'identity',
    label: 'Identity & Registration',
    description: 'Apply for a new ID or renew an existing one',
    icon: IdCard,
    gradient: 'from-blue-600 to-cyan-500',
    bgLight: 'bg-blue-50',
    borderLight: 'border-blue-200',
    textColor: 'text-blue-700',
  },
  {
    groupId: 'certificates',
    label: 'Certificates',
    description: 'Birth, marriage, and death certificates',
    icon: Award,
    gradient: 'from-emerald-600 to-teal-500',
    bgLight: 'bg-emerald-50',
    borderLight: 'border-emerald-200',
    textColor: 'text-emerald-700',
  },
  {
    groupId: 'permits',
    label: 'Permits',
    description: 'Construction, business, and event permits',
    icon: Shield,
    gradient: 'from-violet-600 to-purple-500',
    bgLight: 'bg-violet-50',
    borderLight: 'border-violet-200',
    textColor: 'text-violet-700',
  },
  {
    groupId: 'feedback',
    label: 'Feedback & Support',
    description: 'Complaints and community feedback',
    icon: MessageCircle,
    gradient: 'from-orange-500 to-red-500',
    bgLight: 'bg-orange-50',
    borderLight: 'border-orange-200',
    textColor: 'text-orange-700',
  },
];

export default function ServiceHub() {
  const navigate = useNavigate();
  const [activeGroupId, setActiveGroupId] = useState(null);
  const [selectedServiceId, setSelectedServiceId] = useState(null);
  const [digitalIdStatus, setDigitalIdStatus] = useState(null);
  const servicesRef = useRef(null);
  const formRef = useRef(null);

  useEffect(() => {
    const checkDigitalId = async () => {
      try {
        const { getMyDigitalId } = await import('../../utils/api');
        const idData = await getMyDigitalId();
        if (idData && idData.status !== 'none') {
          setDigitalIdStatus(idData.status);
        }
      } catch (e) {
        // Ignored
      }
    };
    checkDigitalId();
  }, []);

  const selectedService = selectedServiceId ? getServiceById(selectedServiceId) : null;
  const activeGroup = activeGroupId ? SERVICE_GROUPS.find(g => g.id === activeGroupId) : null;
  const activeCategoryCard = activeGroupId ? CATEGORY_CARDS.find(c => c.groupId === activeGroupId) : null;
  const hasExistingDigitalIdRecord = !!digitalIdStatus && digitalIdStatus !== 'none';
  const digitalIdStatusLabel = (digitalIdStatus || '').replace(/_/g, ' ');

  // Scroll to services list when a category is selected
  useEffect(() => {
    if (activeGroupId && servicesRef.current) {
      setTimeout(() => {
        servicesRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [activeGroupId]);

  // Scroll to form when a service is selected
  useEffect(() => {
    if (selectedServiceId && formRef.current) {
      setTimeout(() => {
        formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [selectedServiceId]);

  const handleCategoryClick = (groupId) => {
    setActiveGroupId(groupId);
    setSelectedServiceId(null);
  };

  const handleBack = () => {
    if (selectedServiceId) {
      setSelectedServiceId(null);
    } else {
      setActiveGroupId(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-gray-500">
          <Home className="w-3.5 h-3.5" />
          <button onClick={() => { setActiveGroupId(null); setSelectedServiceId(null); }} className="hover:text-blue-600 transition-colors">
            Home
          </button>
          <ChevronRight className="w-3 h-3" />
          <button
            onClick={() => { setActiveGroupId(null); setSelectedServiceId(null); }}
            className={`hover:text-blue-600 transition-colors ${!activeGroupId ? 'text-blue-600 font-medium' : ''}`}
          >
            Services
          </button>
          {activeCategoryCard && (
            <>
              <ChevronRight className="w-3 h-3" />
              <button
                onClick={() => setSelectedServiceId(null)}
                className={`hover:text-blue-600 transition-colors ${!selectedServiceId ? 'text-blue-600 font-medium' : ''}`}
              >
                {activeCategoryCard.label}
              </button>
            </>
          )}
          {selectedService && (
            <>
              <ChevronRight className="w-3 h-3" />
              <span className="text-blue-600 font-medium">{selectedService.label}</span>
            </>
          )}
        </nav>

        {/* Hero Banner */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white rounded-2xl p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-1/3 w-32 h-32 bg-white/5 rounded-full translate-y-1/2" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Briefcase className="w-5 h-5" />
              </div>
              <div className="px-3 py-1 bg-white/15 rounded-full text-xs font-medium backdrop-blur-sm flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Government Services Portal
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Service Hub</h1>
            <p className="text-blue-100 max-w-xl">
              Request government services, certificates, and permits — all in one place.
              Your submissions are instantly assigned to the right department.
            </p>
          </div>
        </div>

        {/* Quick Link to My Requests */}
        <button
          onClick={() => navigate('/resident/my-requests')}
          className="w-full flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-200 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-amber-600" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-gray-900">Track Your Requests</p>
              <p className="text-xs text-gray-500">View the status of all your submitted service requests</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
        </button>

        {/* ───────────── LEVEL 1: Category Cards ───────────── */}
        {!activeGroupId && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {CATEGORY_CARDS.map((cat) => {
              const group = SERVICE_GROUPS.find(g => g.id === cat.groupId);
              const serviceCount = group?.services.length || 0;
              const Icon = cat.icon;

              return (
                <button
                  key={cat.groupId}
                  onClick={() => handleCategoryClick(cat.groupId)}
                  className="group relative text-left rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                >
                  {/* Gradient background */}
                  <div className={`bg-gradient-to-br ${cat.gradient} p-6 h-full`}>
                    {/* Decorative circle */}
                    <div className="absolute top-0 right-0 w-28 h-28 bg-white/10 rounded-full -translate-y-1/3 translate-x-1/3 group-hover:scale-125 transition-transform duration-500" />

                    <div className="relative z-10">
                      <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-sm group-hover:scale-110 transition-transform duration-300">
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-white mb-1">{cat.label}</h3>
                      <p className="text-sm text-white/80 mb-4">{cat.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-white/60 bg-white/10 px-3 py-1 rounded-full">
                          {serviceCount} service{serviceCount !== 1 ? 's' : ''}
                        </span>
                        <div className="flex items-center gap-1 text-white/80 text-sm font-medium group-hover:text-white transition-colors">
                          Explore
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* ───────────── LEVEL 2: Services within a Category ───────────── */}
        {activeGroupId && !selectedServiceId && activeGroup && (
          <div ref={servicesRef} className="space-y-4">
            {/* Back button + Category header */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className={`w-10 h-10 rounded-xl ${activeCategoryCard.bgLight} ${activeCategoryCard.borderLight} border flex items-center justify-center`}>
                <activeCategoryCard.icon className={`w-5 h-5 ${activeCategoryCard.textColor}`} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">{activeCategoryCard.label}</h2>
                <p className="text-sm text-gray-500">{activeCategoryCard.description}</p>
              </div>
            </div>

            {activeGroupId === 'identity' && hasExistingDigitalIdRecord && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                  <Lock className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-amber-900">New ID Application is read-only</p>
                  <p className="text-sm text-amber-800 mt-1">
                    Your Digital ID record is already on file with a <span className="capitalize font-medium">{digitalIdStatusLabel}</span> status.
                    Use <strong>ID Renewal</strong> for replacements or updates, or open Digital ID under your profile to review the current application.
                  </p>
                </div>
              </div>
            )}

            {/* Service cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeGroup.services.map((service) => {
                const ServiceIcon = ICONS[service.icon] || FileText;
                const isNewIdLocked = service.id === 'new_id_application' && hasExistingDigitalIdRecord;

                return (
                  <button
                    key={service.id}
                    onClick={() => {
                      if (isNewIdLocked) {
                        toast.info('You already have a Digital ID application on file. For updates or replacements, use ID Renewal or check Digital ID under your profile.', { duration: 5000 });
                        return;
                      }
                      setSelectedServiceId(service.id);
                    }}
                    className={`group text-left p-5 rounded-xl border transition-all duration-200 ${
                      isNewIdLocked 
                        ? 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-75' 
                        : 'bg-white border-gray-200 shadow-sm hover:shadow-md hover:border-blue-200 hover:bg-blue-50/30'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                        isNewIdLocked 
                          ? 'bg-gray-100 text-gray-400' 
                          : `${activeCategoryCard.bgLight} group-hover:bg-blue-600 group-hover:text-white`
                      }`}>
                        {isNewIdLocked ? (
                           <Lock className="w-6 h-6" />
                        ) : (
                           <ServiceIcon className={`w-6 h-6 ${activeCategoryCard.textColor} group-hover:text-white transition-colors`} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold mb-1 ${isNewIdLocked ? 'text-gray-500' : 'text-gray-900'}`}>{service.label}</p>
                        <p className="text-xs text-gray-500 line-clamp-2">{isNewIdLocked ? 'Application already submitted. Please use ID Renewal instead.' : service.description}</p>
                        {!isNewIdLocked && (
                          <div className="flex items-center gap-1 mt-3 text-xs font-medium text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                            Start Application <ArrowRight className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ───────────── LEVEL 3: Dynamic Form ───────────── */}
        {selectedServiceId && (
          <div ref={formRef}>
            <ServiceForm
              serviceId={selectedServiceId}
              onBack={handleBack}
              onSuccess={() => navigate('/resident/my-requests')}
            />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
