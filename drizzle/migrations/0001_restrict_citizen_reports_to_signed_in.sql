DROP POLICY IF EXISTS "requests are publicly readable" ON public.citizen_requests;
DROP POLICY IF EXISTS "anyone can submit a request" ON public.citizen_requests;
DROP POLICY IF EXISTS "anyone can confirm a request" ON public.citizen_requests;
REVOKE SELECT, INSERT, UPDATE ON public.citizen_requests FROM anon;

CREATE POLICY "signed-in planners read requests" ON public.citizen_requests FOR SELECT TO authenticated USING (true);
CREATE POLICY "signed-in users can submit" ON public.citizen_requests FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "signed-in planners update requests" ON public.citizen_requests FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "recommendation decisions are open in demo" ON public.recommendations;
REVOKE UPDATE ON public.recommendations FROM anon;
CREATE POLICY "signed-in planners decide" ON public.recommendations FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Citizens submit without an account: narrow functions that never return other people's reports.
CREATE OR REPLACE FUNCTION public.submit_citizen_request(payload jsonb)
RETURNS TABLE (id uuid, public_ref text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  INSERT INTO public.citizen_requests AS c (
    language, raw_text, stated_summary, category, infrastructure_type, problem_type,
    severity, recurrence, district, village, lat, lng, confidence, inferred, evidence
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
    COALESCE(ARRAY(SELECT jsonb_array_elements_text(payload->'evidence')), '{}')
  )
  RETURNING c.id, c.public_ref;
END $$;

CREATE OR REPLACE FUNCTION public.confirm_citizen_request(_id uuid, _confirmed boolean, _correction text)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.citizen_requests
     SET confirmed = _confirmed,
         status = CASE WHEN _confirmed THEN 'confirmed' ELSE 'needs_review' END,
         raw_text = COALESCE(NULLIF(left(_correction, 5000), ''), raw_text)
   WHERE id = _id AND status = 'received';
  RETURN FOUND;
END $$;

REVOKE ALL ON FUNCTION public.submit_citizen_request(jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.confirm_citizen_request(uuid, boolean, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_citizen_request(jsonb) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_citizen_request(uuid, boolean, text) TO anon, authenticated;