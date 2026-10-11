import type { Diagnostic, Advisory, Crop, Disease, Medicine } from '@/lib/types';
import { RiskBadge, ConfidenceBar } from './RiskGauge';
import ConfirmDialog from './ConfirmDialog';
import MedicineCard from './MedicineCard';
import { Sprout, Trash2, Search, Filter, Calendar, MapPin, ScanLine, Pill, ChevronDown } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useTranslation } from '@/lib/LanguageContext';

interface HistoryViewProps {
  diagnostics: Diagnostic[];
  advisories: Advisory[];
  crops: Crop[];
  medicines: Medicine[];
  diseases: Disease[];
  onDelete: (id: string) => void;
}

export default function HistoryView({ diagnostics, advisories, crops, medicines, diseases, onDelete }: HistoryViewProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [filterField, setFilterField] = useState('all');
  const [filterRisk, setFilterRisk] = useState('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fields = useMemo(() => {
    return [...new Set(diagnostics.map((d) => d.field_label))];
  }, [diagnostics]);

  const filtered = useMemo(() => {
    return diagnostics.filter((d) => {
      const advisory = advisories.find((a) => a.diagnostic_id === d.id);
      const crop = crops.find((c) => c.id === d.crop_id);

      const matchesSearch =
        !search ||
        d.identified_disease?.toLowerCase().includes(search.toLowerCase()) ||
        crop?.name.toLowerCase().includes(search.toLowerCase()) ||
        d.field_label.toLowerCase().includes(search.toLowerCase());

      const matchesField = filterField === 'all' || d.field_label === filterField;
      const matchesRisk =
        filterRisk === 'all' || advisory?.risk_level === filterRisk;

      return matchesSearch && matchesField && matchesRisk;
    });
  }, [diagnostics, advisories, crops, search, filterField, filterRisk]);

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    await onDelete(deleteId);
    setDeleting(false);
    setDeleteId(null);
  };

  if (diagnostics.length === 0) {
    return (
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold text-slate-800 mb-1">{t('history.title')}</h2>
        <p className="text-sm text-slate-500 mb-6">{t('history.subtitle')}</p>
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-20 text-center">
          <Calendar className="mx-auto h-14 w-14 text-slate-200" />
          <h3 className="mt-4 text-lg font-semibold text-slate-700">{t('history.noScans')}</h3>
          <p className="text-sm text-slate-400 mt-1 mb-4">
            {t('history.noScansDesc')}
          </p>
          <div className="flex justify-center">
            <div className="flex items-center gap-2 rounded-xl bg-green-50 px-4 py-2.5 text-sm font-medium text-green-700">
              <ScanLine className="h-4 w-4" />
              {t('history.goToScan')}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">{t('history.title')}</h2>
        <p className="text-sm text-slate-500 mt-1">
          {t('history.total', { count: diagnostics.length })}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder={t('history.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 placeholder-slate-400 focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-100"
          />
        </div>
        <select
          value={filterField}
          onChange={(e) => setFilterField(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 focus:border-green-400 focus:outline-none"
        >
          <option value="all">{t('history.allFields')}</option>
          {fields.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
        <select
          value={filterRisk}
          onChange={(e) => setFilterRisk(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 focus:border-green-400 focus:outline-none"
        >
          <option value="all">{t('history.allRiskLevels')}</option>
          <option value="low">{t('history.lowRisk')}</option>
          <option value="moderate">{t('history.moderateRisk')}</option>
          <option value="high">{t('history.highRisk')}</option>
          <option value="critical">{t('history.criticalRisk')}</option>
        </select>
      </div>

      {/* List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white py-12 text-center">
            <Filter className="mx-auto h-10 w-10 text-slate-200" />
            <p className="mt-3 text-sm text-slate-400">{t('history.noMatch')}</p>
          </div>
        ) : (
          filtered.map((diagnostic) => {
            const advisory = advisories.find((a) => a.diagnostic_id === diagnostic.id);
            const crop = crops.find((c) => c.id === diagnostic.crop_id);

            return (
              <div
                key={diagnostic.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md"
              >
                <div className="flex flex-col sm:flex-row gap-4">
                  {diagnostic.image_url ? (
                    <img
                      src={diagnostic.image_url}
                      alt=""
                      className="h-32 w-full sm:w-32 rounded-xl object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="h-32 w-full sm:w-32 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                      <Sprout className="h-10 w-10 text-slate-300" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-bold text-slate-800">
                            {diagnostic.identified_disease || t('history.unknownDisease')}
                          </h3>
                          {advisory && <RiskBadge level={advisory.risk_level} />}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <Sprout className="h-3 w-3" />
                            {crop?.name || t('history.unknownCrop')}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {diagnostic.field_label}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(diagnostic.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => setDeleteId(diagnostic.id)}
                        className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                        title={t('history.delete')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {advisory && (
                      <div className="mt-3 space-y-2">
                        <div className="grid grid-cols-2 gap-3">
                          <ConfidenceBar
                            confidence={diagnostic.confidence_score}
                            label={t('history.detectionConfidence')}
                          />
                          <ConfidenceBar
                            confidence={advisory.confidence_calibrated}
                            label={t('history.calibratedConfidence')}
                          />
                        </div>
                        <div className="flex items-center gap-2 flex-wrap mt-2">
                          {advisory.spray_recommended ? (
                            <span className="rounded-lg bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                              {t('history.sprayUrgency', { urgency: advisory.spray_urgency })}
                            </span>
                          ) : (
                            <span className="rounded-lg bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                              {t('history.noSprayNeeded')}
                            </span>
                          )}
                          <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                            {t('history.risk', { percent: Math.round(advisory.secondary_infection_risk * 100) })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                          {advisory.recommendation}
                        </p>
                      </div>
                    )}

                    {/* Expandable medicines */}
                    <button
                      onClick={() => setExpandedId(expandedId === diagnostic.id ? null : diagnostic.id)}
                      className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-green-600 hover:text-green-700 transition-colors"
                    >
                      <Pill className="h-3.5 w-3.5" />
                      {expandedId === diagnostic.id ? t('history.hideMedicines') : t('history.showMedicines')}
                      <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expandedId === diagnostic.id ? 'rotate-180' : ''}`} />
                    </button>
                    {expandedId === diagnostic.id && (
                      <div className="mt-3 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                        {(() => {
                          const disease = diseases.find((d) => d.id === diagnostic.disease_id);
                          if (!disease) return (
                            <p className="text-xs text-slate-400">{t('history.diseaseNotFound')}</p>
                          );
                          const meds = medicines.filter((m) => m.disease_id === disease.id);
                          if (meds.length === 0) return (
                            <p className="text-xs text-slate-400">{t('history.noMedicineData')}</p>
                          );
                          return meds.map((med) => (
                            <MedicineCard key={med.id} medicine={med} showPriority />
                          ));
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <ConfirmDialog
        open={!!deleteId}
        title={t('history.deleteTitle')}
        message={t('history.deleteMsg')}
        confirmLabel={t('history.delete')}
        cancelLabel={t('history.cancel')}
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
