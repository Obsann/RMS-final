import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Globe, ChevronDown } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

export default function WelcomeNavbar() {
  const { lang, toggleLanguage } = useLanguage();

  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-white border-b border-blue-100 sticky top-0 z-50 shadow-sm">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-md">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-6 h-6"
          >
            <path d="M3 21h18" />
            <path d="M3 7v1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7H3l2-4h14l2 4" />
            <path d="M5 21V10.85" />
            <path d="M19 21V10.85" />
            <path d="M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4" />
          </svg>
        </div>
        <div className="flex flex-col leading-tight">
          <span className="font-extrabold text-sm text-blue-900 tracking-tight">Resident</span>
          <span className="font-extrabold text-sm text-blue-900 tracking-tight -mt-0.5">Management</span>
          <span className="font-extrabold text-sm text-blue-900 tracking-tight -mt-0.5">System</span>
        </div>
      </div>

      {/* Language Selector */}
      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="bg-blue-600 text-white hover:bg-blue-700 hover:text-white border-none rounded-lg px-4 py-2 flex items-center gap-2 font-semibold text-sm"
            >
              <Globe className="w-4 h-4" />
              <span>{lang === 'en' ? 'English' : 'አማርኛ'}</span>
              <ChevronDown className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[130px]">
            <DropdownMenuItem
              onClick={() => { if (lang !== 'en') toggleLanguage(); }}
              className={lang === 'en' ? 'font-bold text-blue-600 bg-blue-50' : ''}
            >
              English
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => { if (lang !== 'am') toggleLanguage(); }}
              className={lang === 'am' ? 'font-bold text-blue-600 bg-blue-50' : ''}
            >
              አማርኛ
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}
