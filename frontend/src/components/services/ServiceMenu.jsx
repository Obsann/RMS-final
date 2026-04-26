import React from 'react';
import {
  IdCard, UserPlus, RefreshCw, Award, Baby, Heart, FileText,
  Shield, Building2, Briefcase, Calendar, MessageCircle, AlertTriangle,
  ChevronRight,
} from 'lucide-react';

import { SERVICE_GROUPS } from './serviceConfig';

// Icon lookup map
const ICONS = {
  IdCard, UserPlus, RefreshCw, Award, Baby, Heart, FileText,
  Shield, Building2, Briefcase, Calendar, MessageCircle, AlertTriangle,
};

// Accent colors for each group
const GROUP_COLORS = {
  identity: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-600', badge: 'bg-blue-100 text-blue-700' },
  certificates: { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700' },
  permits: { bg: 'bg-violet-50', border: 'border-violet-200', icon: 'text-violet-600', badge: 'bg-violet-100 text-violet-700' },
  feedback: { bg: 'bg-orange-50', border: 'border-orange-200', icon: 'text-orange-600', badge: 'bg-orange-100 text-orange-700' },
};

export default function ServiceMenu({ selectedServiceId, onSelectService }) {
  return (
    <div className="space-y-8">
      {SERVICE_GROUPS.map((group) => {
        const colors = GROUP_COLORS[group.id] || GROUP_COLORS.identity;
        const GroupIcon = ICONS[group.icon] || FileText;

        return (
          <div key={group.id}>
            {/* Group Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-xl ${colors.bg} ${colors.border} border flex items-center justify-center`}>
                <GroupIcon className={`w-5 h-5 ${colors.icon}`} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">{group.label}</h3>
                <p className="text-xs text-gray-500">{group.description}</p>
              </div>
            </div>

            {/* Service Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {group.services.map((service) => {
                const ServiceIcon = ICONS[service.icon] || FileText;
                const isSelected = selectedServiceId === service.id;

                return (
                  <button
                    key={service.id}
                    id={`service-card-${service.id}`}
                    onClick={() => onSelectService(service.id)}
                    className={`
                      group relative text-left p-4 rounded-xl border transition-all duration-200
                      ${isSelected
                        ? 'bg-blue-50 border-blue-300 shadow-md shadow-blue-100 ring-2 ring-blue-200'
                        : 'bg-white border-gray-200 shadow-sm hover:shadow-md hover:border-blue-200 hover:bg-blue-50/30'
                      }
                    `}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`
                        w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors
                        ${isSelected
                          ? 'bg-blue-600 text-white'
                          : `${colors.bg} ${colors.icon} group-hover:bg-blue-600 group-hover:text-white`
                        }
                      `}>
                        <ServiceIcon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold mb-0.5 ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                          {service.label}
                        </p>
                        <p className="text-xs text-gray-500 line-clamp-2">{service.description}</p>
                      </div>
                      <ChevronRight className={`
                        w-4 h-4 mt-0.5 flex-shrink-0 transition-all duration-200
                        ${isSelected ? 'text-blue-600 translate-x-0' : 'text-gray-300 -translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100'}
                      `} />
                    </div>

                    {/* Selected indicator */}
                    {isSelected && (
                      <div className="absolute left-0 top-3 bottom-3 w-1 bg-blue-600 rounded-r-full" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
