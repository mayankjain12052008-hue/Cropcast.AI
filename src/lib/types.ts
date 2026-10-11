export interface Crop {
  id: string;
  name: string;
  scientific_name: string | null;
  image_url: string | null;
  created_at: string;
}

export interface Disease {
  id: string;
  crop_id: string;
  name: string;
  pathogen_type: string;
  severity: string;
  description: string | null;
  symptoms: string | null;
  treatment: string | null;
  prevention: string | null;
  temp_min_c: number;
  temp_max_c: number;
  humidity_min: number;
  humidity_max: number;
  base_confidence: number;
  image_url: string | null;
  created_at: string;
}

export interface Medicine {
  id: string;
  disease_id: string;
  name: string;
  type: string;
  active_ingredient: string | null;
  dosage: string | null;
  application_method: string | null;
  frequency: string | null;
  pre_harvest_interval: string | null;
  notes: string | null;
  priority: number;
  created_at: string;
}

export interface WeatherReading {
  id: string;
  field_label: string;
  temperature_c: number;
  humidity_pct: number;
  recorded_at: string;
}

export interface Diagnostic {
  id: string;
  crop_id: string | null;
  disease_id: string | null;
  field_label: string;
  image_url: string | null;
  identified_disease: string | null;
  confidence_score: number;
  severity_assessment: string | null;
  status: string;
  notes: string | null;
  created_at: string;
}

export interface Advisory {
  id: string;
  diagnostic_id: string;
  recommendation: string;
  spray_recommended: boolean;
  spray_urgency: string;
  secondary_infection_risk: number;
  risk_level: string;
  confidence_calibrated: number;
  optimal_window: string | null;
  weather_context: string | null;
  treatment_details: string | null;
  created_at: string;
}

export interface WeatherTrend {
  fieldLabel: string;
  avgTemp: number;
  avgHumidity: number;
  tempTrend: number[];
  humidityTrend: number[];
  labels: string[];
  latestTemp: number;
  latestHumidity: number;
}

export interface RiskAssessment {
  secondaryInfectionRisk: number;
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  weatherContext: string;
  optimalWindow: string;
}

export interface AdvisoryResult {
  recommendation: string;
  sprayRecommended: boolean;
  sprayUrgency: 'low' | 'moderate' | 'high' | 'critical';
  secondaryInfectionRisk: number;
  riskLevel: string;
  confidenceCalibrated: number;
  optimalWindow: string;
  weatherContext: string;
  treatmentDetails: string;
}

export interface Expert {
  id: string;
  name: string;
  specialization: string;
  organization: string | null;
  phone: string | null;
  email: string | null;
  whatsapp: string | null;
  region: string | null;
  experience_years: number;
  availability: string | null;
  languages: string | null;
  rating: number;
  image_url: string | null;
  created_at: string;
}

export interface GovernmentScheme {
  id: string;
  name: string;
  category: string | null;
  ministry: string | null;
  description: string;
  eligibility: string | null;
  benefits: string | null;
  how_to_apply: string | null;
  documents_required: string | null;
  official_url: string | null;
  helpline: string | null;
  state: string | null;
  tags: string[] | null;
  created_at: string;
}

export type ViewName = 'dashboard' | 'scan' | 'history' | 'weather' | 'library' | 'dosage' | 'spray' | 'helpdesk' | 'schemes';
