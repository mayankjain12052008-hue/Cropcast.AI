import { useState } from 'react';
import {
  Shield,
  X,
  CheckCircle2,
  Circle,
  HardHat,
  Wind,
  Droplets,
  Sun,
  Clock,
  RotateCw,
  Ban,
  HandHeart,
  FlaskConical,
  Leaf,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { useTranslation } from '@/lib/LanguageContext';
import type { Medicine } from '@/lib/types';

interface SafetyChecklistModalProps {
  medicine: Medicine | null;
  open: boolean;
  onClose: () => void;
}

interface ChecklistItem {
  key: string;
  icon: typeof Shield;
}

const CHECKLIST_ITEMS: ChecklistItem[] = [
  { key: 'ppe', icon: HardHat },
  { key: 'weather', icon: Wind },
  { key: 'timing', icon: Sun },
  { key: 'label', icon: FlaskConical },
  { key: 'rotation', icon: RotateCw },
  { key: 'children', icon: Ban },
  { key: 'hygiene', icon: HandHeart },
  { key: 'phi', icon: Clock },
  { key: 'disposal', icon: Leaf },
];

export default function SafetyChecklistModal({ medicine, open, onClose }: SafetyChecklistModalProps) {
  const { t } = useTranslation();
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [acknowledged, setAcknowledged] = useState(false);

  if (!open || !medicine) return null;

  const allChecked = checked.size === CHECKLIST_ITEMS.length;
  const toggle = (key: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleClose = () => {
    setChecked(new Set());
    setAcknowledged(false);
    onClose();
  };

  const handleAcknowledge = () => {
    setAcknowledged(true);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white shadow-md">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">{t('safety.title')}</h3>
              <p className="text-xs text-slate-500">{medicine.name}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-white/60 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {!acknowledged ? (
          <>
            {/* Warning banner */}
            <div className="mx-6 mt-4 rounded-xl border border-amber-200 bg-amber-50/60 p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 leading-relaxed">
                  {t('safety.intro')}
                </p>
              </div>
            </div>

            {/* Checklist */}
            <div className="px-6 py-4 space-y-2.5">
              <p className="text-sm font-semibold text-slate-700 mb-2">
                {t('safety.checklistHeading')}
              </p>
              {CHECKLIST_ITEMS.map((item) => {
                const Icon = item.icon;
                const isChecked = checked.has(item.key);
                return (
                  <button
                    key={item.key}
                    onClick={() => toggle(item.key)}
                    className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-all ${
                      isChecked
                        ? 'border-green-200 bg-green-50/60'
                        : 'border-slate-200 bg-white hover:border-amber-200 hover:bg-amber-50/30'
                    }`}
                  >
                    <span className="flex-shrink-0 mt-0.5">
                      {isChecked ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <Circle className="h-5 w-5 text-slate-300" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Icon className={`h-3.5 w-3.5 ${isChecked ? 'text-green-600' : 'text-slate-400'}`} />
                        <p className={`text-sm font-semibold ${isChecked ? 'text-green-800' : 'text-slate-700'}`}>
                          {t(`safety.${item.key}.title`)}
                        </p>
                      </div>
                      <p className={`text-xs mt-0.5 leading-relaxed ${isChecked ? 'text-green-700' : 'text-slate-500'}`}>
                        {t(`safety.${item.key}.desc`)}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Progress bar */}
            <div className="px-6 pb-2">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-slate-500">
                  {checked.size} / {CHECKLIST_ITEMS.length} {t('safety.completed')}
                </span>
                {allChecked && (
                  <span className="text-xs font-semibold text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {t('safety.ready')}
                  </span>
                )}
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 to-green-500 transition-all duration-300"
                  style={{ width: `${(checked.size / CHECKLIST_ITEMS.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-slate-100 bg-white px-6 py-4">
              <button
                onClick={handleClose}
                className="rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
              >
                {t('safety.cancel')}
              </button>
              <button
                onClick={handleAcknowledge}
                disabled={!allChecked}
                className="flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {t('safety.acknowledge')}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </>
        ) : (
          <div className="px-6 py-10 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-slate-800">{t('safety.acknowledgedTitle')}</h3>
            <p className="mt-2 text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
              {t('safety.acknowledgedMsg', { medicine: medicine.name })}
            </p>

            {/* Medicine application summary */}
            <div className="mt-6 mx-auto max-w-sm rounded-xl border border-slate-200 bg-slate-50 p-4 text-left space-y-2">
              {medicine.dosage && (
                <div className="flex items-center gap-2">
                  <FlaskConical className="h-4 w-4 text-slate-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400">{t('medicine.dosage')}</p>
                    <p className="text-sm font-medium text-slate-700">{medicine.dosage}</p>
                  </div>
                </div>
              )}
              {medicine.application_method && (
                <div className="flex items-center gap-2">
                  <Droplets className="h-4 w-4 text-slate-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400">{t('medicine.application')}</p>
                    <p className="text-sm font-medium text-slate-700">{medicine.application_method}</p>
                  </div>
                </div>
              )}
              {medicine.pre_harvest_interval && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-slate-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400">{t('medicine.preHarvest')}</p>
                    <p className="text-sm font-medium text-slate-700">{medicine.pre_harvest_interval}</p>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleClose}
              className="mt-6 rounded-lg bg-slate-800 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-700 transition-colors"
            >
              {t('safety.done')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
