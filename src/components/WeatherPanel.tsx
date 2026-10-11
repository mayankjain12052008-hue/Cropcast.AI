import type { WeatherTrend } from '@/lib/types';
import { CloudSun, Droplets, Thermometer, TrendingUp, TrendingDown } from 'lucide-react';
import Sparkline from './Sparkline';
import { useTranslation } from '@/lib/LanguageContext';

interface WeatherPanelProps {
  weather: WeatherTrend | null;
  fieldLabel: string;
  compact?: boolean;
}

export default function WeatherPanel({ weather, fieldLabel, compact }: WeatherPanelProps) {
  const { t } = useTranslation();

  if (!weather) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <p className="text-sm text-slate-400">{t('weatherPanel.noData', { field: fieldLabel })}</p>
      </div>
    );
  }

  const tempRising =
    weather.tempTrend.length >= 2 &&
    weather.tempTrend[weather.tempTrend.length - 1] >
      weather.tempTrend[Math.max(weather.tempTrend.length - 4, 0)];
  const humidityRising =
    weather.humidityTrend.length >= 2 &&
    weather.humidityTrend[weather.humidityTrend.length - 1] >
      weather.humidityTrend[Math.max(weather.humidityTrend.length - 4, 0)];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CloudSun className="h-5 w-5 text-amber-500" />
          <h3 className="text-sm font-semibold text-slate-800">
            {t('weatherPanel.weather', { field: fieldLabel })}
          </h3>
        </div>
        <span className="text-xs text-slate-400">{t('weatherPanel.7dayTrend')}</span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 p-4 border border-orange-100">
          <div className="flex items-center justify-between mb-1">
            <Thermometer className="h-4 w-4 text-orange-500" />
            {tempRising ? (
              <TrendingUp className="h-3.5 w-3.5 text-orange-500" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5 text-slate-400" />
            )}
          </div>
          <p className="text-2xl font-bold text-slate-800">
            {weather.latestTemp.toFixed(1)}°C
          </p>
          <p className="text-xs text-slate-500">{t('weatherPanel.avg')} {weather.avgTemp.toFixed(1)}°C</p>
        </div>

        <div className="rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 p-4 border border-blue-100">
          <div className="flex items-center justify-between mb-1">
            <Droplets className="h-4 w-4 text-blue-500" />
            {humidityRising ? (
              <TrendingUp className="h-3.5 w-3.5 text-blue-500" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5 text-slate-400" />
            )}
          </div>
          <p className="text-2xl font-bold text-slate-800">
            {weather.latestHumidity.toFixed(0)}%
          </p>
          <p className="text-xs text-slate-500">{t('weatherPanel.avg')} {weather.avgHumidity.toFixed(0)}%</p>
        </div>
      </div>

      {!compact && (
        <div className="space-y-3">
          <div>
            <p className="text-xs font-medium text-slate-500 mb-1">{t('weatherPanel.tempC')}</p>
            <Sparkline data={weather.tempTrend} color="#f97316" unit="°" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 mb-1">{t('weatherPanel.humidityPct')}</p>
            <Sparkline data={weather.humidityTrend} color="#3b82f6" unit="%" />
          </div>
        </div>
      )}

      {compact && (
        <div className="flex gap-4">
          <Sparkline data={weather.tempTrend} color="#f97316" height={36} width={120} unit="°" />
          <Sparkline data={weather.humidityTrend} color="#3b82f6" height={36} width={120} unit="%" />
        </div>
      )}
    </div>
  );
}
