import { useState, useRef, useCallback } from 'react';
import type { Crop, Disease, WeatherTrend, Diagnostic, Advisory, Medicine } from '@/lib/types';
import type { GeoLocation, WeatherData } from '@/lib/weather';
import { supabase } from '@/lib/supabase';
import {
  analyzeImageFeatures,
  simulateDiseaseMatch,
  generateAdvisory,
} from '@/lib/analysis';
import { analyzeImageWithGemini, fileToBase64, type GeminiAnalysis } from '@/lib/gemini';
import { fetchWeatherForLocation } from '@/lib/weather';
import { useTranslation } from '@/lib/LanguageContext';
import {
  RiskGauge,
  ConfidenceBar,
  RiskBadge,
} from './RiskGauge';
import WeatherPanel from './WeatherPanel';
import CropModal from './CropModal';
import LocationPicker from './LocationPicker';
import MedicineCard from './MedicineCard';
import {
  Upload,
  ScanLine,
  Loader2,
  CheckCircle2,
  XCircle,
  Sparkles,
  Calendar,
  Pill,
  Shield,
  Lightbulb,
  FileText,
  Plus,
  Sprout,
  CircleCheck,
  Sprout as SproutIcon,
  MapPin,
  Image as ImageIcon,
  Bot,
} from 'lucide-react';
import AIAssistant from './AIAssistant';

const STEPS = [
  { key: 'crop', labelKey: 'scan.stepCrop', icon: SproutIcon },
  { key: 'field', labelKey: 'scan.stepLocation', icon: MapPin },
  { key: 'image', labelKey: 'scan.stepImage', icon: ImageIcon },
  { key: 'scan', labelKey: 'scan.stepScan', icon: ScanLine },
] as const;

interface ScanViewProps {
  crops: Crop[];
  diseases: Disease[];
  medicines: Medicine[];
  onScanComplete: () => void;
  showToast?: (type: 'success' | 'error' | 'info', message: string) => void;
  location: GeoLocation | null;
  onSetLocation: (loc: GeoLocation) => void;
}

type ScanStage = 'idle' | 'uploading' | 'analyzing' | 'complete' | 'error';

