import type { ViewName } from '@/lib/types';
import {
  Sprout,
  ScanLine,
  History,
  CloudSun,
  BookOpen,
  Calculator,
  CalendarDays,
  Headphones,
  Landmark,
} from 'lucide-react';
import { useTranslation } from '@/lib/LanguageContext';
import { LanguagePicker } from './LanguagePicker';
import CropCastLogo from './CropCastLogo';
import ThemeToggle from './ThemeToggle';

interface SidebarProps {
  currentView: ViewName;
  onNavigate: (view: ViewName) => void;
}

const navItems: { view: ViewName; key: string; icon: typeof Sprout }[] = [
  { view: 'dashboard', key: 'nav.dashboard', icon: Sprout },
  { view: 'scan', key: 'nav.scan', icon: ScanLine },
  { view: 'history', key: 'nav.history', icon: History },
  { view: 'weather', key: 'nav.weather', icon: CloudSun },
  { view: 'library', key: 'nav.library', icon: BookOpen },
  { view: 'dosage', key: 'nav.dosage', icon: Calculator },
  { view: 'spray', key: 'nav.spray', icon: CalendarDays },
  { view: 'helpdesk', key: 'nav.helpdesk', icon: Headphones },
  { view: 'schemes', key: 'nav.schemes', icon: Landmark },
];

export default function Sidebar({ currentView, onNavigate }: SidebarProps) {
  const { t } = useTranslation();
  return (
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-64 flex-col border-r border-slate-200 bg-white transition-transform lg:translate-x-0 dark:border-slate-700/50 dark:bg-slate-900">
      {/* Logo header */}
      <div className="border-b border-slate-200 bg-gradient-to-br from-green-700 via-emerald-800 to-teal-900 px-4 py-4 dark:border-slate-700/50">
        <CropCastLogo size="md" showText variant="dark" />
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto custom-scroll px-3 py-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = currentView === item.view;
          return (
            <button
              key={item.view}
              onClick={() => onNavigate(item.view)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                active
                  ? 'bg-green-50 text-green-700 shadow-sm ring-1 ring-green-100 dark:bg-green-500/10 dark:text-green-400 dark:ring-green-500/20'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? 'text-green-600 dark:text-green-400' : 'text-slate-400 dark:text-slate-500'}`} />
              {t(item.key)}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 px-4 py-4 space-y-3 dark:border-slate-700/50">
        <div className="flex items-center justify-between gap-2">
          <LanguagePicker />
          <ThemeToggle />
        </div>
        <div className="rounded-lg bg-gradient-to-br from-slate-50 to-green-50 p-3 dark:from-slate-800 dark:to-slate-800/50">
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t('sidebar.engine')}</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {t('sidebar.engineDesc')}
          </p>
          <div className="mt-2 flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-green-600 font-medium dark:text-green-400">{t('sidebar.active')}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
