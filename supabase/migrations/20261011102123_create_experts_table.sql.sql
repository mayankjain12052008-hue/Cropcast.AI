/*
# Create experts table for Help Desk

1. New Tables
- `experts` — stores agricultural expert contact information for the Help Desk
  - `id` (uuid, primary key)
  - `name` (text, not null) — expert's full name
  - `specialization` (text, not null) — area of expertise (e.g. "Plant Pathology", "Entomology")
  - `organization` (text) — institution or company
  - `phone` (text) — contact phone number
  - `email` (text) — contact email
  - `whatsapp` (text) — WhatsApp number
  - `region` (text) — geographic area they serve
  - `experience_years` (integer) — years of experience
  - `availability` (text) — availability info (e.g. "Mon-Fri 9am-5pm")
  - `languages` (text) — languages spoken
  - `rating` (numeric) — expert rating 0-5
  - `image_url` (text) — optional profile photo URL
  - `created_at` (timestamptz)

2. Security
- RLS enabled with anon+authenticated read access (public help directory).
- No write policies — experts are managed via service role only.

3. Seed Data
- Inserts 6 agricultural experts with varied specializations and contact details.
*/

CREATE TABLE IF NOT EXISTS experts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  specialization text NOT NULL,
  organization text,
  phone text,
  email text,
  whatsapp text,
  region text,
  experience_years integer DEFAULT 0,
  availability text,
  languages text,
  rating numeric DEFAULT 0,
  image_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE experts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_experts" ON experts;
CREATE POLICY "anon_read_experts" ON experts FOR SELECT
TO anon, authenticated USING (true);

-- Seed expert data
INSERT INTO experts (name, specialization, organization, phone, email, whatsapp, region, experience_years, availability, languages, rating) VALUES
('Dr. Rajesh Kumar', 'Plant Pathology', 'Indian Agricultural Research Institute', '+91-9876543210', 'rajesh.kumar@iari.edu.in', '+91-9876543210', 'North India', 22, 'Mon-Fri 9:00 AM - 6:00 PM IST', 'English, Hindi', 4.8),
('Dr. Anita Sharma', 'Entomology & Pest Management', 'Punjab Agricultural University', '+91-9811122233', 'anita.sharma@pau.edu', '+91-9811122233', 'Punjab, Haryana', 18, 'Mon-Sat 10:00 AM - 5:00 PM IST', 'English, Hindi, Punjabi', 4.7),
('Dr. Vikram Singh', 'Agronomy & Crop Science', 'ICAR - Central Institute', '+91-9933445566', 'vikram.singh@icar.gov.in', '+91-9933445566', 'All India', 25, 'Mon-Fri 8:00 AM - 4:00 PM IST', 'English, Hindi', 4.9),
('Dr. Meera Nair', 'Soil Science & Fertilizer Management', 'Kerala Agricultural University', '+91-9087654321', 'meera.nair@kau.edu', '+91-9087654321', 'South India', 20, 'Mon-Fri 9:30 AM - 5:30 PM IST', 'English, Malayalam, Tamil', 4.6),
('Dr. Suresh Patil', 'Nematology & Integrated Pest Management', 'University of Agricultural Sciences Bangalore', '+91-9708321407', 'suresh.patil@uasb.edu', '+91-9708321407', 'Karnataka, Maharashtra', 16, 'Mon-Sat 9:00 AM - 6:00 PM IST', 'English, Kannada, Marathi', 4.5),
('Dr. Priya Reddy', 'Plant Breeding & Genetics', 'Professor Jayashankar Telangana State Agricultural University', '+91-9000111222', 'priya.reddy@pjtsau.edu', '+91-9000111222', 'Telangana, Andhra Pradesh', 14, 'Mon-Fri 10:00 AM - 5:00 PM IST', 'English, Telugu', 4.7)
ON CONFLICT DO NOTHING;
