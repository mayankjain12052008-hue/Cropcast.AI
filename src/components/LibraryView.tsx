import type { Disease, Crop, Medicine } from '@/lib/types';
import { RiskBadge } from './RiskGauge';
import MedicineCard from './MedicineCard';
import {
  BookOpen,
  Search,
  Thermometer,
  Droplets,
  Pill,
  Shield,
  FileText,
  ChevronDown,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { useTranslation } from '@/lib/LanguageContext';

interface LibraryViewProps {
  diseases: Disease[];
  crops: Crop[];
  medicines: Medicine[];
}

export default function LibraryView({ diseases, crops, medicines }: LibraryViewProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [filterCrop, setFilterCrop] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return diseases.filter((d) => {
      const crop = crops.find((c) => c.id === d.crop_id);
      const matchesSearch =
        !search ||
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.description?.toLowerCase().includes(search.toLowerCase()) ||
        d.pathogen_type.toLowerCase().includes(search.toLowerCase());
      const matchesCrop = filterCrop === 'all' || d.crop_id === filterCrop;
      return matchesSearch && matchesCrop;
    });
  }, [diseases, crops, search, filterCrop]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">{t('library.title')}</h2>
        <p className="text-sm text-slate-500 mt-1">
          {t('library.subtitle', { count: diseases.length })}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder={t('library.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 placeholder-slate-400 focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-100"
          />
        </div>
        <select
          value={filterCrop}
          onChange={(e) => setFilterCrop(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 focus:border-green-400 focus:outline-none"
        >
          <option value="all">{t('library.allCrops')}</option>
          {crops.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Disease cards */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white py-12 text-center">
            <BookOpen className="mx-auto h-10 w-10 text-slate-200" />
            <p className="mt-3 text-sm text-slate-400">{t('library.noMatch')}</p>
          </div>
        ) : (
          filtered.map((disease) => {
            const crop = crops.find((c) => c.id === disease.crop_id);
            const expanded = expandedId === disease.id;

            return (
              <div
                key={disease.id}
                className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden transition-all hover:shadow-md"
              >
                <button
                  onClick={() => setExpandedId(expanded ? null : disease.id)}
                  className="flex w-full items-center gap-4 p-5 text-left"
                >
                  {disease.image_url ? (
                    <img
                      src={disease.image_url}
                      alt={disease.name}
                      className="h-16 w-16 rounded-xl object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-xl bg-slate-100 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-slate-800">{disease.name}</h3>
                      <RiskBadge level={disease.severity} />
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 capitalize">
                        {disease.pathogen_type}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {crop?.name} ({crop?.scientific_name}) · {disease.temp_min_c}–{disease.temp_max_c}°C · {disease.humidity_min}–{disease.humidity_max}% humidity
                    </p>
                    <p className="text-sm text-slate-600 mt-1 line-clamp-1">{disease.description}</p>
                  </div>
                  <ChevronDown
                    className={`h-5 w-5 text-slate-400 flex-shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
                  />
                </button>

                {expanded && (
                  <div className="border-t border-slate-100 p-5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    {disease.description && (
                      <div>
                        <p className="text-sm text-slate-700 leading-relaxed">{disease.description}</p>
                      </div>
                    )}

                    <div className="grid sm:grid-cols-2 gap-3">
                      <div className="rounded-xl bg-orange-50/50 border border-orange-100 p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Thermometer className="h-4 w-4 text-orange-500" />
                          <p className="text-xs font-semibold text-slate-600">{t('library.tempRange')}</p>
                        </div>
                        <p className="text-sm font-bold text-slate-800">
                          {disease.temp_min_c}°C – {disease.temp_max_c}°C
                        </p>
                      </div>
                      <div className="rounded-xl bg-blue-50/50 border border-blue-100 p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Droplets className="h-4 w-4 text-blue-500" />
                          <p className="text-xs font-semibold text-slate-600">{t('library.humidityRange')}</p>
                        </div>
                        <p className="text-sm font-bold text-slate-800">
                          {disease.humidity_min}% – {disease.humidity_max}%
                        </p>
                      </div>
                    </div>

                    {disease.symptoms && (
                      <InfoBlock icon={<FileText className="h-4 w-4" />} title={t('library.symptoms')} text={disease.symptoms} />
                    )}
                    {disease.treatment && (
                      <InfoBlock icon={<Pill className="h-4 w-4 text-green-500" />} title={t('library.treatment')} text={disease.treatment} />
                    )}
                    {disease.prevention && (
                      <InfoBlock icon={<Shield className="h-4 w-4 text-amber-500" />} title={t('library.prevention')} text={disease.prevention} />
                    )}

                    {/* Medicines */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Pill className="h-4 w-4 text-green-600" />
                        <p className="text-xs font-semibold text-slate-600">{t('library.recommendedMedicines')}</p>
                      </div>
                      {(() => {
                        const meds = medicines.filter((m) => m.disease_id === disease.id);
                        if (meds.length === 0) {
                          return (
                            <p className="text-xs text-slate-400">
                              {t('library.noMedicineData')}
                            </p>
                          );
                        }
                        return (
                          <div className="space-y-2">
                            {meds.map((med) => (
                              <MedicineCard key={med.id} medicine={med} showPriority />
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function InfoBlock({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
      <div className="flex items-center gap-2 mb-1.5">
        {icon}
        <p className="text-xs font-semibold text-slate-600">{title}</p>
      </div>
      <p className="text-sm text-slate-700 leading-relaxed">{text}</p>
    </div>
  );
}
