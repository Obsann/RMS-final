import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, ClipboardList, Home, User, Globe, ShieldCheck, ChevronDown } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

/* ─── Site palette (matches the rest of the platform) ─── */
const BLUE       = '#2563eb';   // blue-600
const BLUE_DARK  = '#1d4ed8';   // blue-700
const BLUE_DEEP  = '#1e3a8a';   // blue-900
const BLUE_BG    = '#eff6ff';   // blue-50
const BLUE_BG2   = '#dbeafe';   // blue-100

/* ─── CSS animations injected once ─────────────────────── */
const ANIM_STYLE = `
  @keyframes wFadeInLeft { from { opacity:0; transform:translateX(-28px); } to { opacity:1; transform:none; } }
  @keyframes wFadeInUp   { from { opacity:0; transform:translateY(24px);  } to { opacity:1; transform:none; } }
  .w-anim-left { animation: wFadeInLeft 0.6s ease both; }
  .w-anim-1    { animation: wFadeInUp   0.6s 0.12s ease both; }
  .w-anim-2    { animation: wFadeInUp   0.6s 0.26s ease both; }
  .w-anim-3    { animation: wFadeInUp   0.6s 0.08s ease both; }
  .w-anim-4    { animation: wFadeInUp   0.6s 0.18s ease both; }
  .w-anim-5    { animation: wFadeInUp   0.6s 0.28s ease both; }
  .w-card-hover { transition: transform 0.2s ease, box-shadow 0.2s ease; cursor: pointer; }
  .w-card-hover:hover { transform: translateY(-4px); box-shadow: 0 20px 40px rgba(37,99,235,0.18) !important; }
  .w-btn:hover { filter: brightness(1.08); transform: translateY(-1px); }
  .w-btn { transition: filter 0.15s, transform 0.15s; }
  .w-lang:hover { background: rgba(255,255,255,0.15) !important; }
`;

const FEATURES = [
  { icon: Users,        title: 'Resident Management',       desc: 'Manage residents, dependants, digital IDs, and household records in one place.',               anim: 'w-anim-3' },
  { icon: ClipboardList,title: 'Task & Job Tracking',        desc: 'Track administrative tasks and employee assignments in real-time across departments.',          anim: 'w-anim-4' },
  { icon: Home,         title: 'Request & Complaint System', desc: 'Handle resident requests, complaints, and certificate applications seamlessly.',               anim: 'w-anim-5' },
];

