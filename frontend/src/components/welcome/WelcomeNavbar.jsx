import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Globe, ChevronDown, Building2 } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import TranslateWidget from '../TranslateWidget';

export default function WelcomeNavbar() {
  const { lang, setLang } = useLanguage();

  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-white border-b border-blue-100 sticky top-0 z-50 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
          <Building2 className="w-6 h-6 text-white" />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-sm text-blue-900 tracking-tight">Resident</span>
            <span className="font-extrabold text-sm text-blue-900 tracking-tight -mt-0.5">Management</span>
            <span className="font-extrabold text-sm text-blue-900 tracking-tight -mt-0.5">System</span>
          </div>
          <div className="h-0.5 w-1/2 bg-blue-600 rounded-full mt-0.5"></div>
        </div>
      </div>

      {/* Language Selector */}
      <div className="flex items-center gap-4">
        <TranslateWidget />
      </div>
    </nav>
  );
}
