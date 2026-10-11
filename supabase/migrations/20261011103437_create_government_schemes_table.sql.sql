/*
# Create government_schemes table

1. New Tables
- `government_schemes` — stores agriculture-related government scheme information for farmers
  - `id` (uuid, primary key)
  - `name` (text, not null)
  - `category` (text) — e.g. "Insurance", "Subsidy", "Credit", "Pension"
  - `ministry` (text) — administering ministry/department
  - `description` (text, not null)
  - `eligibility` (text)
  - `benefits` (text)
  - `how_to_apply` (text)
  - `documents_required` (text)
  - `official_url` (text)
  - `helpline` (text)
  - `state` (text) — applicable state(s), null = all India
  - `tags` (text[])
  - `created_at` (timestamptz)

2. Security
- RLS enabled, anon+authenticated read-only access (public directory).
*/

CREATE TABLE IF NOT EXISTS government_schemes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text,
  ministry text,
  description text NOT NULL,
  eligibility text,
  benefits text,
  how_to_apply text,
  documents_required text,
  official_url text,
  helpline text,
  state text,
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE government_schemes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_govt_schemes" ON government_schemes;
CREATE POLICY "anon_read_govt_schemes" ON government_schemes FOR SELECT
TO anon, authenticated USING (true);

-- Seed real Indian government agriculture schemes
INSERT INTO government_schemes (name, category, ministry, description, eligibility, benefits, how_to_apply, documents_required, official_url, helpline, state, tags) VALUES
('PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)', 'Subsidy', 'Ministry of Agriculture and Farmers Welfare', 'A central sector scheme providing income support of Rs. 6,000 per year to all landholding farmer families in three equal installments.', 'All landholding farmer families holding cultivable land, excluding institutional farmers, former and present holders of constitutional posts, government employees, professionals like doctors/engineers/lawyers, and income taxpayers.', 'Rs. 6,000 per year in three installments of Rs. 2,000 each directly to bank accounts via DBT.', 'Register at nearest Common Service Centre (CSC) or through the PM-KISAN portal. Fill the registration form with land details and bank account information.', 'Aadhaar card, land ownership documents (patta/khata), bank account passbook', 'https://pmkisan.gov.in', '155261 / 1800-11-5226', NULL, '{pm-kisan,income-support,subsidy,dbt}'),
('Pradhan Mantri Fasal Bima Yojana (PMFBY)', 'Insurance', 'Ministry of Agriculture and Farmers Welfare', 'A crop insurance scheme that provides comprehensive risk cover against natural calamities, pests, and diseases to stabilize farm income.', 'All farmers growing notified crops in notified areas. Loanee farmers are mandatory; non-loanee farmers voluntary. Also covers sharecroppers and tenant farmers.', 'Coverage against crop loss due to natural calamities, pests, diseases, and localized risks. Premium rates: 2% for Kharif, 1.5% for Rabi, 5% for commercial/horticultural crops. Balance actuarial premium shared equally by Centre and State.', 'Contact your bank or insurance company empanelled with the scheme. Fill the proposal form and pay the premium. Can also apply through CSCs or the PMFBY portal.', 'Aadhaar card, land documents, bank account details, sowing certificate from village panchayat', 'https://pmfby.gov.in', '1800-200-3111', NULL, '{crop-insurance,pmfby,risk-cover}'),
('Pradhan Mantri Krishi Sinchayee Yojana (PMKSY)', 'Subsidy', 'Ministry of Agriculture and Farmers Welfare', 'A scheme to achieve convergence of investments in irrigation at the field level, expanding cultivable area under assured irrigation (Har Khet Ko Pani).', 'All farmers, with special focus on small and marginal farmers. Priority given to drought-prone and water-stressed areas.', 'Subsidy up to 90% for micro-irrigation systems (drip/sprinkler). Financial assistance for water sources, distribution, and on-farm water management.', 'Apply through the nearest Agriculture/Horticulture Department office or through the PMKSY portal. Submit the application with land details and proposed micro-irrigation plan.', 'Aadhaar card, land ownership documents, bank passbook, quotation from empanelled agency', 'https://pmksc.gov.in', '1800-11-5577', NULL, '{irrigation,pmksy,micro-irrigation,water,subsidy}'),
('Kisan Credit Card (KCC)', 'Credit', 'Ministry of Finance / NABARD', 'A credit facility providing short-term loans to farmers for purchase of seeds, fertilizers, pesticides, and other agricultural inputs, plus investment credit for farm assets.', 'All farmers — individual, joint borrowers, sharecroppers, tenant farmers, oral lessees, and SHGs. Also available for fisheries and animal husbandry.', 'Flexible credit limit based on crop area and scale of finance. Interest subvention of 1.5% and prompt repayment incentive of 3%, making effective interest rate as low as 4%. Collateral-free up to Rs. 1,00,000.', 'Apply at any commercial bank, RRB, cooperative bank, or through the KCC portal. Submit the application with land details and bank will issue KCC after verification.', 'Aadhaar card, land documents, bank passbook, passport-size photo', 'https://www.myscheme.gov.in/schemes/kcc', '1800-180-1551', NULL, '{credit,loan,kcc,interest-subvention}'),
('Soil Health Card Scheme', 'Service', 'Ministry of Agriculture and Farmers Welfare', 'A scheme providing soil health cards to farmers with nutrient status and fertilizer recommendations for their land.', 'All farmers in India. Cards are issued every 2 years for each landholding.', 'Free soil testing and a personalized soil health card with macro and micronutrient status, fertilizer dosage recommendations, and crop-specific suggestions.', 'Visit your nearest Soil Testing Laboratory (STL) or contact village agriculture officer. Provide a soil sample from your field; the card will be issued after lab analysis.', 'Aadhaar card, land ownership documents, soil sample from field', 'https://soilhealth.dac.gov.in', '1800-11-5226', NULL, '{soil-testing,soil-health-card,fertilizer}'),
('Pradhan Mantri Annadata Aay SanraksHan Abhiyan (PM-AASHA)', 'Subsidy', 'Ministry of Agriculture and Farmers Welfare', 'An umbrella scheme ensuring remunerative prices to farmers for their produce through Price Support Scheme (PSS), Price Deficit Payment Scheme (PDPS), and Private Procurement & Stockist Scheme (PPSS).', 'All farmers producing notified oilseed and pulse crops in notified states/districts.', 'MSP assurance through PSS (procurement by NAFED), PDPS (payment of difference between MSP and market price), or PPSS (private procurement). Protects farmers from price crashes.', 'Register at the nearest procurement center during the procurement season. Contact the state agriculture department or NAFED office for details.', 'Aadhaar card, land documents, bank passbook, produce for sale at procurement center', 'https://pmaasha.gov.in', '1800-11-5226', NULL, '{msp,procurement,pss,aasha,oilseeds,pulses}'),
('Agricultural Infrastructure Fund (AIF)', 'Credit', 'Ministry of Agriculture and Farmers Welfare', 'A financing facility for creation of post-harvest management infrastructure and community farming assets, with interest subvention and credit guarantee.', 'Farmers, FPOs, PACS, SHGs, JLGs, entrepreneurs, and start-ups.', 'Loans up to Rs. 2 crore per project with 3% interest subvention for up to 7 years and credit guarantee coverage up to Rs. 2 crore.', 'Apply through empanelled banks (commercial, RRB, cooperative). Submit a detailed project report; banks appraise and sanction with AIF benefits.', 'Aadhaar/registration certificate, project report, land documents, bank statements', 'https://www.agriinfra.dac.gov.in', '1800-11-5226', NULL, '{infrastructure,aif,loan,post-harvest,fpo}'),
('Modified National Agricultural Market (eNAM)', 'Service', 'Ministry of Agriculture and Farmers Welfare', 'A pan-India electronic trading portal connecting regulated APMC mandis to create a unified national market for agricultural commodities.', 'All farmers registered in eNAM-integrated APMC mandis. Traders and Farmer Producer Organizations (FPOs) can also participate.', 'Online trading of agricultural commodities with transparent pricing, wider market access, reduced transaction costs, and direct payment to bank accounts.', 'Register on the eNAM portal or visit any eNAM-integrated APMC mandi. Provide Aadhaar and bank details to create a trader/farmer account.', 'Aadhaar card, bank passbook, mobile number, land documents', 'https://enam.gov.in', '1800-200-1234', NULL, '{market,trading,enam,apmc,online}'),
('Pradhan Mantri Kisan Maandhan Yojana (PM-KMY)', 'Pension', 'Ministry of Agriculture and Farmers Welfare', 'A voluntary and contributory pension scheme for small and marginal farmers providing a minimum monthly pension of Rs. 3,000 after attaining 60 years of age.', 'Small and marginal farmers (holding up to 2 hectares of land) aged 18-40 years. Monthly contribution ranges from Rs. 55 to Rs. 200 depending on age of entry.', 'Rs. 3,000 per month pension after 60 years of age. Equal contribution by the Central Government. Life insurance cover during the contribution period.', 'Visit nearest CSC or Common Service Centre with Aadhaar and land documents. The contribution is auto-debited from the bank account.', 'Aadhaar card, land ownership documents (up to 2 hectares), bank passbook, mobile number', 'https://maandhan.in', '1800-11-5226', NULL, '{pension,kmy,retirement,small-farmer}'),
('Sub-Mission on Agricultural Mechanization (SMAM)', 'Subsidy', 'Ministry of Agriculture and Farmers Welfare', 'A scheme promoting agricultural mechanization through financial assistance for purchase of farm machinery and equipment, establishment of custom hiring centres, and farm machinery banks.', 'Individual farmers, FPOs, CHCs, and entrepreneurs. Special provision for SC/ST, small & marginal, and women farmers.', 'Up to 50% subsidy on purchase of agricultural machinery and equipment. Up to 80% for CHCs/Farm Machinery Banks in hilly and NE states. Free distribution of farm machinery to SC/ST/women farmers in selected cases.', 'Apply through the state agriculture department or SMAM portal. Submit application with machinery quotation and land details.', 'Aadhaar card, land documents, quotation from empanelled manufacturer, bank passbook', 'https://farmmachinery.dac.gov.in', '1800-11-5226', NULL, '{mechanization,smam,machinery,equipment,subsidy}')
ON CONFLICT DO NOTHING;
