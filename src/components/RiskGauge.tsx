import type { RiskAssessment } from '@/lib/types';
import { AlertTriangle, Shield, ShieldCheck, ShieldAlert } from 'lucide-react';
import { useTranslation } from '@/lib/LanguageContext';

interface RiskGaugeProps {
  risk: number;
  level: string;
}

export function RiskGauge({ risk, level }: RiskGaugeProps) {
  const { t } = useTranslation();
  const percentage = Math.round(risk * 100);
  const circumference = 2 * Math.PI * 52;
  const dashOffset = circumference * (1 - risk);

  const colors: Record<string, { stroke: string; text: string; bg: string }> = {
    low: { stroke: '#22c55e', text: 'text-green-600', bg: 'bg-green-50' },
    moderate: { stroke: '#f59e0b', text: 'text-amber-600', bg: 'bg-amber-50' },
    high: { stroke: '#f97316', text: 'text-orange-600', bg: 'bg-orange-50' },
    critical: { stroke: '#ef4444', text: 'text-red-600', bg: 'bg-red-50' },
  };

  const c = colors[level] || colors.low;
  const Icon = level === 'low' ? ShieldCheck : level === 'moderate' ? Shield : level === 'high' ? ShieldAlert : AlertTriangle;

  return (
    <div className="relative flex items-center justify-center">
      <svg width={140} height={140} className="-rotate-90">
        <circle cx={70} cy={70} r={52} fill="none" stroke="#e2e8f0" strokeWidth={8} />
        <circle
          cx={70}
          cy={70}
          r={52}
          fill="none"
          stroke={c.stroke}
          strokeWidth={8}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={`text-2xl font-bold ${c.text}`}>{percentage}%</span>
        <span className="text-xs text-slate-400">{t('scan.riskLevel')}</span>
      </div>
    </div>
  );
}

interface RiskBadgeProps {
  level: string;
}

export function RiskBadge({ level }: RiskBadgeProps) {
  const { t } = useTranslation();
  const styles: Record<string, string> = {
    low: 'bg-green-100 text-green-700 ring-green-200',
    moderate: 'bg-amber-100 text-amber-700 ring-amber-200',
    high: 'bg-orange-100 text-orange-700 ring-orange-200',
    critical: 'bg-red-100 text-red-700 ring-red-200',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ${styles[level] || styles.low}`}
    >
      {level === 'critical'
        ? t('history.criticalRisk')
        : t(`weather.risk${level.charAt(0).toUpperCase()}${level.slice(1)}`)}
    </span>
  );
}

interface ConfidenceBarProps {
  confidence: number;
  label?: string;
}

export function ConfidenceBar({ confidence, label }: ConfidenceBarProps) {
  const { t } = useTranslation();
  const percentage = Math.round(confidence * 100);
  const color = confidence >= 0.8 ? '#22c55e' : confidence >= 0.6 ? '#f59e0b' : '#ef4444';

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium text-slate-500">{label || t('scan.confidence')}</span>
        <span className="text-xs font-bold text-slate-700">{percentage}%</span>
      </div>
      <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
