-- Core JanNexus schema

CREATE TABLE public.development_clusters (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  infrastructure_type TEXT NOT NULL,
  problem_type TEXT NOT NULL,
  district TEXT NOT NULL,
  taluka TEXT,
  village TEXT,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  radius_km NUMERIC NOT NULL DEFAULT 1,
  request_count INTEGER NOT NULL DEFAULT 0,
  severity_avg NUMERIC NOT NULL DEFAULT 3,
  recurrence TEXT NOT NULL DEFAULT 'unknown',
  languages TEXT[] NOT NULL DEFAULT '{}',
  affected_population INTEGER NOT NULL DEFAULT 0,
  demand_score NUMERIC NOT NULL DEFAULT 0,
  gap_score NUMERIC NOT NULL DEFAULT 0,
  priority_score NUMERIC NOT NULL DEFAULT 0,
  first_seen DATE NOT NULL DEFAULT CURRENT_DATE,
  last_seen DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.development_clusters TO anon;
GRANT SELECT ON public.development_clusters TO authenticated;
GRANT ALL ON public.development_clusters TO service_role;
ALTER TABLE public.development_clusters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clusters are public" ON public.development_clusters FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.citizen_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  public_ref TEXT NOT NULL DEFAULT ('REQ-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,6))),
  cluster_id TEXT REFERENCES public.development_clusters(id) ON DELETE SET NULL,
  language TEXT NOT NULL DEFAULT 'en',
  raw_text TEXT,
  stated_summary TEXT,
  category TEXT,
  infrastructure_type TEXT,
  problem_type TEXT,
  severity INTEGER,
  recurrence TEXT,
  district TEXT,
  taluka TEXT,
  village TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  affected_population_estimate INTEGER,
  confidence NUMERIC,
  inferred JSONB NOT NULL DEFAULT '{}'::jsonb,
  evidence TEXT[] NOT NULL DEFAULT '{}',
  confirmed BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'received',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.citizen_requests TO anon;
GRANT SELECT, INSERT, UPDATE ON public.citizen_requests TO authenticated;
GRANT ALL ON public.citizen_requests TO service_role;
ALTER TABLE public.citizen_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "requests are publicly readable" ON public.citizen_requests FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anyone can submit a request" ON public.citizen_requests FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anyone can confirm a request" ON public.citizen_requests FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.infrastructure_assets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  asset_type TEXT NOT NULL,
  district TEXT NOT NULL,
  village TEXT,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  condition TEXT NOT NULL DEFAULT 'fair',
  serves_population INTEGER NOT NULL DEFAULT 0,
  notes TEXT
);
GRANT SELECT ON public.infrastructure_assets TO anon;
GRANT SELECT ON public.infrastructure_assets TO authenticated;
GRANT ALL ON public.infrastructure_assets TO service_role;
ALTER TABLE public.infrastructure_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "assets are public" ON public.infrastructure_assets FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  scheme TEXT,
  department TEXT,
  category TEXT NOT NULL,
  district TEXT NOT NULL,
  village TEXT,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  status TEXT NOT NULL DEFAULT 'planned',
  budget_inr BIGINT NOT NULL DEFAULT 0,
  start_date DATE,
  end_date DATE,
  coverage_note TEXT
);
GRANT SELECT ON public.projects TO anon;
GRANT SELECT ON public.projects TO authenticated;
GRANT ALL ON public.projects TO service_role;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "projects are public" ON public.projects FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.recommendations (
  id TEXT PRIMARY KEY,
  cluster_id TEXT REFERENCES public.development_clusters(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  intervention TEXT NOT NULL,
  category TEXT NOT NULL,
  district TEXT NOT NULL,
  village TEXT,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  affected_population INTEGER NOT NULL DEFAULT 0,
  estimated_cost_inr BIGINT NOT NULL DEFAULT 0,
  confidence NUMERIC NOT NULL DEFAULT 0.8,
  priority_score NUMERIC NOT NULL DEFAULT 0,
  overlap_flag BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending',
  decision_note TEXT,
  evidence JSONB NOT NULL DEFAULT '[]'::jsonb,
  why_this JSONB NOT NULL DEFAULT '[]'::jsonb,
  why_not JSONB NOT NULL DEFAULT '[]'::jsonb,
  expected_impact JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.recommendations TO anon;
GRANT SELECT, UPDATE ON public.recommendations TO authenticated;
GRANT ALL ON public.recommendations TO service_role;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "recommendations are public" ON public.recommendations FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "recommendation decisions are open in demo" ON public.recommendations FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.impact_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recommendation_id TEXT REFERENCES public.recommendations(id) ON DELETE CASCADE,
  metric TEXT NOT NULL,
  unit TEXT NOT NULL,
  baseline NUMERIC NOT NULL,
  current NUMERIC NOT NULL,
  target NUMERIC NOT NULL
);
GRANT SELECT ON public.impact_metrics TO anon;
GRANT SELECT ON public.impact_metrics TO authenticated;
GRANT ALL ON public.impact_metrics TO service_role;
ALTER TABLE public.impact_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "impact metrics are public" ON public.impact_metrics FOR SELECT TO anon, authenticated USING (true);

-- ============ Demo data ============

INSERT INTO public.development_clusters
(id, title, category, infrastructure_type, problem_type, district, taluka, village, lat, lng, radius_km, request_count, severity_avg, recurrence, languages, affected_population, demand_score, gap_score, priority_score, first_seen, last_seen) VALUES
('CL-104','School access road floods every monsoon','education','school_access_road','flooding','Pune','Purandar','Wagholi Khurd',18.3921,74.0512,2.8,417,4.4,'seasonal',ARRAY['hi','mr','en'],12400,88,91,93,'2025-06-14','2026-09-22'),
('CL-118','No piped drinking water in summer months','water','piped_water_supply','shortage','Pune','Baramati','Sonawadi',18.1512,74.5798,4.1,286,4.7,'seasonal',ARRAY['mr','hi'],9100,81,95,90,'2025-03-02','2026-09-28'),
('CL-131','Primary health centre too far for emergencies','health','primary_health_centre','access_distance','Pune','Velhe','Panshet Wadi',18.2074,73.6141,6.2,193,4.1,'chronic',ARRAY['mr','en'],7300,74,88,84,'2025-08-11','2026-09-19'),
('CL-142','Street lighting missing on village approach road','urban','street_lighting','absent_service',
'Pune','Haveli','Kondhanpur',18.3410,73.6902,1.6,142,3.2,'chronic',ARRAY['mr','hi','en'],5400,63,58,61,'2026-01-19','2026-09-25'),
('CL-155','Open drain overflow near market area','sanitation','storm_drain','overflow','Pune','Indapur','Bhigwan',18.3055,74.7645,2.2,231,3.9,'seasonal',ARRAY['mr','hi'],8800,77,64,72,'2025-07-06','2026-09-27'),
('CL-163','Bus stop and last-mile transport gap for girls'' school','transport','bus_stop','service_gap','Pune','Junnar','Narayangaon',19.0521,73.9451,3.4,167,3.6,'chronic',ARRAY['mr','en'],6200,69,71,70,'2026-02-08','2026-09-20');

INSERT INTO public.infrastructure_assets (id, name, asset_type, district, village, lat, lng, condition, serves_population, notes) VALUES
('AS-01','Zilla Parishad Primary School, Wagholi Khurd','school','Pune','Wagholi Khurd',18.3930,74.0525,'fair',1100,'Approach road unsurfaced for 1.4 km'),
('AS-02','Culvert on Nira feeder canal','culvert','Pune','Wagholi Khurd',18.3885,74.0480,'poor',12400,'Undersized, overtops in heavy rain'),
('AS-03','Sonawadi overhead water tank','water_tank','Pune','Sonawadi',18.1498,74.5771,'fair',3200,'Capacity insufficient for summer demand'),
('AS-04','Baramati Rural Water Scheme intake','water_intake','Pune','Baramati',18.1520,74.5810,'good',22000,'Distribution network ends 6 km short'),
('AS-05','Sub-centre, Panshet Wadi','health_subcentre','Pune','Panshet Wadi',18.2091,73.6155,'poor',4100,'No doctor posted; no ambulance'),
('AS-06','Primary Health Centre, Velhe','phc','Pune','Velhe',18.2867,73.6402,'good',31000,'28 km by road from Panshet Wadi'),
('AS-07','Kondhanpur approach road','road','Pune','Kondhanpur',18.3418,73.6915,'fair',5400,'No lighting poles installed'),
('AS-08','Bhigwan market storm drain','storm_drain','Pune','Bhigwan',18.3061,74.7650,'poor',8800,'Silted; last desilted 2021'),
('AS-09','Narayangaon ST bus stand','bus_stand','Pune','Narayangaon',19.0510,73.9440,'fair',6200,'No shelter on school route spur'),
('AS-10','Girls'' Secondary School, Narayangaon','school','Pune','Narayangaon',19.0546,73.9478,'good',900,'Students walk 2.6 km from nearest stop');

INSERT INTO public.projects (id, name, scheme, department, category, district, village, lat, lng, status, budget_inr, start_date, end_date, coverage_note) VALUES
('PR-01','Nira canal culvert widening (Phase I)','PMGSY','Rural Development','road','Pune','Wagholi Khurd',18.3872,74.0468,'planned',14500000,'2026-11-01','2027-06-30','Covers canal crossing only, not the 1.4 km school spur'),
('PR-02','Baramati regional pipeline extension','Jal Jeevan Mission','Water Supply','water','Pune','Baramati',18.1535,74.5822,'in_progress',86000000,'2025-09-01','2027-03-31','Ends 6 km short of Sonawadi cluster'),
('PR-03','Velhe PHC upgrade to 30-bed','NHM','Public Health','health','Pune','Velhe',18.2869,73.6398,'in_progress',52000000,'2026-04-01','2027-12-31','Improves capacity, not travel distance'),
('PR-04','Solar street lighting, Haveli block','MNRE / Gram Panchayat','Energy','urban','Pune','Kondhanpur',18.3440,73.6950,'planned',3200000,'2026-12-01','2027-05-31','Overlaps 62% of requested stretch'),
('PR-05','Bhigwan market redevelopment','AMRUT 2.0','Urban Development','sanitation','Pune','Bhigwan',18.3049,74.7638,'planned',41000000,'2027-01-01','2028-06-30','Drain desilting in scope; overflow capacity not addressed'),
('PR-06','Junnar block road resurfacing','State Highways','PWD','road','Pune','Narayangaon',19.0488,73.9412,'completed',23000000,'2024-05-01','2025-10-31','No bus stop or shelter component'),
('PR-07','Purandar school sanitation block','Samagra Shiksha','Education','education','Pune','Wagholi Khurd',18.3928,74.0520,'completed',1800000,'2025-01-10','2025-08-20','Unrelated to access road flooding');

INSERT INTO public.recommendations
(id, cluster_id, title, intervention, category, district, village, lat, lng, affected_population, estimated_cost_inr, confidence, priority_score, overlap_flag, status, evidence, why_this, why_not, expected_impact) VALUES
('RC-01','CL-104','Raise and surface the 1.4 km school access road with box culverts','Road raising + 2 box culverts + side drains','road','Pune','Wagholi Khurd',18.3921,74.0512,12400,38000000,0.91,93,true,'pending',
 '[{"source":"Citizen signals","detail":"417 requests in Hindi, Marathi and English over 15 months"},{"source":"Recurrence","detail":"Peaks every June-September, three monsoons running"},{"source":"Infrastructure","detail":"Culvert AS-02 rated poor and undersized"},{"source":"Geography","detail":"Road sits 1.1 m below canal embankment level"},{"source":"Existing spend","detail":"PR-01 covers the canal crossing only"}]'::jsonb,
 '["Demand is dense: 417 requests inside a 2.8 km radius","Repeat seasonal pattern rules out a one-off complaint","1,100 school children lose 20-30 teaching days a year","Planned project PR-01 leaves the school spur uncovered"]'::jsonb,
 '["Culvert-only repair: leaves the sunken 1.4 km stretch flooding","Alternative alignment via Nira bund: 4x cost, displaces 11 households","Deferring to next fiscal year: misses the 2027 pre-monsoon window"]'::jsonb,
 '{"metric":"School days protected","value":"~26 days/year","population_served":12400,"cost_per_person_inr":3065}'::jsonb),
('RC-02','CL-118','Extend the Baramati pipeline 6 km and add a 2 lakh-litre tank at Sonawadi','Pipeline extension + overhead tank + 4 stand posts','water','Pune','Sonawadi',18.1512,74.5798,9100,64000000,0.88,90,true,'pending',
 '[{"source":"Citizen signals","detail":"286 requests, 71% between March and June"},{"source":"Infrastructure","detail":"Existing tank AS-03 serves 3,200 of 9,100 people"},{"source":"Existing spend","detail":"PR-02 pipeline terminates 6 km away"},{"source":"Severity","detail":"Average reported severity 4.7 of 5"}]'::jsonb,
 '["Highest infrastructure gap score in the district (95)","Marginal cost is low because trunk line already funded","Summer tanker spend recurs every year at ~₹42 lakh"]'::jsonb,
 '["New borewells: aquifer declining, 3 of 5 failed since 2023","Tanker supply only: ongoing cost with no asset created"]'::jsonb,
 '{"metric":"Households with year-round piped water","value":"+1,820","population_served":9100,"cost_per_person_inr":7033}'::jsonb),
('RC-03','CL-131','Post a doctor and station a 24x7 ambulance at Panshet Wadi sub-centre','Staffing sanction + ambulance + night facility upgrade','health','Pune','Panshet Wadi',18.2074,73.6141,7300,21000000,0.84,84,false,'pending',
 '[{"source":"Citizen signals","detail":"193 requests, mostly emergency and maternity travel"},{"source":"Geography","detail":"28 km and 70 minutes to Velhe PHC in monsoon"},{"source":"Infrastructure","detail":"Sub-centre AS-05 rated poor, no doctor posted"},{"source":"Existing spend","detail":"PR-03 adds beds at Velhe but not proximity"}]'::jsonb,
 '["Travel time, not bed capacity, is the binding constraint","Lowest-cost intervention among the top five priorities","Serves 7,300 people across 9 hamlets"]'::jsonb,
 '["New PHC building at Panshet Wadi: ₹9.4 crore, 3-year timeline","Relying on PR-03: reduces crowding, not the 28 km journey"]'::jsonb,
 '{"metric":"Median emergency response time","value":"70 min to 22 min","population_served":7300,"cost_per_person_inr":2877}'::jsonb),
('RC-04','CL-155','Rebuild the Bhigwan market drain to 1-in-10-year storm capacity','Drain reconstruction + desilting chamber + outfall','sanitation','Pune','Bhigwan',18.3055,74.7645,8800,29000000,0.8,72,true,'pending',
 '[{"source":"Citizen signals","detail":"231 requests clustered on market days"},{"source":"Infrastructure","detail":"Drain AS-08 silted, last desilted 2021"},{"source":"Existing spend","detail":"PR-05 includes desilting but not capacity"}]'::jsonb,
 '["Overflow recurs every monsoon despite periodic desilting","Can be folded into PR-05 packaging to save mobilisation cost"]'::jsonb,
 '["Desilting alone: PR-05 already tries this; overflow returns","Full market relocation: out of proportion to the problem"]'::jsonb,
 '{"metric":"Market days lost to flooding","value":"14 to 2 per year","population_served":8800,"cost_per_person_inr":3295}'::jsonb),
('RC-05','CL-163','Add a school-route bus spur with two lit shelters at Narayangaon','Route extension + 2 shelters + lighting','transport','Pune','Narayangaon',19.0521,73.9451,6200,9500000,0.79,70,false,'pending',
 '[{"source":"Citizen signals","detail":"167 requests, 63% mention girls'' school attendance"},{"source":"Infrastructure","detail":"Nearest stop AS-09 is 2.6 km from the school"},{"source":"Existing spend","detail":"PR-06 resurfaced the road with no stop component"}]'::jsonb,
 '["Cheapest intervention per person served in the portfolio","Road surface already upgraded, so the spur is low-risk","Directly linked to reported school attendance drop-off"]'::jsonb,
 '["Cycle distribution scheme: does not address monsoon or safety concerns","New school building: demand is about access, not capacity"]'::jsonb,
 '{"metric":"Students within 500 m of a stop","value":"+780","population_served":6200,"cost_per_person_inr":1532}'::jsonb),
('RC-06','CL-142','Complete solar street lighting on the uncovered 38% of Kondhanpur road','Solar poles on the residual stretch','urban','Pune','Kondhanpur',18.3410,73.6902,5400,1900000,0.76,61,true,'pending',
 '[{"source":"Citizen signals","detail":"142 requests, mostly evening safety"},{"source":"Existing spend","detail":"PR-04 already covers 62% of the requested stretch"}]'::jsonb,
 '["Small top-up avoids duplicating the sanctioned PR-04 scope","Closes a visible gap on an otherwise lit road"]'::jsonb,
 '["Full new lighting contract: 62% would duplicate PR-04 spend","No action: leaves an unlit 1.1 km stretch on a school route"]'::jsonb,
 '{"metric":"Lit length on approach road","value":"62% to 100%","population_served":5400,"cost_per_person_inr":352}'::jsonb);

INSERT INTO public.impact_metrics (recommendation_id, metric, unit, baseline, current, target) VALUES
('RC-01','School days lost to flooding','days/year',26,18,2),
('RC-01','Households with all-weather access','households',0,240,1980),
('RC-02','Villages with year-round piped water','villages',2,4,11),
('RC-02','Summer tanker trips','trips/season',640,470,40),
('RC-03','Median emergency response time','minutes',70,52,22),
('RC-04','Market days lost to flooding','days/year',14,11,2),
('RC-05','Students within 500 m of a stop','students',120,120,900),
('RC-06','Lit length on approach road','percent',62,62,100);

-- citizen requests feeding the clusters
INSERT INTO public.citizen_requests
(cluster_id, language, raw_text, stated_summary, category, infrastructure_type, problem_type, severity, recurrence, district, taluka, village, lat, lng, affected_population_estimate, confidence, inferred, evidence, confirmed, status, created_at) VALUES
('CL-104','hi','हर बारिश में हमारे गांव का स्कूल जाने वाला रास्ता बंद हो जाता है।','School road closes in every rain','education','school_access_road','flooding',5,'seasonal','Pune','Purandar','Wagholi Khurd',18.3921,74.0512,1100,0.93,'{"affected_population_estimate":"inferred from school enrolment","recurrence":"inferred from wording \"every rain\""}'::jsonb,ARRAY['citizen_text'],true,'clustered','2026-07-04 09:12+05:30'),
('CL-104','mr','शाळेचा रस्ता पावसात पूर्ण चिखल होतो, मुलं शाळेत जात नाहीत.','Road turns to mud, children miss school','education','school_access_road','flooding',4,'seasonal','Pune','Purandar','Wagholi Khurd',18.3908,74.0498,900,0.9,'{"severity":"inferred from attendance impact"}'::jsonb,ARRAY['citizen_text','citizen_image'],true,'clustered','2026-07-11 18:40+05:30'),
('CL-104','en','The culvert near the canal overflows and cuts off the school for days.','Culvert overflow cuts off school','education','school_access_road','flooding',4,'seasonal','Pune','Purandar','Wagholi Khurd',18.3889,74.0483,1200,0.88,'{"affected_asset":"matched to culvert AS-02"}'::jsonb,ARRAY['citizen_text'],true,'clustered','2026-08-02 07:55+05:30'),
('CL-118','mr','उन्हाळ्यात नळाला पाणी येत नाही, टँकरवर अवलंबून राहावं लागतं.','No tap water in summer, depend on tankers','water','piped_water_supply','shortage',5,'seasonal','Pune','Baramati','Sonawadi',18.1512,74.5798,1400,0.92,'{"recurrence":"inferred seasonal from \"summer\""}'::jsonb,ARRAY['citizen_text'],true,'clustered','2026-04-18 11:20+05:30'),
('CL-118','hi','पानी की लाइन हमारे गांव तक नहीं पहुंची है।','Pipeline has not reached the village','water','piped_water_supply','absent_service',5,'chronic','Pune','Baramati','Sonawadi',18.1490,74.5762,1600,0.9,'{"gap":"matched to PR-02 terminus 6 km away"}'::jsonb,ARRAY['citizen_text','citizen_voice'],true,'clustered','2026-05-09 16:05+05:30'),
('CL-131','mr','रात्री कोणी आजारी पडलं तर दवाखाना खूप लांब आहे.','Clinic too far at night','health','primary_health_centre','access_distance',5,'chronic','Pune','Velhe','Panshet Wadi',18.2074,73.6141,800,0.87,'{"distance":"28 km computed to PHC AS-06"}'::jsonb,ARRAY['citizen_text','citizen_voice'],true,'clustered','2026-06-27 22:31+05:30'),
('CL-131','en','No doctor at the sub-centre, we travel to Velhe for everything.','No doctor at sub-centre','health','primary_health_centre','staffing',4,'chronic','Pune','Velhe','Panshet Wadi',18.2088,73.6167,950,0.85,'{}'::jsonb,ARRAY['citizen_text'],true,'clustered','2026-08-14 10:02+05:30'),
('CL-142','mr','गावाच्या रस्त्यावर दिवे नाहीत, संध्याकाळी भीती वाटते.','No lights on village road, unsafe in evening','urban','street_lighting','absent_service',3,'chronic','Pune','Haveli','Kondhanpur',18.3410,73.6902,600,0.83,'{"overlap":"62% of stretch inside PR-04 scope"}'::jsonb,ARRAY['citizen_text'],true,'clustered','2026-09-02 20:15+05:30'),
('CL-155','hi','बाजार के पास नाली का पानी सड़क पर बहता है।','Drain water flows onto market road','sanitation','storm_drain','overflow',4,'seasonal','Pune','Indapur','Bhigwan',18.3055,74.7645,1200,0.86,'{"asset":"matched to drain AS-08"}'::jsonb,ARRAY['citizen_text','citizen_image'],true,'clustered','2026-08-21 08:44+05:30'),
('CL-163','mr','मुलींच्या शाळेपर्यंत बस थांबा नाही, अडीच किलोमीटर चालावं लागतं.','No bus stop near girls school','transport','bus_stop','service_gap',4,'chronic','Pune','Junnar','Narayangaon',19.0521,73.9451,780,0.84,'{"distance":"2.6 km measured from AS-09"}'::jsonb,ARRAY['citizen_text'],true,'clustered','2026-09-10 13:27+05:30'),
(NULL,'en','Garbage is not collected near the bus stand for the last two weeks.','Garbage not collected','sanitation','solid_waste','service_lapse',2,'one_time','Pune','Junnar','Narayangaon',19.0509,73.9438,300,0.72,'{}'::jsonb,ARRAY['citizen_text'],false,'received','2026-09-26 09:18+05:30'),
(NULL,'hi','स्कूल के पास स्ट्रीट लाइट खराब है।','Street light broken near school','urban','street_lighting','maintenance',2,'one_time','Pune','Haveli','Kondhanpur',18.3425,73.6921,180,0.7,'{}'::jsonb,ARRAY['citizen_text'],false,'received','2026-09-28 19:44+05:30');
