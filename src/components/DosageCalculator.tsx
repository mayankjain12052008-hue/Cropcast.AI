import { useMemo, useState, useEffect, useRef } from 'react';
import type { Crop, Disease, Medicine } from '@/lib/types';
import { useTranslation } from '@/lib/LanguageContext';
import {
  Calculator, Beaker, Droplet, FlaskConical, Leaf, RotateCcw, Info,
  ChevronRight, Sprout, Pill, Check, Ruler, AlertTriangle, Clock,
  Calendar, Layers, ArrowRight, Sparkles,
} from 'lucide-react';

interface DosageCalculatorProps {
  crops: Crop[];
  diseases: Disease[];
  medicines: Medicine[];
}

interface ParsedDosage {
  amountPerLiter: number;
  unit: string;
  rawText: string;
}

function parseDosage(raw: string | null): ParsedDosage | null {
  if (!raw) return null;
  const match = raw.match(/([\d.]+)\s*(mL|ml|g|kg|L)\s*\/\s*L/i);
  if (!match) return null;
  return { amountPerLiter: parseFloat(match[1]), unit: match[2].toLowerCase(), rawText: raw };
}

const SPRAY_VOLUME_PER_ACRE_L = 150;
const ACRE_TO_HECTARE = 0.4047;

export default function DosageCalculator({ crops, diseases, medicines }: DosageCalculatorProps) {
  const { t } = useTranslation();
  const [cropId, setCropId] = useState('');
  const [diseaseId, setDiseaseId] = useState('');
  const [medicineId, setMedicineId] = useState('');
  const [landSize, setLandSize] = useState('');
  const [unit, setUnit] = useState<'acres' | 'hectares'>('acres');

  const cropDiseases = useMemo(() => diseases.filter((d) => d.crop_id === cropId), [diseases, cropId]);
  const diseaseMedicines = useMemo(() => medicines.filter((m) => m.disease_id === diseaseId), [medicines, diseaseId]);
  const selectedMedicine = diseaseMedicines.find((m) => m.id === medicineId);
  const parsedDosage = selectedMedicine ? parseDosage(selectedMedicine.dosage) : null;
  const selectedCrop = crops.find((c) => c.id === cropId);
  const selectedDisease = diseases.find((d) => d.id === diseaseId);

  const landAcres = useMemo(() => {
    const size = parseFloat(landSize);
    if (!size || isNaN(size)) return 0;
    return unit === 'hectares' ? size / ACRE_TO_HECTARE : size;
  }, [landSize, unit]);

  const result = useMemo(() => {
    if (!parsedDosage || landAcres <= 0) return null;
    const totalWaterL = landAcres * SPRAY_VOLUME_PER_ACRE_L;
    const totalProduct = totalWaterL * parsedDosage.amountPerLiter;
    const productUnit = parsedDosage.unit === 'ml' ? 'mL' : parsedDosage.unit === 'g' ? 'g' : parsedDosage.unit === 'kg' ? 'kg' : 'L';

    let displayAmount = totalProduct;
    let displayUnit = productUnit;
    if (productUnit === 'mL' && totalProduct >= 1000) { displayAmount = totalProduct / 1000; displayUnit = 'L'; }
    else if (productUnit === 'g' && totalProduct >= 1000) { displayAmount = totalProduct / 1000; displayUnit = 'kg'; }

    const ratio = parsedDosage.amountPerLiter;
    const ratioLabel = `${parsedDosage.amountPerLiter} ${parsedDosage.unit}/L`;

    return {
      totalWaterL: Math.round(totalWaterL),
      totalProduct: displayAmount,
      productUnit: displayUnit,
      ratio,
      ratioLabel,
    };
  }, [parsedDosage, landAcres]);

  const stepsDone = [!!cropId, !!diseaseId, !!medicineId, !!landSize && parseFloat(landSize) > 0];
  const stepsCompleted = stepsDone.filter(Boolean).length;

  const reset = () => { setCropId(''); setDiseaseId(''); setMedicineId(''); setLandSize(''); };
  const noMedicines = diseaseId && diseaseMedicines.length === 0;

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-green-950 to-emerald-900 p-6 sm:p-8 shadow-lg">
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-green-600/20 blur-3xl" />
        <div className="absolute -left-8 -bottom-12 h-40 w-40 rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="relative flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 shadow-lg shadow-green-500/30">
            <Calculator className="h-7 w-7 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{t('dosage.title')}</h2>
            <p className="text-sm text-green-200/80 mt-0.5">{t('dosage.subtitle')}</p>
          </div>
          {/* Progress indicator */}
          <div className="hidden sm:flex items-center gap-2">
            {stepsDone.map((done, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
                  done ? 'bg-green-500 text-white' : 'bg-white/10 text-white/40'
                }`}>
                  {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </div>
                {i < 3 && <div className={`h-0.5 w-6 rounded-full transition-all duration-300 ${stepsDone[i] ? 'bg-green-500' : 'bg-white/10'}`} />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Selection funnel — horizontal step flow */}
      <div className="grid sm:grid-cols-3 gap-3">
        <StepCard
          icon={<Sprout className="h-5 w-5" />}
          stepNum="1"
          label={t('dosage.selectCrop')}
          value={selectedCrop?.name}
          options={crops.map((c) => ({ id: c.id, label: c.name }))}
          done={!!cropId}
          onSelect={(id) => { setCropId(id); setDiseaseId(''); setMedicineId(''); }}
        />
        <StepCard
          icon={<Leaf className="h-5 w-5" />}
          stepNum="2"
          label={t('dosage.selectDisease')}
          value={selectedDisease?.name}
          options={cropDiseases.map((d) => ({ id: d.id, label: d.name }))}
          disabled={!cropId}
          done={!!diseaseId}
          onSelect={(id) => { setDiseaseId(id); setMedicineId(''); }}
        />
        <StepCard
          icon={<FlaskConical className="h-5 w-5" />}
          stepNum="3"
          label={t('dosage.selectMedicine')}
          value={selectedMedicine?.name}
          options={diseaseMedicines.map((m) => ({ id: m.id, label: m.name }))}
          disabled={!diseaseId}
          emptyLabel={noMedicines ? t('dosage.noMedicines') : undefined}
          done={!!medicineId}
          onSelect={(id) => setMedicineId(id)}
        />
      </div>

      {/* Land size — split panel with visual */}
      <div className="grid sm:grid-cols-5 gap-4">
        <div className="sm:col-span-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 text-green-700">
              <Ruler className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-700">{t('dosage.landSize')}</h3>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="number"
                min="0"
                step="0.1"
                value={landSize}
                onChange={(e) => setLandSize(e.target.value)}
                placeholder={t('dosage.landPlaceholder')}
                className="w-full rounded-xl border-2 border-slate-200 bg-slate-50/50 px-4 py-3.5 text-base font-semibold text-slate-800 placeholder-slate-300 outline-none transition focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/10"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                {unit === 'acres' ? t('dosage.acres') : t('dosage.hectares')}
              </span>
            </div>
            <div className="flex rounded-xl bg-slate-100 p-1">
              <button
                onClick={() => setUnit('acres')}
                className={`rounded-lg px-5 py-2.5 text-sm font-semibold transition ${unit === 'acres' ? 'bg-white text-green-700 shadow-sm' : 'text-slate-500'}`}
              >
                {t('dosage.acres')}
              </button>
              <button
                onClick={() => setUnit('hectares')}
                className={`rounded-lg px-5 py-2.5 text-sm font-semibold transition ${unit === 'hectares' ? 'bg-white text-green-700 shadow-sm' : 'text-slate-500'}`}
              >
                {t('dosage.hectares')}
              </button>
            </div>
          </div>
        </div>

        {/* Quick visual summary */}
        <div className="sm:col-span-2 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-green-50/50 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Layers className="h-4 w-4 text-slate-500" />
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{t('dosage.summary')}</p>
          </div>
          <div className="space-y-2">
            <SummaryRow label={t('dosage.cropLabel')} value={selectedCrop?.name} />
            <SummaryRow label={t('dosage.diseaseLabel')} value={selectedDisease?.name} />
            <SummaryRow label={t('dosage.medicineLabel')} value={selectedMedicine?.name} />
            <SummaryRow label={t('dosage.areaLabel')} value={landSize ? `${landSize} ${unit}` : null} />
          </div>
        </div>
      </div>

      {/* Results */}
      {result && selectedMedicine && parsedDosage && (
        <ResultPanel
          result={result}
          medicine={selectedMedicine}
          dosage={parsedDosage}
          landSize={landSize}
          unit={unit}
          t={t}
          onReset={reset}
        />
      )}

      {/* Empty state */}
      {!result && (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-gradient-to-br from-slate-50 to-green-50/30 p-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-green-100 to-emerald-100">
            <Pill className="h-8 w-8 text-green-400" />
          </div>
          <p className="text-sm font-semibold text-slate-500">{t('dosage.emptyHint')}</p>
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-400">
            <Sparkles className="h-3.5 w-3.5" />
            {stepsCompleted}/4 {t('dosage.stepsCompleted')}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Result Panel ─── */
function ResultPanel({
  result, medicine, dosage, landSize, unit, t, onReset,
}: {
  result: { totalWaterL: number; totalProduct: number; productUnit: string; ratio: number; ratioLabel: string };
  medicine: Medicine;
  dosage: ParsedDosage;
  landSize: string;
  unit: 'acres' | 'hectares';
  t: (k: string, p?: Record<string, string | number>) => string;
  onReset: () => void;
}) {
  const productStr = formatAmount(result.totalProduct);
  const ratioPercent = Math.min(dosage.amountPerLiter / (dosage.unit === 'ml' || dosage.unit === 'g' ? 10 : 2) * 100, 100);

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Main result hero */}
      <div className="relative overflow-hidden rounded-3xl border-2 border-green-200/60 bg-white p-6 sm:p-8 shadow-xl shadow-green-500/5">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-green-100/40 blur-3xl" />
        <div className="relative">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/30">
                <Calculator className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-800">{t('dosage.resultTitle')}</h3>
                <p className="text-xs text-slate-400">{medicine.name} · {landSize} {unit}</p>
              </div>
            </div>
            <button
              onClick={onReset}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 hover:border-slate-300"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {t('dosage.reset')}
            </button>
          </div>

          {/* Big numbers */}
          <div className="grid sm:grid-cols-2 gap-4 mb-5">
            <BigStat
              icon={<FlaskConical className="h-5 w-5" />}
              label={t('dosage.productNeeded')}
              value={productStr}
              unit={result.productUnit}
              gradient="from-green-500 to-emerald-600"
              sub={t('dosage.productSub', { perL: dosage.amountPerLiter, unit: dosage.unit })}
            />
            <BigStat
              icon={<Droplet className="h-5 w-5" />}
              label={t('dosage.waterNeeded')}
              value={result.totalWaterL.toLocaleString()}
              unit="L"
              gradient="from-blue-500 to-cyan-600"
              sub={t('dosage.waterSub', { perAcre: SPRAY_VOLUME_PER_ACRE_L })}
            />
          </div>

          {/* Visual mixing ratio bar */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Beaker className="h-4 w-4 text-slate-500" />
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">{t('dosage.mixRatio')}</p>
              </div>
              <span className="rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-slate-600 shadow-sm">{result.ratioLabel}</span>
            </div>
            <div className="flex h-8 overflow-hidden rounded-lg bg-blue-100 shadow-inner">
              <div
                className="flex items-center justify-center bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-700"
                style={{ width: `${Math.max(ratioPercent, 4)}%` }}
              >
                {ratioPercent > 8 && <span className="text-[10px] font-bold text-white">{t('dosage.medicine')}</span>}
              </div>
              <div
                className="flex items-center justify-center bg-gradient-to-r from-blue-300 to-cyan-400 transition-all duration-700"
                style={{ width: `${100 - Math.max(ratioPercent, 4)}%` }}
              >
                <span className="text-[10px] font-bold text-white">{t('dosage.water')}</span>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
              <span>{t('dosage.medicine')} {productStr} {result.productUnit}</span>
              <span>{result.totalWaterL.toLocaleString()} L {t('dosage.water')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom row: steps + details */}
      <div className="grid lg:grid-cols-5 gap-4">
        {/* Mixing guide */}
        <div className="lg:col-span-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-100 text-green-700">
              <Check className="h-4 w-4" />
            </div>
            <p className="text-sm font-bold text-slate-700">{t('dosage.stepsTitle')}</p>
          </div>
          <ol className="space-y-3">
            <StepRow num="1" text={t('dosage.step1', { water: result.totalWaterL.toLocaleString() })} />
            <StepRow num="2" text={t('dosage.step2', { product: productStr, unit: result.productUnit })} />
            <StepRow num="3" text={t('dosage.step3')} />
            <StepRow num="4" text={t('dosage.step4', { method: medicine.application_method || t('dosage.foliarSpray') })} />
          </ol>
        </div>

        {/* Medicine details */}
        <div className="lg:col-span-2 space-y-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">{t('dosage.medicineInfo')}</p>
            <div className="space-y-2.5">
              {medicine.active_ingredient && (
                <DetailRow icon={<Beaker className="h-4 w-4" />} label={t('medicine.active', { ingredient: medicine.active_ingredient })} />
              )}
              {medicine.frequency && (
                <DetailRow icon={<Clock className="h-4 w-4" />} label={medicine.frequency} />
              )}
              {medicine.pre_harvest_interval && (
                <DetailRow icon={<Calendar className="h-4 w-4" />} label={t('medicine.preHarvest') + ': ' + medicine.pre_harvest_interval} />
              )}
            </div>
          </div>

          {/* Warning card */}
          <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-4">
            <div className="flex items-start gap-2.5">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-amber-200/60">
                <AlertTriangle className="h-4 w-4 text-amber-700" />
              </div>
              <p className="text-xs leading-relaxed text-amber-800 font-medium">{t('dosage.warning')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Step Card with dropdown ─── */
function StepCard({
  icon, stepNum, label, value, options, disabled, emptyLabel, done, onSelect,
}: {
  icon: React.ReactNode;
  stepNum: string;
  label: string;
  value?: string;
  options: { id: string; label: string }[];
  disabled?: boolean;
  emptyLabel?: string;
  done: boolean;
  onSelect: (id: string) => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <div className={`relative rounded-2xl border-2 bg-white shadow-sm transition-all duration-300 ${
      disabled ? 'opacity-40 border-slate-100'
      : done ? 'border-green-300 shadow-md shadow-green-500/5'
      : 'border-slate-200 hover:border-green-200 hover:shadow-md'
    }`}>
      <button
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        className="flex w-full items-center gap-3 p-4 text-left"
      >
        <div className={`relative flex h-11 w-11 items-center justify-center rounded-xl flex-shrink-0 transition-all ${
          done ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-md shadow-green-500/20'
          : 'bg-slate-100 text-slate-400'
        }`}>
          {done ? <Check className="h-5 w-5" /> : icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${done ? 'text-green-600' : 'text-slate-400'}`}>
              {t('dosage.step')} {stepNum}
            </span>
            {!done && !disabled && <span className="h-1 w-1 rounded-full bg-green-400 animate-pulse" />}
          </div>
          <p className={`text-sm font-bold truncate mt-0.5 ${value ? 'text-slate-800' : 'text-slate-300'}`}>
            {value || label}
          </p>
        </div>
        {!disabled && (
          <ChevronRight className={`h-4 w-4 flex-shrink-0 text-slate-300 transition-transform duration-200 ${open ? 'rotate-90' : ''}`} />
        )}
      </button>

      {open && !disabled && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 top-full z-20 mt-2 max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl shadow-slate-900/10 animate-in fade-in slide-in-from-top-2 duration-200">
            {options.length === 0 ? (
              <p className="px-4 py-3 text-xs text-slate-400">{emptyLabel || '—'}</p>
            ) : (
              options.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => { onSelect(opt.id); setOpen(false); }}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-slate-700 transition hover:bg-green-50 hover:text-green-700"
                >
                  <ArrowRight className="h-3 w-3 text-slate-300" />
                  {opt.label}
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Big stat card ─── */
function BigStat({
  icon, label, value, unit, gradient, sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit: string;
  gradient: string;
  sub: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${gradient} text-white shadow-md`}>
          {icon}
        </div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{label}</p>
      </div>
      <div className="flex items-baseline gap-1.5">
        <CountUp value={value} />
        <span className="text-lg font-bold text-slate-400">{unit}</span>
      </div>
      <p className="mt-2 text-xs text-slate-400">{sub}</p>
    </div>
  );
}

/* ─── Count up animation ─── */
function CountUp({ value }: { value: string }) {
  const [display, setDisplay] = useState('0');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const num = parseFloat(value);
    if (isNaN(num)) { setDisplay(value); return; }
    const duration = 600;
    const steps = 30;
    const stepValue = num / steps;
    let current = 0;
    let i = 0;
    if (timerRef.current) clearTimeout(timerRef.current);
    const tick = () => {
      i++;
      current += stepValue;
      if (i >= steps) { setDisplay(value); return; }
      setDisplay(formatAmount(current));
      timerRef.current = setTimeout(tick, duration / steps);
    };
    tick();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [value]);

  return <span className="text-4xl font-extrabold text-slate-800 tracking-tight tabular-nums">{display}</span>;
}

/* ─── Small components ─── */
function SummaryRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-slate-400">{label}</span>
      {value ? (
        <span className="text-xs font-bold text-slate-700 truncate max-w-[60%] text-right">{value}</span>
      ) : (
        <span className="h-3 w-12 rounded-full bg-slate-200/60" />
      )}
    </div>
  );
}

function StepRow({ num, text }: { num: string; text: string }) {
  return (
    <li className="flex items-start gap-3 group">
      <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-green-100 to-emerald-100 text-xs font-bold text-green-700 transition-all group-hover:from-green-500 group-hover:to-emerald-600 group-hover:text-white">
        {num}
      </span>
      <span className="text-sm text-slate-600 leading-relaxed pt-0.5">{text}</span>
    </li>
  );
}

function DetailRow({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="text-slate-400 flex-shrink-0 mt-0.5">{icon}</span>
      <span className="text-xs text-slate-600 font-medium leading-relaxed">{label}</span>
    </div>
  );
}

function formatAmount(n: number): string {
  return n % 1 === 0 ? Math.round(n).toString() : n.toFixed(2);
}
