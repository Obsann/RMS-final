import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Users, Briefcase, Home, Globe } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export default function Welcome() {
  const navigate = useNavigate();
  const { t, toggleLanguage } = useLanguage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      {/* Top bar with language toggle */}
      <div className="flex justify-end px-6 pt-4">
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-blue-300 bg-white text-blue-700 hover:bg-blue-50 transition-colors shadow-sm"
        >
          <Globe className="w-4 h-4" />
          <span>{t('switchLanguage')}</span>
        </button>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-6">
              <Building2 className="w-16 h-16 text-blue-600" />
            </div>
            <h1 className="text-blue-800">{t('welcomeTitle')}</h1>
            <p className="text-gray-600 mt-4">{t('welcomeSubtitle')}</p>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <Users className="w-12 h-12 text-blue-600 mb-4" />
              <h3 className="mb-2">{t('residentMgmt')}</h3>
              <p className="text-gray-600">{t('residentMgmtDesc')}</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <Briefcase className="w-12 h-12 text-blue-600 mb-4" />
              <h3 className="mb-2">{t('taskTracking')}</h3>
              <p className="text-gray-600">{t('taskTrackingDesc')}</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <Home className="w-12 h-12 text-blue-600 mb-4" />
              <h3 className="mb-2">{t('requestSystem')}</h3>
              <p className="text-gray-600">{t('requestSystemDesc')}</p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-center mb-8">{t('getStarted')}</h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/login')}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {t('loginButton')}
              </button>
              <button
                onClick={() => navigate('/register')}
                className="px-8 py-3 bg-white text-blue-600 border-2 border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
              >
                {t('registerButton')}
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-12 text-gray-600">
            <p>&copy; 2026 Property Management System. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