export default function ScanView({ crops, diseases, medicines, onScanComplete, showToast, location, onSetLocation }: ScanViewProps) {
  const { t } = useTranslation();
  const [selectedCrop, setSelectedCrop] = useState<Crop | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [stage, setStage] = useState<ScanStage>('idle');
  const [error, setError] = useState<string>('');
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [result, setResult] = useState<{
    diagnostic: Diagnostic;
    advisory: Advisory;
    disease: Disease;
    weather: WeatherTrend | null;
    geminiAnalysis: GeminiAnalysis | null;
  } | null>(null);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setError(t('scan.selectImage'));
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
    setResult(null);
    setStage('idle');
    setError('');
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect]
  );

  const runAnalysis = async () => {
    if (!imageFile || !selectedCrop) {
      setError(t('scan.selectCropAndImage'));
      return;
    }
    if (!location) {
      setError(t('scan.selectLocation'));
      return;
    }

    setStage('analyzing');
    setProgress(0);
    setError('');

    try {
      const cropDiseases = diseases.filter((d) => d.crop_id === selectedCrop.id);

      // Try Gemini AI analysis first
      let geminiAnalysis: GeminiAnalysis | null = null;
      let matchDisease: Disease | null = null;
      let rawConfidence: number = 0;
      let severity: string = 'low';

      try {
        setProgress(10);
        const { base64, mimeType } = await fileToBase64(imageFile);
        setProgress(25);

        const diseaseContext = cropDiseases.map((d) => ({
          id: d.id,
          name: d.name,
          cropName: selectedCrop.name,
          pathogenType: d.pathogen_type,
          severity: d.severity,
          symptoms: d.symptoms,
          description: d.description,
        }));

        geminiAnalysis = await analyzeImageWithGemini(base64, mimeType, selectedCrop.name, diseaseContext);
        setProgress(50);

        // Match Gemini result to database disease
        if (geminiAnalysis.matchedDatabaseDisease) {
          matchDisease = cropDiseases.find((d) => d.name === geminiAnalysis!.matchedDatabaseDisease) || null;
        }
        if (!matchDisease && geminiAnalysis.identifiedDisease !== 'Healthy') {
          matchDisease = cropDiseases.find((d) =>
            d.name.toLowerCase().includes(geminiAnalysis!.identifiedDisease.toLowerCase()) ||
            geminiAnalysis!.identifiedDisease.toLowerCase().includes(d.name.toLowerCase())
          ) || null;
        }
        if (!matchDisease && cropDiseases.length > 0) {
          matchDisease = cropDiseases[0];
        }

        rawConfidence = geminiAnalysis.confidence;
        severity = geminiAnalysis.severity;
      } catch {
        // Fallback to pixel-based analysis if Gemini is not available
        setProgress(15);
        const features = await analyzeImageFeatures(imageFile);
        setProgress(35);
        const match = simulateDiseaseMatch(cropDiseases, features);
        if (!match) {
          throw new Error(t('scan.noDiseases'));
        }
        matchDisease = match.disease;
        rawConfidence = match.rawConfidence;
        severity = match.severity;
      }

      if (!matchDisease) {
        throw new Error(t('scan.noDiseases'));
      }

      setProgress(60);
      const weatherData = await fetchWeatherForLocation(location);
      setProgress(75);

      const fieldLabel = `${location.name}${location.country ? ', ' + location.country : ''}`;
      const weather: WeatherTrend = {
        fieldLabel,
        avgTemp: weatherData.daily.time.reduce((sum, _, i) => sum + (weatherData.daily.tempMax[i] + weatherData.daily.tempMin[i]) / 2, 0) / weatherData.daily.time.length,
        avgHumidity: weatherData.daily.humidityAvg.reduce((a, b) => a + b, 0) / weatherData.daily.humidityAvg.length,
        tempTrend: weatherData.daily.tempMax,
        humidityTrend: weatherData.daily.humidityAvg,
        labels: weatherData.daily.time.map((t) => new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
        latestTemp: weatherData.current.temperature,
        latestHumidity: weatherData.current.humidity,
      };
      setProgress(85);

      const advisoryResult = generateAdvisory(
        matchDisease,
        weather,
        rawConfidence
      );

      setProgress(85);

      const { data: diagData, error: diagError } = await supabase
        .from('diagnostics')
        .insert({
          crop_id: selectedCrop.id,
          disease_id: matchDisease.id,
          field_label: fieldLabel,
          image_url: imagePreview,
          identified_disease: matchDisease.name,
          confidence_score: rawConfidence,
          severity_assessment: severity,
          status: 'completed',
        })
        .select()
        .single();

      if (diagError) throw diagError;

      const { data: advData, error: advError } = await supabase
        .from('advisories')
        .insert({
          diagnostic_id: diagData.id,
          recommendation: advisoryResult.recommendation,
          spray_recommended: advisoryResult.sprayRecommended,
          spray_urgency: advisoryResult.sprayUrgency,
          secondary_infection_risk: advisoryResult.secondaryInfectionRisk,
          risk_level: advisoryResult.riskLevel,
          confidence_calibrated: advisoryResult.confidenceCalibrated,
          optimal_window: advisoryResult.optimalWindow,
          weather_context: advisoryResult.weatherContext,
          treatment_details: advisoryResult.treatmentDetails,
        })
        .select()
        .single();

      if (advError) throw advError;

      setProgress(100);
      setStage('complete');
      setResult({
        diagnostic: diagData as Diagnostic,
        advisory: advData as Advisory,
        disease: matchDisease,
        weather,
        geminiAnalysis,
      });
      onScanComplete();
      showToast?.('success', t('scan.scanComplete', { disease: matchDisease.name, confidence: Math.round(rawConfidence * 100) }));
    } catch (err) {
      setStage('error');
      setError(err instanceof Error ? err.message : t('scan.analysisFailed'));
      showToast?.('error', err instanceof Error ? err.message : t('scan.analysisFailed'));
    }
  };

  const reset = () => {
    setImageFile(null);
    setImagePreview(null);
    setResult(null);
    setStage('idle');
    setProgress(0);
    setError('');
  };

  const handleCropCreated = (crop: Crop) => {
    setCropModalOpen(false);
    setSelectedCrop(crop);
    onScanComplete();
  };

  const completedSteps = {
    crop: !!selectedCrop,
    field: !!location,
    image: !!imageFile,
    scan: stage === 'complete',
  };

  const currentStep = !selectedCrop ? 0 : !location ? 1 : !imageFile ? 2 : 3;

  // Full-screen result view when scan is complete
  if (stage === 'complete' && result) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <ScanResult result={result} onReset={reset} medicines={medicines} />
        <AIAssistant
          context={{
            cropName: selectedCrop?.name || '',
            diseaseName: result.disease.name,
            severity: result.advisory.risk_level,
            pathogenType: result.disease.pathogen_type,
            weatherSummary: result.weather
              ? `${result.weather.latestTemp.toFixed(0)}°C, ${result.weather.latestHumidity.toFixed(0)}% humidity`
              : 'Unknown',
            locationName: location?.name || '',
          }}
        />
        <CropModal
          open={cropModalOpen}
          onClose={() => setCropModalOpen(false)}
          onCreated={handleCropCreated}
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">{t('scan.title')}</h2>
        <p className="text-sm text-slate-500 mt-1">
          {t('scan.subtitle')}
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-1 sm:gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm overflow-x-auto">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          const done = completedSteps[step.key];
          const active = currentStep === i;
          return (
            <div key={step.key} className="flex items-center flex-1 min-w-0">
              <div className={`flex items-center gap-2 rounded-xl px-3 py-2 transition-all flex-1 ${
                active ? 'bg-green-50' : ''
              }`}>
                <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all ${
                  done
                    ? 'bg-green-600 text-white'
                    : active
                      ? 'bg-green-100 text-green-700 ring-2 ring-green-200'
                      : 'bg-slate-100 text-slate-400'
                }`}>
                  {done ? <CircleCheck className="h-4 w-4" /> : <Icon className="h-3.5 w-3.5" />}
                </div>
                <span className={`text-xs font-medium hidden sm:inline ${
                  active ? 'text-green-700' : done ? 'text-slate-600' : 'text-slate-400'
                }`}>
                  {t(step.labelKey)}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-0.5 w-3 sm:w-6 flex-shrink-0 rounded-full ${
                  done ? 'bg-green-300' : 'bg-slate-100'
                }`} />
              )}
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-[400px_1fr] gap-6">
        {/* Left: Configuration */}
        <div className="space-y-4">
          <div className={`rounded-2xl border bg-white p-5 shadow-sm transition-all ${
            !selectedCrop ? 'border-green-300 ring-2 ring-green-100' : 'border-slate-200'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-slate-700">
                {t('scan.selectCrop')} {!selectedCrop && <span className="text-green-500 font-normal">{t('scan.startHere')}</span>}
              </label>
              <button
                onClick={() => setCropModalOpen(true)}
                className="flex items-center gap-1 rounded-lg bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 hover:bg-green-100 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                {t('scan.addCrop')}
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {crops.map((crop) => (
                <button
                  key={crop.id}
                  onClick={() => setSelectedCrop(crop)}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 transition-all ${
                    selectedCrop?.id === crop.id
                      ? 'border-green-500 bg-green-50 ring-2 ring-green-100'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {crop.image_url ? (
                    <img
                      src={crop.image_url}
                      alt={crop.name}
                      className="h-10 w-10 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
                      <Sprout className="h-5 w-5 text-green-400" />
                    </div>
                  )}
                  <span className="text-xs font-medium text-slate-700">{crop.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className={`rounded-2xl border bg-white p-5 shadow-sm transition-all ${
            selectedCrop && !location ? 'border-green-300 ring-2 ring-green-100' : 'border-slate-200'
          }`}>
            <label className="text-sm font-semibold text-slate-700 mb-2 block">
              {t('scan.yourLocation')} {selectedCrop && !location && <span className="text-green-500 font-normal">{t('scan.neededForWeather')}</span>}
            </label>
            <LocationPicker
              onSelect={onSetLocation}
              selectedLocation={location}
              compact={true}
            />
            <p className="text-xs text-slate-400 mt-2">
              {t('scan.locationHint')}
            </p>
          </div>

          <div className={`rounded-2xl border bg-white p-5 shadow-sm transition-all ${
            selectedCrop && !imageFile ? 'border-green-300 ring-2 ring-green-100' : 'border-slate-200'
          }`}>
            <label className="text-sm font-semibold text-slate-700 mb-3 block">
              {t('scan.fieldImage')} {selectedCrop && !imageFile && <span className="text-green-500 font-normal">{t('scan.uploadToContinue')}</span>}
            </label>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="cursor-pointer rounded-xl border-2 border-dashed border-slate-300 p-6 text-center transition-all hover:border-green-400 hover:bg-green-50/50"
            >
              {imagePreview ? (
                <div className="space-y-3">
                  <img
                    src={imagePreview}
                    alt="Field preview"
                    className="mx-auto max-h-48 rounded-lg object-cover"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="text-xs text-green-600 font-medium hover:underline"
                  >
                    {t('scan.changeImage')}
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="mx-auto h-10 w-10 text-slate-300" />
                  <p className="text-sm text-slate-500">
                    {t('scan.dragDrop')}
                  </p>
                  <p className="text-xs text-slate-400">{t('scan.fileHint')}</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
              />
            </div>
          </div>

          <button
            onClick={runAnalysis}
            disabled={!imageFile || !selectedCrop || !location || stage === 'analyzing'}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-600 to-emerald-700 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-green-600/20 transition-all hover:shadow-xl hover:shadow-green-600/30 disabled:opacity-40 disabled:shadow-none"
          >
            {stage === 'analyzing' ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                {t('scan.analyzing')}
              </>
            ) : (
              <>
                <ScanLine className="h-5 w-5" />
                {t('scan.runScan')}
              </>
            )}
          </button>

          {!imageFile && selectedCrop && location && (
            <p className="text-center text-xs text-slate-400">
              {t('scan.uploadHint')}
            </p>
          )}
          {imageFile && !selectedCrop && (
            <p className="text-center text-xs text-slate-400">
              {t('scan.selectCropHint')}
            </p>
          )}
          {imageFile && selectedCrop && !location && (
            <p className="text-center text-xs text-slate-400">
              {t('scan.selectLocationHint')}
            </p>
          )}

          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              <XCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Right: Analysis progress + idle placeholder */}
        <div className="space-y-4">
          {stage === 'analyzing' && (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex flex-col items-center justify-center py-12">
                <div className="relative">
                  <div className="h-20 w-20 rounded-full border-4 border-green-100" />
                  <div
                    className="absolute inset-0 h-20 w-20 rounded-full border-4 border-green-600 border-t-transparent animate-spin"
                  />
                  <Sparkles className="absolute inset-0 m-auto h-8 w-8 text-green-600" />
                </div>
                <h3 className="mt-6 text-lg font-semibold text-slate-800">
                  {t('scan.aiProgress')}
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  {t('scan.aiProgressDesc')}
                </p>
                <div className="mt-6 w-full max-w-xs">
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-600 transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="mt-2 flex justify-between text-xs text-slate-400">
                    <span>
                      {progress < 35
                        ? t('scan.extracting')
                        : progress < 55
                          ? t('scan.matching')
                          : progress < 70
                            ? t('scan.fetchingWeather')
                            : progress < 85
                              ? t('scan.generating')
                              : t('scan.saving')}
                    </span>
                    <span>{progress}%</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {stage === 'idle' && !result && (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
              {!selectedCrop ? (
                <>
                  <SproutIcon className="mx-auto h-16 w-16 text-green-200" />
                  <h3 className="mt-4 text-lg font-semibold text-slate-700">
                    {t('scan.step1Title')}
                  </h3>
                  <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
                    {t('scan.step1Desc')}
                  </p>
                </>
              ) : !imageFile ? (
                <>
                  <ImageIcon className="mx-auto h-16 w-16 text-slate-200" />
                  <h3 className="mt-4 text-lg font-semibold text-slate-700">
                    {t('scan.step3Title')}
                  </h3>
                  <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
                    {t('scan.step3Desc')}
                  </p>
                </>
              ) : !location ? (
                <>
                  <MapPin className="mx-auto h-16 w-16 text-green-200" />
                  <h3 className="mt-4 text-lg font-semibold text-slate-700">
                    {t('scan.step2Title')}
                  </h3>
                  <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
                    {t('scan.step2Desc')}
                  </p>
                </>
              ) : (
                <>
                  <ScanLine className="mx-auto h-16 w-16 text-green-200" />
                  <h3 className="mt-4 text-lg font-semibold text-slate-700">
                    {t('scan.readyTitle')}
                  </h3>
                  <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
                    {t('scan.readyDesc')}
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <CropModal
        open={cropModalOpen}
        onClose={() => setCropModalOpen(false)}
        onCreated={handleCropCreated}
      />
    </div>
  );
}

function ScanResult({
  result,
  onReset,
  medicines,
}: {
  result: {
    diagnostic: Diagnostic;
    advisory: Advisory;
    disease: Disease;
    weather: WeatherTrend | null;
    geminiAnalysis: GeminiAnalysis | null;
  };
  onReset: () => void;
  medicines: Medicine[];
}) {
  const { t } = useTranslation();
  const { diagnostic, advisory, disease, weather, geminiAnalysis } = result;
  const diseaseMedicines = medicines.filter((m) => m.disease_id === disease.id);

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Scanned image + success banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 via-slate-900 to-green-950 shadow-xl">
        {diagnostic.image_url && (
          <img
            src={diagnostic.image_url}
            alt="Scanned field"
            className="absolute inset-0 h-full w-full object-cover opacity-30"
          />
        )}
        <div className="relative p-6 flex items-center gap-4">
          {diagnostic.image_url && (
            <img
              src={diagnostic.image_url}
              alt="Scanned field"
              className="h-20 w-20 rounded-xl object-cover border-2 border-white/20 flex-shrink-0"
            />
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-400" />
              <p className="text-sm font-semibold text-white">
                {t('scan.diagComplete', { disease: disease.name })}
              </p>
            </div>
            <p className="text-xs text-green-300 mt-1">
              {t('scan.pathogenIdentified', { type: disease.pathogen_type, confidence: Math.round(diagnostic.confidence_score * 100) })}
            </p>
          </div>
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm hover:bg-white/20 transition-colors"
          >
            <ScanLine className="h-3.5 w-3.5" />
            {t('scan.newScan')}
          </button>
        </div>
      </div>

      {/* Quick summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
          <p className="text-xs text-slate-400">{t('scan.disease')}</p>
          <p className="text-sm font-bold text-slate-800 truncate mt-0.5">{disease.name}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
          <p className="text-xs text-slate-400">{t('scan.confidence')}</p>
          <p className="text-sm font-bold text-green-600 mt-0.5">
            {Math.round(advisory.confidence_calibrated * 100)}%
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
          <p className="text-xs text-slate-400">{t('scan.riskLevel')}</p>
          <div className="mt-0.5 flex justify-center">
            <RiskBadge level={advisory.risk_level} />
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
          <p className="text-xs text-slate-400">{t('scan.sprayQ')}</p>
          <p className={`text-sm font-bold mt-0.5 ${advisory.spray_recommended ? 'text-red-600' : 'text-green-600'}`}>
            {advisory.spray_recommended ? t('scan.yes') : t('scan.no')}
          </p>
        </div>
      </div>

      {/* Disease identification card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          {disease.image_url && (
            <img
              src={disease.image_url}
              alt={disease.name}
              className="h-28 w-28 rounded-xl object-cover flex-shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-bold text-slate-800">{disease.name}</h3>
              <RiskBadge level={disease.severity} />
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 capitalize">
                {disease.pathogen_type}
              </span>
            </div>
            <p className="text-sm text-slate-600 mt-1">{disease.description}</p>
            <div className="mt-3 space-y-2">
              <ConfidenceBar
                confidence={diagnostic.confidence_score}
                label={t('scan.rawConfidence')}
              />
              <ConfidenceBar
                confidence={advisory.confidence_calibrated}
                label={t('scan.weatherConfidence')}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Gemini AI insights */}
      {geminiAnalysis && (
        <div className="rounded-2xl border-2 border-teal-200 bg-gradient-to-br from-teal-50/50 to-emerald-50/30 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-lg shadow-teal-500/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-slate-800">{t('gemini.aiInsights')}</h3>
              <p className="text-xs text-slate-400">{t('gemini.aiInsightsDesc')}</p>
            </div>
            <span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-[10px] font-bold text-teal-700">
              GEMINI AI
            </span>
          </div>

          <div className="space-y-3">
            {geminiAnalysis.description && (
              <div className="rounded-xl bg-white/80 border border-teal-100 p-4">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">{t('gemini.aiDescription')}</p>
                <p className="text-sm text-slate-700 leading-relaxed">{geminiAnalysis.description}</p>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-3">
              {geminiAnalysis.symptoms && (
                <div className="rounded-xl bg-white/80 border border-teal-100 p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <FileText className="h-4 w-4 text-teal-600" />
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{t('gemini.aiSymptoms')}</p>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">{geminiAnalysis.symptoms}</p>
                </div>
              )}

              {geminiAnalysis.treatmentAdvice && (
                <div className="rounded-xl bg-white/80 border border-teal-100 p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Pill className="h-4 w-4 text-teal-600" />
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{t('gemini.aiTreatment')}</p>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">{geminiAnalysis.treatmentAdvice}</p>
                </div>
              )}
            </div>

            {geminiAnalysis.preventionAdvice && (
              <div className="rounded-xl bg-white/80 border border-teal-100 p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <Shield className="h-4 w-4 text-teal-600" />
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{t('gemini.aiPrevention')}</p>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">{geminiAnalysis.preventionAdvice}</p>
              </div>
            )}

            {geminiAnalysis.urgency && (
              <div className="flex items-center gap-2 rounded-xl bg-white/80 border border-teal-100 p-3">
                <span className="text-xs font-bold text-slate-500">{t('gemini.aiUrgency')}</span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ${
                  geminiAnalysis.urgency === 'critical' ? 'bg-red-100 text-red-700'
                  : geminiAnalysis.urgency === 'high' ? 'bg-orange-100 text-orange-700'
                  : geminiAnalysis.urgency === 'moderate' ? 'bg-amber-100 text-amber-700'
                  : 'bg-green-100 text-green-700'
                }`}>
                  {geminiAnalysis.urgency}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Risk + Weather grid */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-5 w-5 text-slate-600" />
            <h3 className="text-sm font-semibold text-slate-800">
              {t('scan.secondaryRisk')}
            </h3>
          </div>
          <div className="flex flex-col items-center">
            <RiskGauge risk={advisory.secondary_infection_risk} level={advisory.risk_level} />
            <div className="mt-3 flex items-center gap-2">
              <RiskBadge level={advisory.risk_level} />
              {advisory.spray_recommended ? (
                <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                  {t('scan.sprayRecommended')}
                </span>
              ) : (
                <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                  {t('scan.noSprayNeeded')}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-3 text-center">{advisory.weather_context}</p>
          </div>
        </div>

        {weather && <WeatherPanel weather={weather} fieldLabel={diagnostic.field_label} compact />}
      </div>

      {/* Advisory recommendation */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="h-5 w-5 text-amber-500" />
          <h3 className="text-sm font-semibold text-slate-800">
            {t('scan.treatmentAdvisory')}
          </h3>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-sm text-slate-700 leading-relaxed">{advisory.recommendation}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <div className="flex items-start gap-3 rounded-xl border border-slate-100 p-4">
              <Calendar className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-slate-500">{t('scan.optimalWindow')}</p>
                <p className="text-sm text-slate-700 mt-0.5">{advisory.optimal_window}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-slate-100 p-4">
              <Pill className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-slate-500">{t('scan.treatmentProtocol')}</p>
                <p className="text-sm text-slate-700 mt-0.5">{advisory.treatment_details}</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-4">
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-amber-700">{t('scan.preventionStrategy')}</p>
                <p className="text-sm text-slate-700 mt-0.5">{disease.prevention}</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
            <p className="text-xs font-semibold text-slate-500 mb-1">{t('scan.identifiedSymptoms')}</p>
            <p className="text-sm text-slate-700">{disease.symptoms}</p>
          </div>
        </div>
      </div>

      {/* Recommended medicines */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <Pill className="h-5 w-5 text-green-600" />
          <h3 className="text-sm font-semibold text-slate-800">
            {t('scan.recommendedMedicines')}
          </h3>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          {t('scan.medicineDesc', { disease: disease.name })}
        </p>

        {diseaseMedicines.length > 0 ? (
          <div className="space-y-3">
            {diseaseMedicines.map((med) => (
              <MedicineCard key={med.id} medicine={med} showPriority />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center">
            <Pill className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-2 text-sm text-slate-400">
              {t('scan.noMedicine')}
            </p>
          </div>
        )}

        <div className="mt-4 rounded-xl bg-amber-50 border border-amber-100 p-3">
          <p className="text-xs text-amber-700 leading-relaxed">
            {t('scan.medicineWarning')}
          </p>
        </div>
      </div>
    </div>
  );
}
