import { useEffect } from 'react';
import WelcomeNavbar from '../components/welcome/WelcomeNavbar';
import WelcomeHero from '../components/welcome/WelcomeHero';
import WelcomeFeatures from '../components/welcome/WelcomeFeatures';
import WelcomeFooter from '../components/welcome/WelcomeFooter';

/* ─── Welcome page animations ──────────────────────── */
const WELCOME_STYLES = `
  @keyframes wFadeInLeft {
    from { opacity: 0; transform: translateX(-28px); }
    to   { opacity: 1; transform: none; }
  }
  @keyframes wFadeInUp {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: none; }
  }
  .welcome-anim-left { animation: wFadeInLeft 0.6s ease both; }
  .welcome-anim-1    { animation: wFadeInUp 0.6s 0.12s ease both; }
  .welcome-anim-2    { animation: wFadeInUp 0.6s 0.26s ease both; }
  .welcome-anim-3    { animation: wFadeInUp 0.6s 0.08s ease both; }
  .welcome-anim-4    { animation: wFadeInUp 0.6s 0.18s ease both; }
  .welcome-anim-5    { animation: wFadeInUp 0.6s 0.28s ease both; }
  .welcome-card-hover {
    transition: transform 0.22s ease, box-shadow 0.22s ease;
    cursor: pointer;
  }
  .welcome-card-hover:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 40px rgba(37,99,235,0.16) !important;
  }
`;

export default function Welcome() {
  /* Inject animation keyframes once */
  useEffect(() => {
    if (!document.getElementById('welcome-anim-css')) {
      const el = document.createElement('style');
      el.id = 'welcome-anim-css';
      el.textContent = WELCOME_STYLES;
      document.head.appendChild(el);
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col font-sans bg-blue-50">
      <WelcomeNavbar />
      <main className="flex-1 flex flex-col">
        <WelcomeHero />
        <WelcomeFeatures />
      </main>
      <WelcomeFooter />
    </div>
  );
}
