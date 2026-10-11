/*
# AgriChain — Crop Disease Diagnostics & Weather-Aware Treatment Advisory Schema

1. Overview
This schema powers a crop disease identification and treatment advisory platform. It stores:
- Crop reference data (crops we can identify diseases for)
- Disease reference library (known diseases, symptoms, treatments, risk factors)
- Weather readings (temperature and humidity trends used for infection risk modeling)
- Diagnostic scans (field image uploads with AI-simulated disease identification results)
- Treatment advisories (confidence-calibrated, weather-aware treatment recommendations)

2. New Tables
- `crops` — reference catalog of supported crops (name, scientific name, image)
- `diseases` — reference library of known crop diseases with symptoms, treatments, and environmental risk factors
- `weather_readings` — time-series temperature and humidity data per field/region
- `diagnostics` — records of uploaded field images with disease identification results and confidence scores
- `advisories` — generated treatment advisories linked to diagnostics, incorporating weather data and risk assessments

3. Security
- Single-tenant app with no authentication — RLS enabled on all tables.
- All policies use `TO anon, authenticated` since there is no sign-in screen.
- All data is intentionally shared/public within the app.

4. Important Notes
- Risk scoring fields (secondary_infection_risk, spray_urgency) are computed by the app and stored as part of advisories.
- Confidence scores on diagnostics are calibrated to minimize false spray alerts.
- Weather readings support trend analysis for infection risk prediction.
*/

-- ============================================================
-- CROPS reference table
-- ============================================================
CREATE TABLE IF NOT EXISTS crops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  scientific_name text,
  image_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE crops ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_crops" ON crops;
CREATE POLICY "anon_select_crops" ON crops FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_crops" ON crops;
CREATE POLICY "anon_insert_crops" ON crops FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_crops" ON crops;
CREATE POLICY "anon_update_crops" ON crops FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_crops" ON crops;
CREATE POLICY "anon_delete_crops" ON crops FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- DISEASES reference library
-- ============================================================
CREATE TABLE IF NOT EXISTS diseases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_id uuid REFERENCES crops(id) ON DELETE CASCADE,
  name text NOT NULL,
  pathogen_type text NOT NULL DEFAULT 'fungal',
  severity text NOT NULL DEFAULT 'moderate',
  description text,
  symptoms text,
  treatment text,
  prevention text,
  temp_min_c numeric NOT NULL DEFAULT 15,
  temp_max_c numeric NOT NULL DEFAULT 30,
  humidity_min numeric NOT NULL DEFAULT 60,
  humidity_max numeric NOT NULL DEFAULT 95,
  base_confidence numeric NOT NULL DEFAULT 0.75,
  image_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE diseases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_diseases" ON diseases;
CREATE POLICY "anon_select_diseases" ON diseases FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_diseases" ON diseases;
CREATE POLICY "anon_insert_diseases" ON diseases FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_diseases" ON diseases;
CREATE POLICY "anon_update_diseases" ON diseases FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_diseases" ON diseases;
CREATE POLICY "anon_delete_diseases" ON diseases FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- WEATHER readings — time-series temperature and humidity
-- ============================================================
CREATE TABLE IF NOT EXISTS weather_readings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  field_label text NOT NULL DEFAULT 'Field Alpha',
  temperature_c numeric NOT NULL,
  humidity_pct numeric NOT NULL,
  recorded_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE weather_readings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_weather" ON weather_readings;
CREATE POLICY "anon_select_weather" ON weather_readings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_weather" ON weather_readings;
CREATE POLICY "anon_insert_weather" ON weather_readings FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_weather" ON weather_readings;
CREATE POLICY "anon_update_weather" ON weather_readings FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_weather" ON weather_readings;
CREATE POLICY "anon_delete_weather" ON weather_readings FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_weather_field_time ON weather_readings (field_label, recorded_at DESC);

-- ============================================================
-- DIAGNOSTICS — uploaded field image analysis records
-- ============================================================
CREATE TABLE IF NOT EXISTS diagnostics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_id uuid REFERENCES crops(id) ON DELETE SET NULL,
  disease_id uuid REFERENCES diseases(id) ON DELETE SET NULL,
  field_label text NOT NULL DEFAULT 'Field Alpha',
  image_url text,
  identified_disease text,
  confidence_score numeric NOT NULL DEFAULT 0.0,
  severity_assessment text DEFAULT 'moderate',
  status text NOT NULL DEFAULT 'completed',
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE diagnostics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_diagnostics" ON diagnostics;
CREATE POLICY "anon_select_diagnostics" ON diagnostics FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_diagnostics" ON diagnostics;
CREATE POLICY "anon_insert_diagnostics" ON diagnostics FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_diagnostics" ON diagnostics;
CREATE POLICY "anon_update_diagnostics" ON diagnostics FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_diagnostics" ON diagnostics;
CREATE POLICY "anon_delete_diagnostics" ON diagnostics FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_diagnostics_created ON diagnostics (created_at DESC);

-- ============================================================
-- ADVISORIES — weather-aware treatment recommendations
-- ============================================================
CREATE TABLE IF NOT EXISTS advisories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  diagnostic_id uuid REFERENCES diagnostics(id) ON DELETE CASCADE,
  recommendation text NOT NULL,
  spray_recommended boolean NOT NULL DEFAULT false,
  spray_urgency text NOT NULL DEFAULT 'low',
  secondary_infection_risk numeric NOT NULL DEFAULT 0.0,
  risk_level text NOT NULL DEFAULT 'low',
  confidence_calibrated numeric NOT NULL DEFAULT 0.0,
  optimal_window text,
  weather_context text,
  treatment_details text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE advisories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_advisories" ON advisories;
CREATE POLICY "anon_select_advisories" ON advisories FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_advisories" ON advisories;
CREATE POLICY "anon_insert_advisories" ON advisories FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_advisories" ON advisories;
CREATE POLICY "anon_update_advisories" ON advisories FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_advisories" ON advisories;
CREATE POLICY "anon_delete_advisories" ON advisories FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_advisories_diagnostic ON advisories (diagnostic_id);
CREATE INDEX IF NOT EXISTS idx_advisories_created ON advisories (created_at DESC);
