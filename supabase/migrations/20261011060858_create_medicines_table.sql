-- ============================================================
-- MEDICINES — recommended treatments linked to diseases
-- ============================================================
CREATE TABLE IF NOT EXISTS medicines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  disease_id uuid REFERENCES diseases(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'fungicide',
  active_ingredient text,
  dosage text,
  application_method text,
  frequency text,
  pre_harvest_interval text,
  notes text,
  priority int NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE medicines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_medicines" ON medicines;
CREATE POLICY "anon_select_medicines" ON medicines FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_medicines" ON medicines;
CREATE POLICY "anon_insert_medicines" ON medicines FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_medicines" ON medicines;
CREATE POLICY "anon_update_medicines" ON medicines FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_medicines" ON medicines;
CREATE POLICY "anon_delete_medicines" ON medicines FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_medicines_disease ON medicines (disease_id);

-- Seed medicines for all existing diseases
INSERT INTO medicines (disease_id, name, type, active_ingredient, dosage, application_method, frequency, pre_harvest_interval, notes, priority) VALUES
-- Rice Blast
('ad18cfe4-134b-4e98-98b1-35839ca9f209', 'Tricyclazole 75% WP', 'fungicide', 'Tricyclazole', '0.6 g/L water', 'Foliar spray at tillering and booting stage', '2 applications, 10-12 days apart', '30 days', 'Most effective when applied preventively before disease onset', 1),
('ad18cfe4-134b-4e98-98b1-35839ca9f209', 'Azoxystrobin 250 SC', 'fungicide', 'Azoxystrobin', '1 mL/L water', 'Foliar spray', '1-2 applications, 14 days apart', '28 days', 'Broad-spectrum strobilurin — also controls sheath blight', 2),
('ad18cfe4-134b-4e98-98b1-35839ca9f209', 'Isoprothiolane 40% EC', 'fungicide', 'Isoprothiolane', '1.5 mL/L water', 'Foliar spray at nursery and main field', '2 applications, 12 days apart', '35 days', 'Systemic action — good for areas with resistant strains', 3),

-- Rice Sheath Blight
('1c635e7b-e414-45ea-94eb-52c70684af43', 'Validamycin 3% L', 'fungicide', 'Validamycin', '2 mL/L water', 'Foliar spray at booting stage', '1-2 applications, 10 days apart', '14 days', 'Highly specific for sheath blight — low toxicity to beneficials', 1),
('1c635e7b-e414-45ea-94eb-52c70684af43', 'Hexaconazole 5% SC', 'fungicide', 'Hexaconazole', '1 mL/L water', 'Foliar spray', '2 applications, 15 days apart', '30 days', 'Triazole systemic — also suppresses other fungal infections', 2),
('1c635e7b-e414-45ea-94eb-52c70684af43', 'Pseudomonas fluorescens', 'biocontrol', 'Pseudomonas fluorescens', '10 g/L water', 'Foliar spray and seed treatment', 'Weekly during susceptible period', '0 days', 'Organic-friendly biological control — safe for beneficial insects', 3),

-- Wheat Leaf Rust
('e08e4f83-d7bb-4a0e-9d27-d95ece22fe81', 'Tebuconazole 250 EC', 'fungicide', 'Tebuconazole', '1 mL/L water', 'Foliar spray at flag leaf emergence', '1-2 applications, 14-21 days apart', '30 days', 'Triazole systemic — most effective at early infection stage', 1),
('e08e4f83-d7bb-4a0e-9d27-d95ece22fe81', 'Pyraclostrobin 250 EC', 'fungicide', 'Pyraclostrobin', '0.8 mL/L water', 'Foliar spray', '1-2 applications, 14 days apart', '35 days', 'Strobilurin — provides curative and protective action', 2),
('e08e4f83-d7bb-4a0e-9d27-d95ece22fe81', 'Propiconazole 25% EC', 'fungicide', 'Propiconazole', '1 mL/L water', 'Foliar spray', '1 application at first sign', '30 days', 'Cost-effective triazole option', 3),

-- Wheat Powdery Mildew
('56daffa4-6894-4e3b-a54e-88e8eb497d68', 'Tebuconazole 250 EC', 'fungicide', 'Tebuconazole', '1 mL/L water', 'Foliar spray at stem extension', '1-2 applications, 21 days apart', '30 days', 'Apply at first sign of mildew colonies', 1),
('56daffa4-6894-4e3b-a54e-88e8eb497d68', 'Sulfur 80% WP', 'fungicide', 'Sulfur', '2.5 g/L water', 'Foliar spray', '2-3 applications, 7-10 days apart', '0 days', 'Traditional contact fungicide — safe for organic farming', 2),
('56daffa4-6894-4e3b-a54e-88e8eb497d68', 'Quinoxyfen 250 SC', 'fungicide', 'Quinoxyfen', '0.4 mL/L water', 'Foliar spray', '1-2 applications, 14 days apart', '42 days', 'Highly specific for powdery mildew — protective action', 3),

-- Wheat Fusarium Head Blight
('6ddad66c-143f-4a2d-aeea-8c52a8661040', 'Prothioconazole 250 SC', 'fungicide', 'Prothioconazole', '0.8 mL/L water', 'Foliar spray at 50% flowering (Feekes 10.5.1)', '1 application — timing is critical', '30 days', 'Best single option — apply within 3 days of flowering start', 1),
('6ddad66c-143f-4a2d-aeea-8c52a8661040', 'Tebuconazole 250 EC', 'fungicide', 'Tebuconazole', '1 mL/L water', 'Foliar spray at early flowering', '1 application', '30 days', 'Cost-effective alternative — slightly less effective than prothioconazole', 2),
('6ddad66c-143f-4a2d-aeea-8c52a8661040', 'Metconazole 60 SC', 'fungicide', 'Metconazole', '0.5 mL/L water', 'Foliar spray at flowering', '1 application', '30 days', 'Good efficacy when applied at correct growth stage', 3),

-- Tomato Late Blight
('329be866-2f47-433d-9904-fcdfdf5c3cdd', 'Cymoxanil 8% + Mancozeb 64% WP', 'fungicide', 'Cymoxanil + Mancozeb', '2.5 g/L water', 'Foliar spray immediately upon detection', 'Every 5-7 days during wet periods', '14 days', 'Locally systemic + contact — best for active outbreaks', 1),
('329be866-2f47-433d-9904-fcdfdf5c3cdd', 'Mandipropamid 250 SC', 'fungicide', 'Mandipropamid', '0.8 mL/L water', 'Foliar spray', 'Every 7 days, max 3 applications', '4 days', 'Excellent translaminar activity — rain-fast within 1 hour', 2),
('329be866-2f47-433d-9904-fcdfdf5c3cdd', 'Copper Hydroxide 77% WP', 'fungicide', 'Copper Hydroxide', '3 g/L water', 'Foliar spray preventively', 'Every 7-10 days', '0 days', 'Contact protectant — approved for organic production', 3),

-- Tomato Early Blight
('78cf7fa9-0c16-4534-962c-d55155e4d8d0', 'Chlorothalonil 75% WP', 'fungicide', 'Chlorothalonil', '2.5 g/L water', 'Foliar spray on 7-10 day schedule', '3-4 applications during wet periods', '5 days', 'Standard protectant — rotate with systemic for resistance management', 1),
('78cf7fa9-0c16-4534-962c-d55155e4d8d0', 'Azoxystrobin 250 SC', 'fungicide', 'Azoxystrobin', '1 mL/L water', 'Foliar spray', '2 applications, 10-14 days apart', '0 days (greenhouse) / 14 days (field)', 'Systemic — alternate with contact fungicide to prevent resistance', 2),
('78cf7fa9-0c16-4534-962c-d55155e4d8d0', 'Mancozeb 75% WP', 'fungicide', 'Mancozeb', '2.5 g/L water', 'Foliar spray', 'Every 7-10 days during wet weather', '5 days', 'Broad-spectrum contact — economical for large areas', 3),

-- Tomato Powdery Mildew
('24a1d6a2-f3f0-4e36-9bd8-48be6d118b76', 'Sulfur 80% WP', 'fungicide', 'Sulfur', '3 g/L water', 'Foliar spray at first sign of infection', '2-3 applications, 7-10 days apart', '0 days', 'Effective and organic-approved — avoid use above 32°C', 1),
('24a1d6a2-f3f0-4e36-9bd8-48be6d118b76', 'Azoxystrobin 250 SC', 'fungicide', 'Azoxystrobin', '1 mL/L water', 'Foliar spray', '2 applications, 10 days apart', '14 days', 'Systemic strobilurin — good for established infections', 2),
('24a1d6a2-f3f0-4e36-9bd8-48be6d118b76', 'Potassium Bicarbonate', 'biocontrol', 'Potassium Bicarbonate', '5 g/L water', 'Foliar spray', 'Weekly during susceptible period', '0 days', 'Organic — disrupts fungal cell walls, safe for beneficials', 3),

-- Maize Northern Leaf Blight
('74b9895f-040b-4c32-b772-5fedb3177a5c', 'Mancozeb 75% WP', 'fungicide', 'Mancozeb', '2.5 g/L water', 'Foliar spray at first symptom appearance', '2 applications, 10-14 days apart', '7 days', 'Contact protectant — best used early in epidemic', 1),
('74b9895f-040b-4c32-b772-5fedb3177a5c', 'Pyraclostrobin 250 EC', 'fungicide', 'Pyraclostrobin', '0.8 mL/L water', 'Foliar spray at VT-R1 growth stage', '1-2 applications, 14 days apart', '21 days', 'Strobilurin — curative and protective', 2),
('74b9895f-040b-4c32-b772-5fedb3177a5c', 'Azoxystrobin 250 SC', 'fungicide', 'Azoxystrobin', '1 mL/L water', 'Foliar spray', '1-2 applications, 14 days apart', '14 days', 'Systemic — good rain-fastness', 3),

-- Maize Gray Leaf Spot
('97fd57ad-2418-4a6b-a43a-f579e5e54769', 'Pyraclostrobin 250 EC', 'fungicide', 'Pyraclostrobin', '0.8 mL/L water', 'Foliar spray at VT-R1 growth stage', '1-2 applications, 14 days apart', '21 days', 'Most effective strobilurin for gray leaf spot', 1),
('97fd57ad-2418-4a6b-a43a-f579e5e54769', 'Azoxystrobin 250 SC', 'fungicide', 'Azoxystrobin', '1 mL/L water', 'Foliar spray at early lesion stage', '2 applications, 14 days apart', '14 days', 'Apply before lesions reach mid-canopy', 2),
('97fd57ad-2418-4a6b-a43a-f579e5e54769', 'Mancozeb 75% WP', 'fungicide', 'Mancozeb', '2.5 g/L water', 'Foliar spray', 'Every 7-10 days during humid weather', '7 days', 'Economical contact option for smallholder farmers', 3),

-- Grape Powdery Mildew
('29aaee54-0f58-4261-af85-11f31dde58d4', 'Sulfur 80% WP', 'fungicide', 'Sulfur', '2.5 g/L water', 'Foliar spray at pre-bloom and post-bloom', '3-4 applications, 7-10 days apart', '0 days', 'Standard for powdery mildew — avoid above 32°C', 1),
('29aaee54-0f58-4261-af85-11f31dde58d4', 'Quinoxyfen 250 SC', 'fungicide', 'Quinoxyfen', '0.4 mL/L water', 'Foliar spray at pre-bloom', '2 applications, 14-21 days apart', '21 days', 'Highly specific — excellent preventive action', 2),
('29aaee54-0f58-4261-af85-11f31dde58d4', 'Myclobutanil 40% WP', 'fungicide', 'Myclobutanil', '0.4 g/L water', 'Foliar spray', '2 applications, 10-14 days apart', '14 days', 'Systemic triazole — good for established infections', 3),

-- Grape Downy Mildew
('e0f4c24e-edff-42ea-ab60-4348b115c3b7', 'Mandipropamid 250 SC', 'fungicide', 'Mandipropamid', '0.8 mL/L water', 'Foliar spray preventively before rain events', 'Every 7-10 days during wet weather', '14 days', 'Best translaminar product for downy mildew — rain-fast', 1),
('e0f4c24e-edff-42ea-ab60-4348b115c3b7', 'Copper Hydroxide 77% WP', 'fungicide', 'Copper Hydroxide', '3 g/L water', 'Foliar spray before rain', 'Every 7-10 days', '0 days', 'Organic-approved contact — preventive only', 2),
('e0f4c24e-edff-42ea-ab60-4348b115c3b7', 'Metalaxyl-M 4% + Mancozeb 64% WP', 'fungicide', 'Metalaxyl-M + Mancozeb', '2.5 g/L water', 'Foliar spray at first sign', '2 applications, 10 days apart', '14 days', 'Systemic + contact — use only 1-2 times per season for resistance', 3);
