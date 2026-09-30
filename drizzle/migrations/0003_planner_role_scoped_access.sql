CREATE TYPE public.app_role AS ENUM ('admin', 'planner');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_planner(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('planner','admin'))
$$;

-- Keep existing accounts working as planners
INSERT INTO public.user_roles (user_id, role) SELECT id, 'planner' FROM auth.users ON CONFLICT DO NOTHING;

-- citizen_requests
DROP POLICY IF EXISTS "signed-in planners read requests" ON public.citizen_requests;
DROP POLICY IF EXISTS "signed-in planners update requests" ON public.citizen_requests;
DROP POLICY IF EXISTS "signed-in users can submit" ON public.citizen_requests;
REVOKE INSERT ON public.citizen_requests FROM authenticated;
CREATE POLICY "planners read requests" ON public.citizen_requests FOR SELECT TO authenticated USING (public.is_planner(auth.uid()));
CREATE POLICY "planners update requests" ON public.citizen_requests FOR UPDATE TO authenticated USING (public.is_planner(auth.uid())) WITH CHECK (public.is_planner(auth.uid()));

-- recommendations
DROP POLICY IF EXISTS "recommendations are public" ON public.recommendations;
DROP POLICY IF EXISTS "signed-in planners decide" ON public.recommendations;
REVOKE ALL ON public.recommendations FROM anon;
CREATE POLICY "planners read recommendations" ON public.recommendations FOR SELECT TO authenticated USING (public.is_planner(auth.uid()));
CREATE POLICY "planners decide" ON public.recommendations FOR UPDATE TO authenticated USING (public.is_planner(auth.uid())) WITH CHECK (public.is_planner(auth.uid()));

-- reference tables
DROP POLICY IF EXISTS "clusters are public" ON public.development_clusters;
DROP POLICY IF EXISTS "assets are public" ON public.infrastructure_assets;
DROP POLICY IF EXISTS "projects are public" ON public.projects;
DROP POLICY IF EXISTS "impact metrics are public" ON public.impact_metrics;
REVOKE ALL ON public.development_clusters, public.infrastructure_assets, public.projects, public.impact_metrics FROM anon;
CREATE POLICY "planners read clusters" ON public.development_clusters FOR SELECT TO authenticated USING (public.is_planner(auth.uid()));
CREATE POLICY "planners read assets" ON public.infrastructure_assets FOR SELECT TO authenticated USING (public.is_planner(auth.uid()));
CREATE POLICY "planners read projects" ON public.projects FOR SELECT TO authenticated USING (public.is_planner(auth.uid()));
CREATE POLICY "planners read impact metrics" ON public.impact_metrics FOR SELECT TO authenticated USING (public.is_planner(auth.uid()));