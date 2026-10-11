import { useEffect, useMemo, useState } from 'react';
import type { Diagnostic, Advisory, Crop, Disease, Medicine, ViewName } from '@/lib/types';
import type { GeoLocation, WeatherData } from '@/lib/weather';
import { fetchWeatherForLocation, weatherCodeToLabel } from '@/lib/weather';
import { useTranslation } from '@/lib/LanguageContext';
import {
  CalendarDays, CloudRain, Droplets, Wind, Thermometer, Sun,
  CheckCircle2, AlertTriangle, XCircle, Sprout, ArrowRight,
  Clock, FlaskConical, RefreshCw, MapPin, Sparkles,
} from 'lucide-react';

interface SpraySchedulerProps {
  diagnostics: Diagnostic[];
  advisories: Advisory[];
  crops: Crop[];
  diseases: Disease[];
  medicines: Medicine[];
  location: GeoLocation | null;
  onSetLocation: (loc: GeoLocation) => void;
  onNavigate: (view: ViewName) => void;
}

type SprayCondition = 'optimal' | 'caution' | 'unsafe';

interface DayForecast {
  date: Date;
  dayName: string;
  dateLabel: string;
  tempMax: number;
  tempMin: number;
  humidity: number;
  precipitation: number;
  windSpeed: number;
  weatherCode: number;
  condition: SprayCondition;
  reasons: string[];
  recommendedWindow: string | null;
}

const MAX_WIND_KMH = 15;
const MIN_TEMP_C = 12;
const MAX_TEMP_C = 30;
const MAX_HUMIDITY = 85;
const MAX_PRECIP_MM = 1;

