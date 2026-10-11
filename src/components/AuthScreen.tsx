import { Mail } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useTranslation } from '@/lib/LanguageContext';
import { useState } from 'react';
import CropCastLogo from './CropCastLogo';
import ThemeToggle from './ThemeToggle';

export default function AuthScreen() {
  const { t } = useTranslation();
  const [error, setError] = useState('');

  const signInWithGoogle = async () => {
    setError('');
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (authError) setError(authError.message);
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#dcfce7,transparent_46%),#f8fafc] p-5 dark:bg-[radial-gradient(circle_at_top,#052e16,transparent_46%),#020617]">
      {/* Theme toggle in top-right */}
      <div className="absolute right-5 top-5">
        <ThemeToggle />
      </div>

      {/* 3D floating decorative shapes */}
      <div className="pointer-events-none absolute left-10 top-20 h-24 w-24 rounded-3xl bg-gradient-to-br from-green-300/20 to-emerald-400/10 blur-2xl animate-float-3d" />
      <div className="pointer-events-none absolute right-16 bottom-32 h-32 w-32 rounded-full bg-gradient-to-br from-teal-300/15 to-green-400/10 blur-2xl animate-float-3d" style={{ animationDelay: '2s' }} />

      <section className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white/80 shadow-2xl shadow-slate-900/20 backdrop-blur-xl dark:border-slate-700/50 dark:bg-slate-900/80" style={{ transformStyle: 'preserve-3d' }}>
        {/* 3D gradient header with logo */}
        <div className="relative bg-gradient-to-br from-green-700 via-emerald-800 to-teal-900 px-7 py-8 text-center overflow-hidden">
          {/* Decorative blobs */}
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/5" />
          <div className="absolute -left-12 bottom-0 h-24 w-24 rounded-full bg-white/5" />

          <div className="relative flex flex-col items-center gap-3">
            <div className="animate-float-3d">
              <CropCastLogo size="xl" showText={false} />
            </div>
            <h1 className="text-2xl font-extrabold text-white">
              Crop<span className="text-emerald-400">Cast</span>
              <span className="ml-1 rounded-full bg-lime-300 px-2 py-1 text-sm text-slate-900">.AI</span>
            </h1>
            <p className="text-sm text-slate-300">{t('auth.subtitle')}</p>
          </div>
        </div>

        <div className="space-y-5 p-7">
          <button
            onClick={signInWithGoogle}
            className="btn-3d flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-br from-green-600 to-emerald-700 px-4 py-3 text-sm font-bold text-white"
          >
            <Mail className="h-5 w-5" /> {t('auth.continueGoogle')}
          </button>
          {error && <p className="text-center text-sm font-medium text-red-600 dark:text-red-400">{error}</p>}
          <p className="text-center text-xs leading-relaxed text-slate-400 dark:text-slate-500">{t('auth.terms')}</p>
        </div>
      </section>
    </main>
  );
}