export default function Welcome() {
  const navigate = useNavigate();
  const { t, lang, toggleLanguage } = useLanguage();
  const [showLangMenu, setShowLangMenu] = useState(false);

  useEffect(() => {
    if (!document.getElementById('w-anim-css')) {
      const el = document.createElement('style');
      el.id = 'w-anim-css';
      el.textContent = ANIM_STYLE;
      document.head.appendChild(el);
    }
  }, []);

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: BLUE_BG, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* ══ NAVBAR ═════════════════════════════════════ */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '13px 28px', background: '#fff',
        borderBottom: `1px solid ${BLUE_BG2}`,
        position: 'sticky', top: 0, zIndex: 50,
        boxShadow: '0 1px 6px rgba(37,99,235,0.07)',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 40, height: 40, background: BLUE, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(37,99,235,0.3)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 22, height: 22 }}>
              <path d="M3 21h18" /><path d="M3 7v1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7H3l2-4h14l2 4" />
              <path d="M5 21V10.85" /><path d="M19 21V10.85" /><path d="M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4" />
            </svg>
          </div>
          <div style={{ lineHeight: 1.15 }}>
            {['Resident', 'Management', 'System'].map(w => (
              <div key={w} style={{ fontWeight: 800, fontSize: 14, color: BLUE_DEEP, letterSpacing: '-0.2px' }}>{w}</div>
            ))}
          </div>
        </div>

        {/* Language */}
        <div style={{ position: 'relative' }}>
          <button className="w-lang" onClick={() => setShowLangMenu(v => !v)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', borderRadius: 8,
            background: BLUE, color: '#fff', border: 'none',
            fontWeight: 600, fontSize: 13, cursor: 'pointer',
          }}>
            <Globe size={14} /><span>{lang === 'en' ? 'English' : 'አማርኛ'}</span><ChevronDown size={13} />
          </button>
          {showLangMenu && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setShowLangMenu(false)} />
              <div style={{
                position: 'absolute', right: 0, top: 42, zIndex: 50,
                background: '#fff', border: `1px solid ${BLUE_BG2}`, borderRadius: 10,
                boxShadow: '0 8px 20px rgba(37,99,235,0.12)', minWidth: 130, overflow: 'hidden',
              }}>
                {[{ code: 'en', label: 'English' }, { code: 'am', label: 'አማርኛ' }].map(l => (
                  <button key={l.code}
                    onClick={() => { if (lang !== l.code) toggleLanguage(); setShowLangMenu(false); }}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left',
                      padding: '10px 16px', border: 'none', cursor: 'pointer',
                      background: lang === l.code ? BLUE_BG : 'transparent',
                      fontWeight: lang === l.code ? 700 : 400,
                      color: lang === l.code ? BLUE : '#374151', fontSize: 13,
                    }}>
                    {l.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </nav>

      {/* ══ HERO ════════════════════════════════════════ */}
      <section style={{ display: 'flex', flexWrap: 'wrap', flex: 1 }}>

        {/* Left */}
        <div className="w-anim-left" style={{
          flex: '1 1 400px', background: BLUE_BG,
          padding: 'clamp(40px, 7vw, 96px) clamp(24px, 5vw, 72px)',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          minHeight: 480, position: 'relative',
        }}>
          {/* Decorative circles */}
          <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: BLUE_BG2, opacity: 0.6, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: 20, left: -40, width: 140, height: 140, borderRadius: '50%', background: BLUE_BG2, opacity: 0.4, pointerEvents: 'none' }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ width: 52, height: 5, background: BLUE, borderRadius: 99, marginBottom: 24 }} />
            <h1 style={{
              fontSize: 'clamp(36px, 5.5vw, 64px)', fontWeight: 900,
              color: BLUE_DEEP, lineHeight: 1.08, marginBottom: 20, letterSpacing: '-1.5px',
            }}>
              {t('welcomeTitle') || 'Empowering\nModern Living'}
            </h1>
            <p style={{ fontSize: 17, color: '#4b5563', lineHeight: 1.7, maxWidth: 400, marginBottom: 32 }}>
              {t('welcomeSubtitle') || 'Streamline your property operations with our efficient and comprehensive resident management solution.'}
            </p>

            {/* Trust badges */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {[{ icon: ShieldCheck, label: 'Secure & Verified' }, { icon: Users, label: 'Multi-role Access' }].map(({ icon: Icon, label }) => (
                <div key={label} style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  background: '#fff', border: `1px solid ${BLUE_BG2}`,
                  borderRadius: 100, padding: '6px 14px',
                  boxShadow: '0 2px 6px rgba(37,99,235,0.08)',
                }}>
                  <Icon size={13} color={BLUE} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: BLUE_DEEP }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: building + cards */}
        <div style={{ flex: '1 1 400px', position: 'relative', minHeight: 480 }}>
          <img
            src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=1200"
            alt="Modern Apartment Building"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(30,58,138,0.52)' }} />

          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 18, padding: 24,
          }}>
            {/* Login card */}
            <div className="w-anim-1 w-card-hover" style={{
              width: '100%', maxWidth: 356,
              background: `${BLUE}e8`, backdropFilter: 'blur(14px)',
              borderRadius: 18, padding: '26px 30px',
              display: 'flex', alignItems: 'center', gap: 18,
              boxShadow: '0 20px 60px rgba(30,58,138,0.35)',
              border: '1px solid rgba(255,255,255,0.15)',
            }}>
              <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'rgba(255,255,255,0.18)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={22} color="#fff" />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ color: '#fff', fontWeight: 700, fontSize: 17, marginBottom: 14 }}>Login to Your Account</p>
                <button className="w-btn" onClick={() => navigate('/login')} style={{
                  background: '#fff', color: BLUE_DEEP, border: 'none',
                  borderRadius: 9, padding: '8px 22px', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                }}>
                  {t('loginButton') || 'Login'}
                </button>
              </div>
            </div>

            {/* Register card */}
            <div className="w-anim-2 w-card-hover" style={{
              width: '100%', maxWidth: 356,
              background: '#fff', borderRadius: 18, padding: '26px 30px',
              display: 'flex', alignItems: 'center', gap: 18,
              boxShadow: '0 20px 60px rgba(30,58,138,0.25)',
              border: `1px solid ${BLUE_BG2}`,
            }}>
              <div style={{ width: 50, height: 50, borderRadius: '50%', background: BLUE_BG, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Home size={22} color={BLUE} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ color: BLUE_DEEP, fontWeight: 700, fontSize: 17, marginBottom: 14 }}>Register as Resident</p>
                <button className="w-btn" onClick={() => navigate('/register')} style={{
                  background: BLUE, color: '#fff', border: 'none',
                  borderRadius: 9, padding: '8px 22px', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                  boxShadow: `0 2px 10px rgba(37,99,235,0.35)`,
                }}>
                  {t('registerButton') || 'Register'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ FEATURES ════════════════════════════════════ */}
      <section style={{ background: '#fff', padding: 'clamp(40px, 5vw, 72px) clamp(20px, 4vw, 56px)' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 44 }}>
            <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 34px)', fontWeight: 800, color: BLUE_DEEP, marginBottom: 10 }}>
              Everything in One Platform
            </h2>
            <p style={{ color: '#6b7280', fontSize: 15, maxWidth: 460, margin: '0 auto' }}>
              Built for modern residential communities that demand efficiency and transparency.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(270px,1fr))', gap: 22 }}>
            {FEATURES.map(({ icon: Icon, title, desc, anim }) => (
              <div key={title} className={`${anim} w-card-hover`} style={{
                background: BLUE_BG, borderRadius: 18, padding: '28px 24px',
                boxShadow: '0 2px 12px rgba(37,99,235,0.07)',
                border: `1px solid ${BLUE_BG2}`,
              }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18, boxShadow: '0 2px 8px rgba(37,99,235,0.1)' }}>
                  <Icon size={24} color={BLUE} />
                </div>
                <h3 style={{ fontWeight: 700, fontSize: 16, color: BLUE_DEEP, marginBottom: 8 }}>{title}</h3>
                <p style={{ color: '#6b7280', lineHeight: 1.65, fontSize: 13.5 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FOOTER ══════════════════════════════════════ */}
      <footer style={{ background: '#fff', borderTop: `1px solid ${BLUE_BG2}`, padding: '22px 28px' }}>
        <div style={{
          maxWidth: 1080, margin: '0 auto',
          display: 'flex', flexWrap: 'wrap',
          alignItems: 'center', justifyContent: 'space-between', gap: 14,
        }}>
          <p style={{ color: '#9ca3af', fontSize: 12 }}>
            © {new Date().getFullYear()} Resident Management System. All rights reserved.
          </p>
          <div style={{ display: 'flex', gap: 22 }}>
            {['Privacy Policy', 'Terms of Service', 'Help Center'].map(link => (
              <a key={link} href="#" style={{ color: '#9ca3af', fontSize: 12, fontWeight: 500, textDecoration: 'none' }}
                onMouseEnter={e => e.target.style.color = BLUE}
                onMouseLeave={e => e.target.style.color = '#9ca3af'}
              >{link}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