export default function SprayScheduler({
  diagnostics, advisories, crops, diseases, medicines, location, onSetLocation, onNavigate,
}: SpraySchedulerProps) {
  const { t } = useTranslation();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [selectedDay, setSelectedDay] = useState(0);

  useEffect(() => {
    if (!location) { setWeather(null); return; }
    setLoading(true);
    setError(false);
    fetchWeatherForLocation(location)
      .then((data) => { setWeather(data); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, [location]);

  const sprayAdvisories = useMemo(
    () => advisories.filter((a) => a.spray_recommended),
    [advisories],
  );

  const days: DayForecast[] = useMemo(() => {
    if (!weather) return [];
    return weather.daily.time.map((dt, i) => {
      const date = new Date(dt);
      const tempMax = weather.daily.tempMax[i];
      const tempMin = weather.daily.tempMin[i];
      const humidity = weather.daily.humidityAvg[i];
      const precipitation = weather.daily.precipitation[i];
      const windSpeed = i === 0 ? weather.current.windSpeed : 10;
      const weatherCode = i === 0 ? weather.current.weatherCode : 0;

      const reasons: string[] = [];
      let condition: SprayCondition = 'optimal';

      if (precipitation > MAX_PRECIP_MM) {
        condition = 'unsafe';
        reasons.push(t('spray.reasonRain', { mm: precipitation.toFixed(1) }));
      } else if (precipitation > 0.2) {
        if (condition === 'optimal') condition = 'caution';
        reasons.push(t('spray.reasonLightRain', { mm: precipitation.toFixed(1) }));
      }

      if (windSpeed > MAX_WIND_KMH) {
        condition = 'unsafe';
        reasons.push(t('spray.reasonWind', { kmh: Math.round(windSpeed) }));
      } else if (windSpeed > 10) {
        if (condition === 'optimal') condition = 'caution';
        reasons.push(t('spray.reasonGentleWind', { kmh: Math.round(windSpeed) }));
      }

      if (tempMax > MAX_TEMP_C) {
        condition = 'unsafe';
        reasons.push(t('spray.reasonHeat', { temp: Math.round(tempMax) }));
      } else if (tempMax > 28) {
        if (condition === 'optimal') condition = 'caution';
        reasons.push(t('spray.reasonWarm', { temp: Math.round(tempMax) }));
      }

      if (tempMin < MIN_TEMP_C) {
        if (condition === 'optimal') condition = 'caution';
        reasons.push(t('spray.reasonCold', { temp: Math.round(tempMin) }));
      }

      if (humidity > MAX_HUMIDITY) {
        if (condition === 'optimal') condition = 'caution';
        reasons.push(t('spray.reasonHumidity', { pct: Math.round(humidity) }));
      }

      if (reasons.length === 0) {
        reasons.push(t('spray.reasonGood'));
      }

      let window: string | null = null;
      if (condition === 'optimal') {
        window = t('spray.windowOptimal');
      } else if (condition === 'caution') {
        if (tempMax > 28) {
          window = t('spray.windowEarly');
        } else if (humidity > 85) {
          window = t('spray.windowLate');
        } else {
          window = t('spray.windowNarrow');
        }
      }

      return {
        date,
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dateLabel: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        tempMax,
        tempMin,
        humidity,
        precipitation,
        windSpeed,
        weatherCode,
        condition,
        reasons,
        recommendedWindow: window,
      };
    });
  }, [weather, t]);

  const optimalDays = days.filter((d) => d.condition === 'optimal').length;
  const cautionDays = days.filter((d) => d.condition === 'caution').length;
  const unsafeDays = days.filter((d) => d.condition === 'unsafe').length;
  const nextBestDay = days.find((d) => d.condition === 'optimal');
  const activeDay = days[selectedDay];

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 p-6 sm:p-8 shadow-lg">
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-teal-500/20 blur-3xl" />
        <div className="absolute -left-8 -bottom-12 h-40 w-40 rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="relative flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-500 shadow-lg shadow-teal-500/30">
            <CalendarDays className="h-7 w-7 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{t('spray.title')}</h2>
            <p className="text-sm text-teal-200/80 mt-0.5">{t('spray.subtitle')}</p>
          </div>
        </div>
      </div>

      {/* No location state */}
      {!location && (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-gradient-to-br from-slate-50 to-teal-50/30 p-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-100 to-emerald-100">
            <MapPin className="h-8 w-8 text-teal-400" />
          </div>
          <p className="text-sm font-semibold text-slate-600">{t('spray.needLocation')}</p>
          <p className="text-xs text-slate-400 mt-1">{t('spray.needLocationDesc')}</p>
          <button
            onClick={() => onNavigate('weather')}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-500"
          >
            {t('spray.goSetLocation')}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="relative">
            <div className="h-12 w-12 rounded-full border-4 border-teal-100" />
            <div className="absolute inset-0 h-12 w-12 rounded-full border-4 border-teal-600 border-t-transparent animate-spin" />
          </div>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm font-semibold text-red-700">{t('spray.fetchError')}</p>
          <button
            onClick={() => location && fetchWeatherForLocation(location).then(setWeather)}
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-white border border-red-200 px-4 py-2 text-sm font-medium text-red-600"
          >
            <RefreshCw className="h-4 w-4" />
            {t('weather.tryAgain')}
          </button>
        </div>
      )}

      {/* Main content */}
      {weather && !loading && !error && days.length > 0 && (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-3">
            <SummaryStat
              icon={<CheckCircle2 className="h-5 w-5" />}
              count={optimalDays}
              label={t('spray.optimalDays')}
              color="text-emerald-600"
              bg="from-emerald-50 to-green-50"
              border="border-emerald-200"
            />
            <SummaryStat
              icon={<AlertTriangle className="h-5 w-5" />}
              count={cautionDays}
              label={t('spray.cautionDays')}
              color="text-amber-600"
              bg="from-amber-50 to-yellow-50"
              border="border-amber-200"
            />
            <SummaryStat
              icon={<XCircle className="h-5 w-5" />}
              count={unsafeDays}
              label={t('spray.unsafeDays')}
              color="text-red-600"
              bg="from-red-50 to-rose-50"
              border="border-red-200"
            />
          </div>

          {/* Next best day banner */}
          {nextBestDay && sprayAdvisories.length > 0 && (
            <div className="rounded-2xl border-2 border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 p-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20">
                <Sparkles className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-800">{t('spray.nextBestDay')}</p>
                <p className="text-xs text-slate-500">
                  {nextBestDay.dayName}, {nextBestDay.dateLabel} · {nextBestDay.recommendedWindow}
                </p>
              </div>
              <button
                onClick={() => onNavigate('dosage')}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-500"
              >
                <FlaskConical className="h-3.5 w-3.5" />
                {t('spray.prepareDosage')}
              </button>
            </div>
          )}

          {/* 7-day calendar */}
          <div className="grid grid-cols-7 gap-2 sm:gap-3">
            {days.map((day, i) => (
              <button
                key={i}
                onClick={() => setSelectedDay(i)}
                className={`relative rounded-2xl border-2 p-2 sm:p-3 text-center transition-all duration-200 ${
                  selectedDay === i ? 'ring-2 ring-offset-1 scale-105' : ''
                } ${
                  day.condition === 'optimal'
                    ? 'border-emerald-300 bg-gradient-to-b from-emerald-50 to-white ring-emerald-400'
                    : day.condition === 'caution'
                    ? 'border-amber-300 bg-gradient-to-b from-amber-50 to-white ring-amber-400'
                    : 'border-red-300 bg-gradient-to-b from-red-50 to-white ring-red-400'
                }`}
              >
                <p className="text-[10px] sm:text-xs font-bold uppercase text-slate-500">{day.dayName}</p>
                <p className="text-[10px] sm:text-xs text-slate-400">{day.dateLabel}</p>
                <div className={`mx-auto mt-2 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full ${
                  day.condition === 'optimal'
                    ? 'bg-emerald-500 text-white'
                    : day.condition === 'caution'
                    ? 'bg-amber-500 text-white'
                    : 'bg-red-500 text-white'
                }`}>
                  {day.condition === 'optimal' && <CheckCircle2 className="h-4 w-4" />}
                  {day.condition === 'caution' && <AlertTriangle className="h-4 w-4" />}
                  {day.condition === 'unsafe' && <XCircle className="h-4 w-4" />}
                </div>
                <p className="mt-1.5 text-[9px] sm:text-[10px] font-medium text-slate-500">
                  {Math.round(day.tempMax)}°/{Math.round(day.tempMin)}°
                </p>
                {day.precipitation > 0.2 && (
                  <p className="text-[9px] text-blue-500 font-medium">{day.precipitation.toFixed(0)}mm</p>
                )}
              </button>
            ))}
          </div>

          {/* Detail panel for selected day */}
          {activeDay && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    {activeDay.dayName}, {activeDay.dateLabel}
                  </h3>
                  <div className="mt-1 flex items-center gap-2">
                    <ConditionBadge condition={activeDay.condition} />
                    {activeDay.recommendedWindow && (
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <Clock className="h-3 w-3" />
                        {activeDay.recommendedWindow}
                      </span>
                    )}
                  </div>
                </div>
                <WeatherIcon code={activeDay.weatherCode} />
              </div>

              {/* Weather metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <MetricChip icon={<Thermometer className="h-4 w-4" />} label={t('spray.tempRange')} value={`${Math.round(activeDay.tempMax)}° / ${Math.round(activeDay.tempMin)}°`} color="text-orange-600 bg-orange-50" />
                <MetricChip icon={<Droplets className="h-4 w-4" />} label={t('spray.humidity')} value={`${Math.round(activeDay.humidity)}%`} color="text-blue-600 bg-blue-50" />
                <MetricChip icon={<CloudRain className="h-4 w-4" />} label={t('spray.precip')} value={`${activeDay.precipitation.toFixed(1)} mm`} color="text-cyan-600 bg-cyan-50" />
                <MetricChip icon={<Wind className="h-4 w-4" />} label={t('spray.wind')} value={`${Math.round(activeDay.windSpeed)} km/h`} color="text-slate-600 bg-slate-100" />
              </div>

              {/* Reasons */}
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">{t('spray.assessment')}</p>
                <ul className="space-y-2">
                  {activeDay.reasons.map((reason, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                      <span className={`mt-1 h-1.5 w-1.5 rounded-full flex-shrink-0 ${
                        activeDay.condition === 'optimal' ? 'bg-emerald-500'
                        : activeDay.condition === 'caution' ? 'bg-amber-500'
                        : 'bg-red-500'
                      }`} />
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Active spray advisories */}
          {sprayAdvisories.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 text-red-600">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-700">{t('spray.activeAdvisories')}</h3>
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">{sprayAdvisories.length}</span>
              </div>
              <div className="space-y-2">
                {sprayAdvisories.slice(0, 5).map((adv) => {
                  const diag = diagnostics.find((d) => d.id === adv.diagnostic_id);
                  const crop = diag ? crops.find((c) => c.id === diag.crop_id) : undefined;
                  const disease = diag ? diseases.find((d) => d.id === diag.disease_id) : undefined;
                  return (
                    <div key={adv.id} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 transition hover:border-slate-200 hover:shadow-sm">
                      {diag?.image_url ? (
                        <img src={diag.image_url} alt="" className="h-10 w-10 rounded-lg object-cover" />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                          <Sprout className="h-5 w-5 text-slate-300" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">
                          {disease?.name || diag?.identified_disease || t('dash.unknown')}
                        </p>
                        <p className="text-xs text-slate-400">
                          {crop?.name} · {diag?.field_label} · {t('spray.urgency')}: {adv.spray_urgency}
                        </p>
                      </div>
                      <button
                        onClick={() => onNavigate('dosage')}
                        className="flex items-center gap-1 rounded-lg bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 transition hover:bg-green-100"
                      >
                        <FlaskConical className="h-3 w-3" />
                        {t('spray.calcDosage')}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* No advisories info */}
          {sprayAdvisories.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              </div>
              <p className="text-sm font-medium text-slate-500">{t('spray.noAdvisories')}</p>
              <button
                onClick={() => onNavigate('scan')}
                className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-green-600"
              >
                {t('spray.runScan')}
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ─── Sub-components ─── */
function SummaryStat({
  icon, count, label, color, bg, border,
}: {
  icon: React.ReactNode;
  count: number;
  label: string;
  color: string;
  bg: string;
  border: string;
}) {
  return (
    <div className={`rounded-2xl border-2 ${border} bg-gradient-to-br ${bg} p-3 sm:p-4 text-center`}>
      <div className={`mx-auto flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-white shadow-sm ${color}`}>
        {icon}
      </div>
      <p className={`mt-2 text-xl sm:text-2xl font-extrabold ${color}`}>{count}</p>
      <p className="text-[10px] sm:text-xs font-medium text-slate-500">{label}</p>
    </div>
  );
}

function ConditionBadge({ condition }: { condition: SprayCondition }) {
  const config = {
    optimal: { label: 'OPTIMAL', cls: 'bg-emerald-100 text-emerald-700' },
    caution: { label: 'CAUTION', cls: 'bg-amber-100 text-amber-700' },
    unsafe: { label: 'UNSAFE', cls: 'bg-red-100 text-red-700' },
  };
  const c = config[condition];
  return <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${c.cls}`}>{c.label}</span>;
}

function WeatherIcon({ code }: { code: number }) {
  const { icon } = weatherCodeToLabel(code);
  const iconMap: Record<string, React.ReactNode> = {
    'sun': <Sun className="h-8 w-8 text-amber-400" />,
    'cloud-sun': <Sun className="h-8 w-8 text-amber-400" />,
    'cloud': <CloudRain className="h-8 w-8 text-slate-400" />,
    'cloud-fog': <CloudRain className="h-8 w-8 text-slate-400" />,
    'drizzle': <Droplets className="h-8 w-8 text-blue-400" />,
    'rain': <CloudRain className="h-8 w-8 text-blue-500" />,
    'snow': <CloudRain className="h-8 w-8 text-cyan-400" />,
    'thunder': <CloudRain className="h-8 w-8 text-purple-500" />,
  };
  return iconMap[icon] || <CloudRain className="h-8 w-8 text-slate-400" />;
}

function MetricChip({
  icon, label, value, color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-3">
      <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${color} mb-2`}>
        {icon}
      </div>
      <p className="text-[10px] text-slate-400 font-medium">{label}</p>
      <p className="text-sm font-bold text-slate-700">{value}</p>
    </div>
  );
}
