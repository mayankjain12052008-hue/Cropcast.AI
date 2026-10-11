import { useState, useEffect, useCallback } from 'react';
import type { Crop, Disease, Diagnostic, Advisory, Medicine, ViewName } from '@/lib/types';
import type { GeoLocation } from '@/lib/weather';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';
import Dashboard from '@/components/Dashboard';
import ScanView from '@/components/ScanView';
import HistoryView from '@/components/HistoryView';
import WeatherView from '@/components/WeatherView';
import LibraryView from '@/components/LibraryView';
import DosageCalculator from '@/components/DosageCalculator';
import SprayScheduler from '@/components/SprayScheduler';
import HelpDeskView from '@/components/HelpDeskView';
import GovernmentSchemesView from '@/components/GovernmentSchemesView';
import { ToastContainer, useToast } from '@/components/Toast';
import { Menu, X } from 'lucide-react';
import { useTranslation } from '@/lib/LanguageContext';

export default function App() {
  const [view, setView] = useState<ViewName>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [diseases, setDiseases] = useState<Disease[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([]);
  const [advisories, setAdvisories] = useState<Advisory[]>([]);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<GeoLocation | null>(() => {
    const saved = localStorage.getItem('cropcast_location');
    return saved ? JSON.parse(saved) : null;
  });
  const { t } = useTranslation();
  const { toasts, showToast, dismissToast } = useToast();

  const handleSetLocation = useCallback((loc: GeoLocation) => {
    setLocation(loc);
    localStorage.setItem('cropcast_location', JSON.stringify(loc));
  }, []);

  const loadAll = useCallback(async () => {
    const [cropsRes, diseasesRes, medRes, diagRes, advRes] = await Promise.all([
      supabase.from('crops').select('*').order('name'),
      supabase.from('diseases').select('*').order('name'),
      supabase.from('medicines').select('*').order('priority', { ascending: true }),
      supabase.from('diagnostics').select('*').order('created_at', { ascending: false }),
      supabase.from('advisories').select('*').order('created_at', { ascending: false }),
    ]);

    setCrops((cropsRes.data as Crop[]) || []);
    setDiseases((diseasesRes.data as Disease[]) || []);
    setMedicines((medRes.data as Medicine[]) || []);
    setDiagnostics((diagRes.data as Diagnostic[]) || []);
    setAdvisories((advRes.data as Advisory[]) || []);
  }, []);

  useEffect(() => {
    setLoading(true);
    loadAll().then(() => setLoading(false));
  }, [loadAll]);

  const navigate = (v: ViewName) => {
    setView(v);
    setSidebarOpen(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('diagnostics').delete().eq('id', id);
    if (error) {
      showToast('error', t('scan.deleteFailed'));
    } else {
      showToast('success', t('scan.diagDeleted'));
    }
    await loadAll();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-4 border-green-100 dark:border-green-900/30" />
            <div className="absolute inset-0 h-16 w-16 rounded-full border-4 border-green-600 border-t-transparent animate-spin" />
          </div>
          <p className="text-sm font-medium text-slate-500">{t('app.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Mobile sidebar toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed left-4 top-4 z-50 lg:hidden flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-md border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
      >
        {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Sidebar */}
      <div
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity lg:hidden ${
          sidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={() => setSidebarOpen(false)}
      />
      <div
        className={`fixed inset-y-0 left-0 z-40 transform transition-transform lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:relative lg:z-30`}
      >
        <Sidebar currentView={view} onNavigate={navigate} />
      </div>

      {/* Main content */}
      <main className="lg:pl-64 min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8">
          {view === 'dashboard' && (
            <Dashboard
              diagnostics={diagnostics}
              advisories={advisories}
              crops={crops}
              onNavigate={navigate}
              location={location}
              onSetLocation={handleSetLocation}
            />
          )}
          {view === 'scan' && (
            <ScanView
              crops={crops}
              diseases={diseases}
              medicines={medicines}
              onScanComplete={loadAll}
              showToast={showToast}
              location={location}
              onSetLocation={handleSetLocation}
            />
          )}
          {view === 'history' && (
            <HistoryView
              diagnostics={diagnostics}
              advisories={advisories}
              crops={crops}
              medicines={medicines}
              diseases={diseases}
              onDelete={handleDelete}
            />
          )}
          {view === 'weather' && (
            <WeatherView location={location} onSetLocation={handleSetLocation} />
          )}
          {view === 'library' && (
            <LibraryView diseases={diseases} crops={crops} medicines={medicines} />
          )}
          {view === 'dosage' && (
            <DosageCalculator crops={crops} diseases={diseases} medicines={medicines} />
          )}
          {view === 'spray' && (
            <SprayScheduler
              diagnostics={diagnostics}
              advisories={advisories}
              crops={crops}
              diseases={diseases}
              medicines={medicines}
              location={location}
              onSetLocation={handleSetLocation}
              onNavigate={navigate}
            />
          )}
          {view === 'helpdesk' && <HelpDeskView />}
          {view === 'schemes' && <GovernmentSchemesView />}
        </div>
      </main>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
