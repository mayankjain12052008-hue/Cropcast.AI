import type { Diagnostic, Advisory, Crop, WeatherTrend } from '@/lib/types';
import type { GeoLocation, WeatherData } from '@/lib/weather';
import { fetchWeatherForLocation } from '@/lib/weather';
import { detectWeatherAlerts, type WeatherAlert } from '@/lib/weatherAlerts';
import { WeatherAlertBanner } from './WeatherAlertBanner';
import { useEffect, useState } from 'react';
import WeatherPanel from './WeatherPanel';
import LocationPicker from './LocationPicker';
import { RiskBadge, ConfidenceBar } from './RiskGauge';
import Sparkline from './Sparkline';
import AgriNewsSection from './AgriNewsSection';
import { useTranslation } from '@/lib/LanguageContext';
import {
  Sprout,
  ScanLine,
  AlertTriangle,
  TrendingUp,
  Activity,
  Droplets,
  Thermometer,
  ArrowRight,
  Calendar,
  ScanSearch,
  CloudSun,
  BookOpen,
  MapPin,
} from 'lucide-react';

interface DashboardProps {
  diagnostics: Diagnostic[];
  advisories: Advisory[];
  crops: Crop[];
  onNavigate: (view: 'scan' | 'history' | 'weather' | 'library') => void;
  location: GeoLocation | null;
  onSetLocation: (loc: GeoLocation) => void;
}

