import { useMemo } from 'react';
import {
  AlertTriangle,
  Snowflake,
  Thermometer,
  CloudRain,
  CloudDrizzle,
  Droplets,
  Wind,
  TrendingDown,
  TrendingUp,
  Gauge,
  Zap,
  ChevronRight,
} from 'lucide-react';
import type { WeatherAlert } from '@/lib/weatherAlerts';
import { useTranslation } from '@/lib/LanguageContext';

const ICON_MAP: Record<string, typeof AlertTriangle> = {
  Snowflake,
  Thermometer,
  CloudRain,
  CloudDrizzle,
  Droplets,
  Wind,
  TrendingDown,
  TrendingUp,
  Gauge,
  Zap,
};

interface WeatherAlertBannerProps {
  alerts: WeatherAlert[];
  onViewDetails?: () => void;
  compact?: boolean;
}

export function WeatherAlertBanner({ alerts, onViewDetails, compact }: WeatherAlertBannerProps) {
  const { t } = useTranslation();

  if (alerts.length === 0) return null;

  const dangerCount = alerts.filter((a) => a.severity === 'danger').length;
  const warningCount = alerts.filter((a) => a.severity === 'warning').length;

  return (
    <div
      className={`rounded-2xl border-2 ${
        dangerCount > 0
          ? 'border-red-200 bg-gradient-to-br from-red-50 to-orange-50'
          : 'border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50'
      } shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300`}
    >
      <div className="flex items-center gap-2 px-5 py-3 border-b border-red-200/50">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-lg ${
            dangerCount > 0 ? 'bg-red-500' : 'bg-amber-500'
          } text-white animate-pulse`}
        >
          <AlertTriangle className="h-4 w-4" />
        </div>
        <h3 className="text-sm font-bold text-slate-800 flex-1">{t('alert.heading')}</h3>
        <div className="flex items-center gap-2">
          {dangerCount > 0 && (
            <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-700">
              {dangerCount} Danger
            </span>
          )}
          {warningCount > 0 && (
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700">
              {warningCount} Warning{warningCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      <div className="divide-y divide-amber-100/60">
        {alerts.map((alert) => {
          const Icon = ICON_MAP[alert.icon] || AlertTriangle;
          const isDanger = alert.severity === 'danger';
          return (
            <div
              key={alert.key}
              className={`flex items-start gap-3 px-5 py-3 ${
                isDanger ? 'bg-red-50/40' : ''
              }`}
            >
              <div
                className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${
                  isDanger
                    ? 'bg-red-100 text-red-600'
                    : 'bg-amber-100 text-amber-600'
                }`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800">{t(alert.titleKey)}</p>
                {!compact && (
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                    {t(alert.messageKey)}
                  </p>
                )}
                {compact && (
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                    {t(alert.messageKey)}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {onViewDetails && (
        <button
          onClick={onViewDetails}
          className="flex w-full items-center justify-center gap-1 border-t border-amber-200/50 bg-white/50 px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-white transition-colors"
        >
          {t('alert.viewDetails')}
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
