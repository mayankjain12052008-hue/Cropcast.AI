import { useState } from 'react';
import type { Medicine } from '@/lib/types';
import { Pill, Beaker, Droplet, Clock, Calendar, Info, Leaf, FlaskConical, Shield } from 'lucide-react';
import { useTranslation } from '@/lib/LanguageContext';
import SafetyChecklistModal from './SafetyChecklistModal';

const TYPE_STYLES: Record<string, { bg: string; text: string; icon: typeof Pill; labelKey: string }> = {
  fungicide: { bg: 'bg-green-100', text: 'text-green-700', icon: FlaskConical, labelKey: 'medicine.fungicide' },
  biocontrol: { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: Leaf, labelKey: 'medicine.biocontrol' },
  bactericide: { bg: 'bg-blue-100', text: 'text-blue-700', icon: FlaskConical, labelKey: 'medicine.bactericide' },
  insecticide: { bg: 'bg-orange-100', text: 'text-orange-700', icon: FlaskConical, labelKey: 'medicine.insecticide' },
};

interface MedicineCardProps {
  medicine: Medicine;
  showPriority?: boolean;
}

export default function MedicineCard({ medicine, showPriority }: MedicineCardProps) {
  const { t } = useTranslation();
  const [safetyOpen, setSafetyOpen] = useState(false);
  const style = TYPE_STYLES[medicine.type] || TYPE_STYLES.fungicide;
  const TypeIcon = style.icon;

  const priorityLabelKey =
    medicine.priority === 1 ? 'medicine.primaryChoice' : medicine.priority === 2 ? 'medicine.alternative' : 'medicine.supplementary';

  return (
    <>
      <div className="rounded-xl border border-slate-200 bg-white p-4 transition-all hover:shadow-sm">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-bold text-slate-800">{medicine.name}</h4>
              <span className={`rounded-full ${style.bg} ${style.text} px-2 py-0.5 text-xs font-medium flex items-center gap-1`}>
                <TypeIcon className="h-3 w-3" />
                {t(style.labelKey)}
              </span>
            </div>
            {medicine.active_ingredient && (
              <p className="text-xs text-slate-400 mt-0.5">
                {t('medicine.active', { ingredient: medicine.active_ingredient })}
              </p>
            )}
          </div>
          {showPriority && (
            <span className={`flex-shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold ${
              medicine.priority === 1
                ? 'bg-green-50 text-green-700'
                : medicine.priority === 2
                  ? 'bg-slate-100 text-slate-600'
                  : 'bg-slate-50 text-slate-400'
            }`}>
              {t(priorityLabelKey)}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {medicine.dosage && (
            <DetailRow icon={<Beaker className="h-3.5 w-3.5" />} label={t('medicine.dosage')} value={medicine.dosage} />
          )}
          {medicine.application_method && (
            <DetailRow icon={<Droplet className="h-3.5 w-3.5" />} label={t('medicine.application')} value={medicine.application_method} />
          )}
          {medicine.frequency && (
            <DetailRow icon={<Clock className="h-3.5 w-3.5" />} label={t('medicine.frequency')} value={medicine.frequency} />
          )}
          {medicine.pre_harvest_interval && (
            <DetailRow icon={<Calendar className="h-3.5 w-3.5" />} label={t('medicine.preHarvest')} value={medicine.pre_harvest_interval} />
          )}
        </div>

        {medicine.notes && (
          <div className="mt-3 flex items-start gap-2 rounded-lg bg-slate-50 p-3">
            <Info className="h-3.5 w-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-slate-500 leading-relaxed">{medicine.notes}</p>
          </div>
        )}

        <button
          onClick={() => setSafetyOpen(true)}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-amber-200 bg-amber-50/60 px-3 py-2 text-xs font-semibold text-amber-700 transition-all hover:bg-amber-100 hover:border-amber-300"
        >
          <Shield className="h-3.5 w-3.5" />
          {t('medicine.viewSafetyRules')}
        </button>
      </div>

      <SafetyChecklistModal
        medicine={medicine}
        open={safetyOpen}
        onClose={() => setSafetyOpen(false)}
      />
    </>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-slate-400 flex-shrink-0 mt-0.5">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-400">{label}</p>
        <p className="text-xs text-slate-700">{value}</p>
      </div>
    </div>
  );
}
