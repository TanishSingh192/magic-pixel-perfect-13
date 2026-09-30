-- 1. Transparent priority: 45% demand + 45% gap + 10% severity (avg severity scaled to 0-100)
UPDATE public.development_clusters
   SET priority_score = round(0.45*demand_score + 0.45*gap_score + 0.10*(severity_avg/5*100), 1);
UPDATE public.recommendations r
   SET priority_score = c.priority_score
  FROM public.development_clusters c WHERE c.id = r.cluster_id;

-- 2. Cluster counts are aggregates from historic grievance exports; say so.
ALTER TABLE public.development_clusters ADD COLUMN IF NOT EXISTS count_source TEXT NOT NULL
  DEFAULT 'Aggregate of historic grievance-portal records (demo figures) plus JanNexus reports';

-- 3. Channel on every citizen report
ALTER TABLE public.citizen_requests ADD COLUMN IF NOT EXISTS channel TEXT NOT NULL DEFAULT 'web';
UPDATE public.citizen_requests SET channel = CASE
  WHEN 'citizen_voice' = ANY(evidence) THEN 'web_voice'
  WHEN 'citizen_image' = ANY(evidence) THEN 'web_image'
  ELSE 'web_text' END;

-- 4. Correct contradictory "why this" claims
UPDATE public.recommendations SET why_this = '["Travel time, not bed capacity, is the binding constraint","At ₹2.1 crore it costs a third of the Sonawadi water scheme (RC-02) and serves 7,300 people","Serves 7,300 people across 9 hamlets"]'::jsonb WHERE id = 'RC-03';
UPDATE public.recommendations SET why_this = '["Cheapest per person among the top five priorities (₹1,532 per person)","Road surface already upgraded, so the spur is low-risk","Directly linked to reported school attendance drop-off"]'::jsonb WHERE id = 'RC-05';

-- 5. Impact metrics: nothing has happened for pending recommendations, so current = baseline;
--    RC-02 metric scoped to the single village; add outcome metrics for existing projects.
ALTER TABLE public.impact_metrics ADD COLUMN IF NOT EXISTS project_id TEXT REFERENCES public.projects(id) ON DELETE CASCADE;
UPDATE public.impact_metrics SET current = baseline WHERE recommendation_id IS NOT NULL;
UPDATE public.impact_metrics
   SET metric = 'Sonawadi households with year-round piped water', unit = 'households', baseline = 700, current = 700, target = 2520
 WHERE recommendation_id = 'RC-02' AND unit = 'villages';

INSERT INTO public.impact_metrics (project_id, metric, unit, baseline, current, target) VALUES
('PR-01','Canal-crossing closure days','days/year',21,21,3),
('PR-02','Villages connected to the regional pipeline','villages',4,7,12),
('PR-03','Velhe PHC beds available','beds',10,18,30),
('PR-04','Haveli approach roads lit','km',0,0,6.4),
('PR-05','Market drain desilting cycles completed','cycles/year',0,0,2),
('PR-06','Junnar road length in good condition','km',9,31,31),
('PR-07','Schools with functional girls'' toilets','schools',3,8,8);

-- 6. Anonymous submissions record their channel
CREATE OR REPLACE FUNCTION public.submit_citizen_request(payload jsonb)
RETURNS TABLE (id uuid, public_ref text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  INSERT INTO public.citizen_requests AS c (
    language, raw_text, stated_summary, category, infrastructure_type, problem_type,
    severity, recurrence, district, village, lat, lng, confidence, inferred, evidence, channel
  ) VALUES (
    COALESCE(left(payload->>'language', 8), 'en'),
    left(payload->>'raw_text', 5000),
    left(payload->>'stated_summary', 2000),
    left(payload->>'category', 100),
    left(payload->>'infrastructure_type', 100),
    left(payload->>'problem_type', 200),
    LEAST(GREATEST((payload->>'severity')::int, 1), 5),
    left(payload->>'recurrence', 30),
    left(payload->>'district', 120),
    left(payload->>'village', 120),
    (payload->>'lat')::double precision,
    (payload->>'lng')::double precision,
    (payload->>'confidence')::numeric,
    COALESCE(payload->'inferred', '{}'::jsonb),
    COALESCE(ARRAY(SELECT jsonb_array_elements_text(payload->'evidence')), '{}'),
    CASE WHEN payload->>'channel' IN ('web_text','web_voice','web_image') THEN payload->>'channel' ELSE 'web_text' END
  )
  RETURNING c.id, c.public_ref;
END $$;
REVOKE ALL ON FUNCTION public.submit_citizen_request(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_citizen_request(jsonb) TO anon, authenticated;