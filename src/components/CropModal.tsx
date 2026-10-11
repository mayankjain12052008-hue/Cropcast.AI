import { useState } from 'react';
import type { Crop } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { Sprout, X, Loader2, Plus, Check } from 'lucide-react';
import { useTranslation } from '@/lib/LanguageContext';

interface CropModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (crop: Crop) => void;
}

interface DiseaseForm {
  name: string;
  pathogen_type: string;
  severity: string;
  symptoms: string;
  treatment: string;
  prevention: string;
  temp_min_c: string;
  temp_max_c: string;
  humidity_min: string;
  humidity_max: string;
}

const DEFAULT_DISEASE: DiseaseForm = {
  name: '',
  pathogen_type: 'fungal',
  severity: 'moderate',
  symptoms: '',
  treatment: '',
  prevention: '',
  temp_min_c: '15',
  temp_max_c: '30',
  humidity_min: '60',
  humidity_max: '95',
};

export default function CropModal({ open, onClose, onCreated }: CropModalProps) {
  const { t } = useTranslation();
  const [cropName, setCropName] = useState('');
  const [scientificName, setScientificName] = useState('');
  const [diseases, setDiseases] = useState<DiseaseForm[]>([{ ...DEFAULT_DISEASE }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const updateDisease = (index: number, field: keyof DiseaseForm, value: string) => {
    setDiseases((prev) =>
      prev.map((d, i) => (i === index ? { ...d, [field]: value } : d))
    );
  };

  const addDisease = () => {
    setDiseases((prev) => [...prev, { ...DEFAULT_DISEASE }]);
  };

  const removeDisease = (index: number) => {
    setDiseases((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setError('');

    if (!cropName.trim()) {
      setError(t('cropModal.enterCropName'));
      return;
    }

    const validDiseases = diseases.filter((d) => d.name.trim());
    if (validDiseases.length === 0) {
      setError(t('cropModal.addOneDisease'));
      return;
    }

    setSaving(true);

    try {
      const { data: cropData, error: cropErr } = await supabase
        .from('crops')
        .insert({
          name: cropName.trim(),
          scientific_name: scientificName.trim() || null,
        })
        .select()
        .single();

      if (cropErr) throw cropErr;

      const crop = cropData as Crop;

      const diseaseRows = validDiseases.map((d) => ({
        crop_id: crop.id,
        name: d.name.trim(),
        pathogen_type: d.pathogen_type,
        severity: d.severity,
        symptoms: d.symptoms.trim() || null,
        treatment: d.treatment.trim() || null,
        prevention: d.prevention.trim() || null,
        temp_min_c: parseFloat(d.temp_min_c) || 15,
        temp_max_c: parseFloat(d.temp_max_c) || 30,
        humidity_min: parseFloat(d.humidity_min) || 60,
        humidity_max: parseFloat(d.humidity_max) || 95,
        base_confidence: 0.75,
        description: `${d.name.trim()} affecting ${cropName.trim()}.`,
      }));

      const { error: diseaseErr } = await supabase
        .from('diseases')
        .insert(diseaseRows);

      if (diseaseErr) throw diseaseErr;

      onCreated(crop);
      setCropName('');
      setScientificName('');
      setDiseases([{ ...DEFAULT_DISEASE }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('cropModal.createFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (saving) return;
    setCropName('');
    setScientificName('');
    setDiseases([{ ...DEFAULT_DISEASE }]);
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <div className="flex items-center gap-2">
            <Sprout className="h-5 w-5 text-green-600" />
            <h2 className="text-lg font-bold text-slate-800">{t('cropModal.title')}</h2>
          </div>
          <button
            onClick={handleClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 p-6">
          {/* Crop info */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-700">{t('cropModal.cropDetails')}</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">
                  {t('cropModal.cropName')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={cropName}
                  onChange={(e) => setCropName(e.target.value)}
                  placeholder="e.g. Soybean, Cotton, Potato"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-100"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">
                  {t('cropModal.scientificName')}
                </label>
                <input
                  type="text"
                  value={scientificName}
                  onChange={(e) => setScientificName(e.target.value)}
                  placeholder="e.g. Glycine max"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-100"
                />
              </div>
            </div>
          </div>

          {/* Diseases */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700">
                {t('cropModal.knownDiseases', { count: diseases.length })}
              </h3>
              <button
                onClick={addDisease}
                className="flex items-center gap-1 rounded-lg bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100"
              >
                <Plus className="h-3.5 w-3.5" />
                {t('cropModal.addDisease')}
              </button>
            </div>

            <p className="text-xs text-slate-400">
              {t('cropModal.diseaseDesc')}
            </p>

            {diseases.map((disease, index) => (
              <div
                key={index}
                className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">
                    Disease {index + 1}
                  </span>
                  {diseases.length > 1 && (
                    <button
                      onClick={() => removeDisease(index)}
                      className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">
                      {t('cropModal.diseaseName')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={disease.name}
                      onChange={(e) => updateDisease(index, 'name', e.target.value)}
                      placeholder="e.g. Soybean Rust"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-100"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">
                      {t('cropModal.pathogenType')}
                    </label>
                    <select
                      value={disease.pathogen_type}
                      onChange={(e) => updateDisease(index, 'pathogen_type', e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-green-400 focus:outline-none"
                    >
                      <option value="fungal">{t('common.pathogen.fungal')}</option>
                      <option value="oomycete">{t('common.pathogen.oomycete')}</option>
                      <option value="bacterial">{t('common.pathogen.bacterial')}</option>
                      <option value="viral">{t('common.pathogen.viral')}</option>
                      <option value="nutrient">{t('common.pathogen.nutrient')}</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">
                    {t('cropModal.severity')}
                  </label>
                  <div className="flex gap-2">
                    {['low', 'moderate', 'severe'].map((sev) => (
                      <button
                        key={sev}
                        onClick={() => updateDisease(index, 'severity', sev)}
                        className={`flex-1 rounded-lg border px-3 py-1.5 text-xs font-medium capitalize transition-all ${
                          disease.severity === sev
                            ? sev === 'low'
                              ? 'border-green-300 bg-green-50 text-green-700'
                              : sev === 'moderate'
                                ? 'border-amber-300 bg-amber-50 text-amber-700'
                                : 'border-red-300 bg-red-50 text-red-700'
                            : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        {t(`common.severity.${sev}`)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">{t('cropModal.symptoms')}</label>
                  <textarea
                    value={disease.symptoms}
                    onChange={(e) => updateDisease(index, 'symptoms', e.target.value)}
                    placeholder="Describe visual symptoms farmers should look for..."
                    rows={2}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">{t('cropModal.treatment')}</label>
                    <input
                      type="text"
                      value={disease.treatment}
                      onChange={(e) => updateDisease(index, 'treatment', e.target.value)}
                      placeholder="Recommended fungicide or action"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-100"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">{t('cropModal.prevention')}</label>
                    <input
                      type="text"
                      value={disease.prevention}
                      onChange={(e) => updateDisease(index, 'prevention', e.target.value)}
                      placeholder="Preventive measures"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">{t('cropModal.tempMin')}</label>
                    <input
                      type="number"
                      value={disease.temp_min_c}
                      onChange={(e) => updateDisease(index, 'temp_min_c', e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-2 py-2 text-sm text-slate-700 focus:border-green-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">{t('cropModal.tempMax')}</label>
                    <input
                      type="number"
                      value={disease.temp_max_c}
                      onChange={(e) => updateDisease(index, 'temp_max_c', e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-2 py-2 text-sm text-slate-700 focus:border-green-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">{t('cropModal.humMin')}</label>
                    <input
                      type="number"
                      value={disease.humidity_min}
                      onChange={(e) => updateDisease(index, 'humidity_min', e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-2 py-2 text-sm text-slate-700 focus:border-green-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">{t('cropModal.humMax')}</label>
                    <input
                      type="number"
                      value={disease.humidity_max}
                      onChange={(e) => updateDisease(index, 'humidity_max', e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-2 py-2 text-sm text-slate-700 focus:border-green-400 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-slate-200 bg-white px-6 py-4">
          <button
            onClick={handleClose}
            disabled={saving}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50"
          >
            {t('history.cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-green-600 to-emerald-700 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-green-600/20 transition-all hover:shadow-xl disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('cropModal.creating')}
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                {t('cropModal.createCrop')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
