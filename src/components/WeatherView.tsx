import { useEffect, useState, useMemo } from 'react';
import type { GeoLocation, WeatherData } from '@/lib/weather';
import { fetchWeatherForLocation, weatherCodeToLabel } from '@/lib/weather';
import { detectWeatherAlerts } from '@/lib/weatherAlerts';
import { WeatherAlertBanner } from './WeatherAlertBanner';
import LocationPicker from './LocationPicker';
import { Thermometer, Droplets, CloudSun, Wind, MapPin, Loader2, CloudRain } from 'lucide-react';
import { useTranslation } from '@/lib/LanguageContext';

interface WeatherViewProps {
  location: GeoLocation | null;
  onSetLocation: (loc: GeoLocation) => void;
}

export default function WeatherView({ location, onSetLocation }: WeatherViewProps) {
  const { t } = useTranslation();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!location) {
      setWeather(null);
      return;
    }

    setLoading(true);
    setError('');
    fetchWeatherForLocation(location)
      .then(setWeather)
      .catch((err) => {
        setError(err instanceof Error ? err.message : t('weather.noData'));
        setWeather(null);
      })
      .finally(() => setLoading(false));
  }, [location]);

  const alerts = useMemo(
    () => (weather ? detectWeatherAlerts(weather) : []),
    [weather]
  );

  if (!location) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{t('weather.title')}</h2>
          <p className="text-sm text-slate-500 mt-1">
            {t('weather.searchLocation')}
          </p>
        </div>
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <MapPin className="mx-auto h-16 w-16 text-slate-200" />
          <h3 className="mt-4 text-lg font-semibold text-slate-700">{t('weather.chooseLocation')}</h3>
          <p className="text-sm text-slate-400 mt-1 mb-6 max-w-md mx-auto">
            {t('weather.chooseLocationDesc')}
          </p>
          <div className="max-w-md mx-auto text-left">
            <LocationPicker onSelect={onSetLocation} selectedLocation={location} />
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-64 rounded-lg bg-slate-200" />
          <div className="h-32 rounded-2xl bg-slate-100" />
          <div className="grid md:grid-cols-2 gap-6">
            <div className="h-80 rounded-2xl bg-slate-100" />
            <div className="h-80 rounded-2xl bg-slate-100" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{t('weather.title')}</h2>
        </div>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <p className="text-sm text-red-700">{error || t('weather.noData')}</p>
          <button
            onClick={() => onSetLocation(location)}
            className="mt-4 rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50"
          >
            {t('weather.tryAgain')}
          </button>
        </div>
      </div>
    );
  }

  const { current, daily, location: loc } = weather;
  const conditions = weatherCodeToLabel(current.weatherCode);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{t('weather.title')}</h2>
          <p className="text-sm text-slate-500 mt-1">
            {t('weather.liveWeatherFor', { location: `${loc.name}${loc.admin1 ? `, ${loc.admin1}` : ''}${loc.country ? `, ${loc.country}` : ''}` })}
          </p>
        </div>
        <div className="w-full sm:w-80">
          <LocationPicker onSelect={onSetLocation} selectedLocation={location} compact />
        </div>
      </div>

      {/* Weather alerts */}
      {alerts.length > 0 && (
        <WeatherAlertBanner alerts={alerts} />
      )}

      {/* Current conditions hero */}
      <div className="rounded-3xl bg-gradient-to-br from-slate-800 via-slate-900 to-green-950 p-8 text-white shadow-xl overflow-hidden relative">
        <div className="absolute inset-0 opacity-10">
          <CloudSun className="absolute -right-8 -top-8 h-48 w-48 text-white" />
        </div>
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-4 w-4 text-green-400" />
              <span className="text-sm font-medium text-green-300">
                {loc.name}{loc.admin1 ? `, ${loc.admin1}` : ''}{loc.country ? `, ${loc.country}` : ''}
              </span>
            </div>
            <p className="text-5xl font-bold tracking-tight">
              {current.temperature.toFixed(1)}°C
            </p>
            <p className="text-sm text-slate-300 mt-1">{conditions.label}</p>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div>
              <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                <Droplets className="h-4 w-4" />
                <span className="text-xs">{t('weather.humidity')}</span>
              </div>
              <p className="text-2xl font-bold">{current.humidity}%</p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                <Wind className="h-4 w-4" />
                <span className="text-xs">{t('weather.wind')}</span>
              </div>
              <p className="text-2xl font-bold">{current.windSpeed} <span className="text-sm font-normal text-slate-400">km/h</span></p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                <Thermometer className="h-4 w-4" />
                <span className="text-xs">{t('weather.feels')}</span>
              </div>
              <p className="text-2xl font-bold">{current.temperature.toFixed(0)}°</p>
            </div>
          </div>
        </div>
      </div>

      {/* 7-day forecast */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-800 mb-4">{t('weather.forecast7day')}</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {daily.time.map((date, i) => {
            const day = new Date(date);
            const dayLabel = day.toLocaleDateString('en-US', { weekday: 'short' });
            const dayDate = day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            return (
              <div
                key={date}
                className={`rounded-xl border p-3 text-center transition-all hover:shadow-sm ${
                  i === 0 ? 'border-green-200 bg-green-50/50' : 'border-slate-100'
                }`}
              >
                <p className="text-xs font-bold text-slate-700">{dayLabel}</p>
                <p className="text-xs text-slate-400">{dayDate}</p>
                <div className="my-2 flex justify-center">
                  {daily.precipitation[i] > 0 ? (
                    <CloudRain className="h-6 w-6 text-blue-400" />
                  ) : (
                    <CloudSun className="h-6 w-6 text-amber-400" />
                  )}
                </div>
                <p className="text-sm font-bold text-slate-800">{daily.tempMax[i].toFixed(0)}°</p>
                <p className="text-xs text-slate-400">{daily.tempMin[i].toFixed(0)}°</p>
                {daily.precipitation[i] > 0 && (
                  <p className="text-xs text-blue-500 mt-1">{daily.precipitation[i].toFixed(1)}mm</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Temperature + humidity trends */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Thermometer className="h-5 w-5 text-orange-500" />
            <h3 className="text-sm font-semibold text-slate-800">{t('weather.temperature')}</h3>
          </div>
          <div className="space-y-3">
            {daily.time.map((date, i) => {
              const dayLabel = new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
              const range = daily.tempMax[i] - daily.tempMin[i];
              const minPos = (daily.tempMin[i] / 40) * 100;
              const widthPct = Math.max((range / 40) * 100, 8);
              return (
                <div key={date} className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 w-10 flex-shrink-0">{dayLabel}</span>
                  <div className="flex-1 h-8 rounded-lg bg-slate-50 relative overflow-hidden">
                    <div
                      className="absolute top-0 h-full rounded-lg bg-gradient-to-r from-orange-300 to-orange-500 flex items-center justify-between px-2"
                      style={{ left: `${minPos}%`, width: `${widthPct}%` }}
                    >
                      <span className="text-[10px] font-bold text-white">{daily.tempMin[i].toFixed(0)}°</span>
                      <span className="text-[10px] font-bold text-white">{daily.tempMax[i].toFixed(0)}°</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Droplets className="h-5 w-5 text-blue-500" />
            <h3 className="text-sm font-semibold text-slate-800">{t('weather.humidityPct')}</h3>
          </div>
          <div className="space-y-3">
            {daily.time.map((date, i) => {
              const dayLabel = new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
              return (
                <div key={date} className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 w-10 flex-shrink-0">{dayLabel}</span>
                  <div className="flex-1 h-8 rounded-lg bg-slate-50 overflow-hidden border border-blue-100">
                    <div
                      className="h-full rounded-lg bg-gradient-to-r from-blue-300 to-blue-600 flex items-center justify-end pr-2"
                      style={{ width: `${daily.humidityAvg[i]}%` }}
                    >
                      <span className="text-[10px] font-bold text-white">{daily.humidityAvg[i].toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Infection risk context */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Wind className="h-5 w-5 text-slate-600" />
          <h3 className="text-sm font-semibold text-slate-800">{t('weather.infectionRisk')}</h3>
        </div>
        <div className="rounded-xl border border-slate-100 p-4">
          {(() => {
            const avgTemp = daily.tempMax.reduce((a, b) => a + b, 0) / daily.time.length;
            const avgHum = daily.humidityAvg.reduce((a, b) => a + b, 0) / daily.time.length;
            const riskScore = (avgHum / 100) * 0.5 + ((avgTemp - 10) / 25) * 0.5;
            const riskLevel =
              riskScore < 0.35
                ? { label: t('weather.riskLow'), color: 'text-green-600 bg-green-50' }
                : riskScore < 0.6
                  ? { label: t('weather.riskModerate'), color: 'text-amber-600 bg-amber-50' }
                  : { label: t('weather.riskHigh'), color: 'text-orange-600 bg-orange-50' };

            return (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`rounded-lg px-2.5 py-1 text-xs font-bold ${riskLevel.color}`}>
                    {riskLevel.label} Risk
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {t('weather.riskContext', { temp: avgTemp.toFixed(1), humidity: avgHum.toFixed(0) })}
                </p>
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
