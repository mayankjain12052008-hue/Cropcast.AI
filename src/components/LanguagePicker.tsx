import { useState, useRef, useEffect } from 'react';
import { Globe, Check } from 'lucide-react';
import { LANGUAGES } from '@/lib/i18n';
import { useTranslation } from '@/lib/LanguageContext';

export function LanguagePicker() {
  const { lang, setLang, t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative flex-1">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 text-sm transition-colors dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-700 dark:text-slate-300"
      >
        <Globe className="w-4 h-4 text-green-500 dark:text-green-400" />
        <span className="flex-1 text-left text-xs uppercase tracking-wider text-slate-400 dark:text-slate-500">
          {t('sidebar.language')}
        </span>
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{current.nativeName}</span>
      </button>

      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-2 rounded-lg bg-white border border-slate-200 shadow-xl overflow-hidden z-50 dark:bg-slate-800 dark:border-slate-700">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => {
                setLang(l.code);
                setOpen(false);
              }}
              className={`flex items-center justify-between w-full px-3 py-2.5 text-sm transition-colors ${
                l.code === lang
                  ? 'bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-400'
                  : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700/50'
              }`}
            >
              <span className="font-medium">{l.nativeName}</span>
              <span className="text-xs text-slate-400 dark:text-slate-500">{l.name}</span>
              {l.code === lang && <Check className="w-4 h-4 text-green-500 dark:text-green-400" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
