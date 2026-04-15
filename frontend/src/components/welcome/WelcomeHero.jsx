import { useNavigate } from 'react-router-dom';
import { User, Home, ShieldCheck, Users } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { useLanguage } from '../../contexts/LanguageContext';

export default function WelcomeHero() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <section className="flex flex-wrap flex-1">

      {/* ── Left: headline ── */}
      <div
        className="welcome-anim-left flex-1 bg-blue-50 flex flex-col justify-center relative overflow-hidden"
        style={{ minWidth: 340, padding: 'clamp(40px,7vw,96px) clamp(24px,5vw,72px)', minHeight: 480 }}
      >
        {/* Decorative blobs */}
        <div className="absolute -top-16 -right-16 w-52 h-52 rounded-full bg-blue-100 opacity-60 pointer-events-none" />
        <div className="absolute bottom-5 -left-10 w-36 h-36 rounded-full bg-blue-100 opacity-40 pointer-events-none" />

        {/* Geometric background pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <svg width="100%" height="100%" viewBox="0 0 800 600" fill="none">
            <path d="M0 0L400 300L0 600V0Z" fill="url(#gh1)" />
            <path d="M800 0L400 300L800 600V0Z" fill="url(#gh2)" />
            <defs>
              <linearGradient id="gh1" x1="0" y1="0" x2="400" y2="300" gradientUnits="userSpaceOnUse">
                <stop stopColor="#1e3a8a" /><stop offset="1" stopColor="#1e3a8a" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="gh2" x1="800" y1="0" x2="400" y2="300" gradientUnits="userSpaceOnUse">
                <stop stopColor="#1e3a8a" /><stop offset="1" stopColor="#1e3a8a" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div className="relative z-10 max-w-xl">
          <div className="w-14 h-1.5 bg-blue-600 rounded-full mb-6" />
          <h1
            className="font-black text-blue-900 leading-tight mb-5"
            style={{ fontSize: 'clamp(36px,5.5vw,64px)', letterSpacing: '-1.5px' }}
          >
            {t('welcomeTitle') || 'Empowering\nModern Living'}
          </h1>
          <p className="text-gray-500 leading-relaxed mb-8 max-w-md" style={{ fontSize: 17 }}>
            {t('welcomeSubtitle') || 'Streamline your resident operations with our efficient and comprehensive resident management solution.'}
          </p>

          {/* Trust badges */}
          <div className="flex gap-3 flex-wrap">
            {[
              { icon: ShieldCheck, label: 'Secure & Verified' },
              { icon: Users,       label: 'Multi-role Access' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 bg-white border border-blue-100 rounded-full px-4 py-1.5 shadow-sm">
                <Icon size={13} className="text-blue-600" />
                <span className="text-xs font-semibold text-blue-900">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right: building image + action cards ── */}
      <div className="flex-1 relative" style={{ minWidth: 340, minHeight: 480 }}>
        <img
          src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=1200"
          alt="Modern Apartment Building"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-blue-900/50" />

        <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 p-6">

          {/* Login card */}
          <div className="welcome-anim-1 welcome-card-hover w-full max-w-sm">
            <Card className="border-none text-white backdrop-blur-sm overflow-hidden shadow-2xl" style={{ background: 'rgba(37,99,235,0.88)' }}>
              <CardContent className="p-7 flex items-center gap-5">
                <div className="w-12 h-12 rounded-full bg-white/20 flex-shrink-0 flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-lg mb-4">Login to Your Account</p>
                  <Button
                    onClick={() => navigate('/login')}
                    variant="secondary"
                    className="bg-white text-blue-900 hover:bg-gray-100 font-bold px-6"
                  >
                    {t('loginButton') || 'Login'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Register card */}
          <div className="welcome-anim-2 welcome-card-hover w-full max-w-sm">
            <Card className="border border-blue-100 text-blue-900 overflow-hidden shadow-2xl bg-white">
              <CardContent className="p-7 flex items-center gap-5">
                <div className="w-12 h-12 rounded-full bg-blue-50 flex-shrink-0 flex items-center justify-center">
                  <Home className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-lg mb-4">Register as Resident</p>
                  <Button
                    onClick={() => navigate('/register')}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6"
                  >
                    {t('registerButton') || 'Register'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </section>
  );
}