export default function Dashboard({ diagnostics, advisories, crops, onNavigate, location, onSetLocation }: DashboardProps) {
  const { t } = useTranslation();
  const [weather, setWeather] = useState<WeatherTrend | null>(null);
  const [alerts, setAlerts] = useState<WeatherAlert[]>([]);

  useEffect(() => {
    if (!location) {
      setWeather(null);
      setAlerts([]);
      return;
    }
    fetchWeatherForLocation(location).then((data: WeatherData) => {
      const fieldLabel = `${location.name}${location.country ? ', ' + location.country : ''}`;
      setWeather({
        fieldLabel,
        avgTemp: data.daily.time.reduce((sum, _, i) => sum + (data.daily.tempMax[i] + data.daily.tempMin[i]) / 2, 0) / data.daily.time.length,
        avgHumidity: data.daily.humidityAvg.reduce((a, b) => a + b, 0) / data.daily.humidityAvg.length,
        tempTrend: data.daily.tempMax,
        humidityTrend: data.daily.humidityAvg,
        labels: data.daily.time.map((dt) => new Date(dt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
        latestTemp: data.current.temperature,
        latestHumidity: data.current.humidity,
      });
      setAlerts(detectWeatherAlerts(data));
    }).catch(() => {
      setWeather(null);
      setAlerts([]);
    });
  }, [location]);

  const totalScans = diagnostics.length;
  const activeAdvisories = advisories.filter((a) => a.spray_recommended).length;
  const highRiskCount = advisories.filter(
    (a) => a.risk_level === 'high' || a.risk_level === 'critical'
  ).length;
  const avgConfidence =
    diagnostics.length > 0
      ? diagnostics.reduce((sum, d) => sum + d.confidence_score, 0) / diagnostics.length
      : 0;

  const recentDiagnostics = diagnostics.slice(0, 5);
  const recentAdvisories = advisories.slice(0, 5);

  const matchedPairs = recentDiagnostics.map((d) => ({
    diagnostic: d,
    advisory: recentAdvisories.find((a) => a.diagnostic_id === d.id),
  }));

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Hero section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-800 via-slate-900 to-green-950 p-8 text-white shadow-xl">
        <div className="absolute inset-0 opacity-20">
          <img
            src="https://images.pexels.com/photos/9560384/pexels-photo-9560384.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <Sprout className="h-5 w-5 text-green-400" />
            <span className="text-sm font-medium text-green-300">{t('dash.title')}</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            {totalScans === 0
              ? t('dash.welcome')
              : t('dash.scansAdvisories', { scans: totalScans, advisories: activeAdvisories })}
          </h1>
          <p className="mt-2 text-sm text-slate-300 max-w-2xl">
            {t('dash.description')}
          </p>
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => onNavigate('scan')}
              className="flex items-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-green-600/30 transition-all hover:bg-green-500"
            >
              <ScanLine className="h-4 w-4" />
              {t('dash.startScan')}
            </button>
            <button
              onClick={() => onNavigate('weather')}
              className="flex items-center gap-2 rounded-xl bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20"
            >
              {t('dash.viewWeather')}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<ScanLine className="h-5 w-5" />}
          label={t('dash.totalScans')}
          value={totalScans.toString()}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          icon={<AlertTriangle className="h-5 w-5" />}
          label={t('dash.activeAdvisories')}
          value={activeAdvisories.toString()}
          color="bg-orange-50 text-orange-600"
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5" />}
          label={t('dash.highRisk')}
          value={highRiskCount.toString()}
          color="bg-red-50 text-red-600"
        />
        <StatCard
          icon={<Activity className="h-5 w-5" />}
          label={t('dash.avgConfidence')}
          value={`${Math.round(avgConfidence * 100)}%`}
          color="bg-green-50 text-green-600"
        />
      </div>

      {/* First-time onboarding */}
      {totalScans === 0 && (
        <div className="rounded-2xl border border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-6 shadow-sm dark:border-green-500/20 dark:from-green-900/20 dark:to-emerald-900/10">
          <h3 className="text-base font-bold text-slate-800 mb-1 dark:text-slate-200">{t('dash.gettingStarted')}</h3>
          <p className="text-sm text-slate-600 mb-4 dark:text-slate-400">{t('dash.gettingStartedDesc')}</p>
          <div className="grid sm:grid-cols-3 gap-3">
            <OnboardingStep
              icon={<ScanSearch className="h-5 w-5" />}
              step="1"
              title={t('dash.step1Title')}
              desc={t('dash.step1Desc')}
              action={() => onNavigate('scan')}
              actionLabel={t('dash.startScanBtn')}
            />
            <OnboardingStep
              icon={<CloudSun className="h-5 w-5" />}
              step="2"
              title={t('dash.step2Title')}
              desc={t('dash.step2Desc')}
              action={() => onNavigate('weather')}
              actionLabel={t('dash.viewWeatherBtn')}
            />
            <OnboardingStep
              icon={<BookOpen className="h-5 w-5" />}
              step="3"
              title={t('dash.step3Title')}
              desc={t('dash.step3Desc')}
              action={() => onNavigate('library')}
              actionLabel={t('dash.openLibraryBtn')}
            />
          </div>
        </div>
      )}

      {/* Weather alerts */}
      {alerts.length > 0 && (
        <WeatherAlertBanner
          alerts={alerts}
          compact
          onViewDetails={() => onNavigate('weather')}
        />
      )}

      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        {/* Recent diagnostics */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700/50 dark:bg-slate-800/80">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{t('dash.recentDiag')}</h3>
            {totalScans > 0 && (
              <button
                onClick={() => onNavigate('history')}
                className="text-xs font-medium text-green-600 hover:underline"
              >
                {t('dash.viewAll')}
              </button>
            )}
          </div>

          {matchedPairs.length === 0 ? (
            <div className="py-12 text-center">
              <ScanLine className="mx-auto h-12 w-12 text-slate-200 dark:text-slate-600" />
              <p className="mt-3 text-sm text-slate-400 dark:text-slate-500">
                {t('dash.noDiag')}
              </p>
              <button
                onClick={() => onNavigate('scan')}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-green-50 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-100 transition-colors"
              >
                <ScanLine className="h-4 w-4" />
                {t('dash.startFirstScan')}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {matchedPairs.map(({ diagnostic, advisory }) => {
                const crop = crops.find((c) => c.id === diagnostic.crop_id);
                return (
                  <div
                    key={diagnostic.id}
                    className="flex items-center gap-4 rounded-xl border border-slate-100 p-3 transition-all hover:border-slate-200 hover:shadow-sm dark:border-slate-700/50 dark:hover:border-slate-600"
                  >
                    {diagnostic.image_url ? (
                      <img
                        src={diagnostic.image_url}
                        alt=""
                        className="h-14 w-14 rounded-lg object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="h-14 w-14 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 dark:bg-slate-700">
                        <Sprout className="h-6 w-6 text-slate-300 dark:text-slate-500" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-800 truncate dark:text-slate-200">
                          {diagnostic.identified_disease || t('dash.unknown')}
                        </p>
                        {advisory && <RiskBadge level={advisory.risk_level} />}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {crop?.name} · {diagnostic.field_label} ·{' '}
                        {new Date(diagnostic.created_at).toLocaleDateString()}
                      </p>
                      {advisory && (
                        <div className="mt-1.5 max-w-xs">
                          <ConfidenceBar
                            confidence={advisory.confidence_calibrated}
                            label={t('dash.calibratedConf')}
                          />
                        </div>
                      )}
                    </div>
                    {advisory?.spray_recommended && (
                      <span className="flex-shrink-0 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                        {t('dash.spray')}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Weather sidebar */}
        <div className="space-y-4">
          {!location ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800/80">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="h-5 w-5 text-green-500 dark:text-green-400" />
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{t('dash.setLocation')}</h3>
              </div>
              <p className="text-xs text-slate-400 mb-3 dark:text-slate-500">
                {t('dash.setLocationDesc')}
              </p>
              <LocationPicker onSelect={onSetLocation} selectedLocation={location} compact />
            </div>
          ) : (
            <>
              {weather && <WeatherPanel weather={weather} fieldLabel={weather.fieldLabel} />}
              {weather && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700/50 dark:bg-slate-800/80">
                  <h3 className="text-sm font-semibold text-slate-800 mb-3 dark:text-slate-200">{t('dash.quickConditions')}</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50">
                        <Thermometer className="h-4 w-4 text-orange-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-slate-400">{t('dash.temperature')}</p>
                        <p className="text-sm font-semibold text-slate-700">
                          {weather.latestTemp.toFixed(1)}°C
                          <span className="text-xs font-normal text-slate-400 ml-1">
                            avg {weather.avgTemp.toFixed(1)}°C
                          </span>
                        </p>
                      </div>
                      <Sparkline data={weather.tempTrend} color="#f97316" height={28} width={80} />
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
                        <Droplets className="h-4 w-4 text-blue-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-slate-400">{t('dash.humidity')}</p>
                        <p className="text-sm font-semibold text-slate-700">
                          {weather.latestHumidity.toFixed(0)}%
                          <span className="text-xs font-normal text-slate-400 ml-1">
                            avg {weather.avgHumidity.toFixed(0)}%
                          </span>
                        </p>
                      </div>
                      <Sparkline data={weather.humidityTrend} color="#3b82f6" height={28} width={80} />
                    </div>
                  </div>
                  <button
                    onClick={() => onNavigate('weather')}
                    className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg bg-slate-50 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:bg-slate-700/50 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    <Calendar className="h-3.5 w-3.5" />
                    {t('dash.fullWeather')}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <AgriNewsSection />
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm card-3d dark:border-slate-700/50 dark:bg-slate-800/80">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
        {icon}
      </div>
      <p className="mt-3 text-2xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
      <p className="text-xs text-slate-400 dark:text-slate-500">{label}</p>
    </div>
  );
}

function OnboardingStep({
  icon,
  step,
  title,
  desc,
  action,
  actionLabel,
}: {
  icon: React.ReactNode;
  step: string;
  title: string;
  desc: string;
  action: () => void;
  actionLabel: string;
}) {
  return (
    <div className="rounded-xl border border-green-100 bg-white p-4 flex flex-col dark:border-green-500/10 dark:bg-slate-800/60">
      <div className="flex items-center gap-2 mb-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400">
          {icon}
        </div>
        <span className="text-xs font-bold text-slate-400 dark:text-slate-500">Step {step}</span>
      </div>
      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{title}</p>
      <p className="text-xs text-slate-500 mt-1 flex-1 dark:text-slate-400">{desc}</p>
      <button
        onClick={action}
        className="mt-3 flex items-center gap-1 text-xs font-semibold text-green-600 hover:gap-2 transition-all"
      >
        {actionLabel}
        <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
