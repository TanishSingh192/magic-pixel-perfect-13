import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function publicClient() {
  const url = process.env["SUPABASE_URL"]!;
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
}

export type Cluster = Database["public"]["Tables"]["development_clusters"]["Row"];
export type Recommendation = Database["public"]["Tables"]["recommendations"]["Row"];
export type Project = Database["public"]["Tables"]["projects"]["Row"];
export type Asset = Database["public"]["Tables"]["infrastructure_assets"]["Row"];
export type CitizenRequest = Database["public"]["Tables"]["citizen_requests"]["Row"];
export type ImpactMetric = Database["public"]["Tables"]["impact_metrics"]["Row"];

export const getPlatformData = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = publicClient();
  const [clusters, recommendations, projects, assets, requests, metrics] = await Promise.all([
    supabase.from("development_clusters").select("*").order("priority_score", { ascending: false }),
    supabase.from("recommendations").select("*").order("priority_score", { ascending: false }),
    supabase.from("projects").select("*").order("id"),
    supabase.from("infrastructure_assets").select("*").order("id"),
    supabase
      .from("citizen_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(60),
    supabase.from("impact_metrics").select("*").order("recommendation_id"),
  ]);

  const firstError =
    clusters.error ?? recommendations.error ?? projects.error ?? assets.error ?? requests.error ?? metrics.error;
  if (firstError) throw new Error(firstError.message);

  const clusterRows = clusters.data ?? [];
  const recommendationRows = recommendations.data ?? [];

  return {
    clusters: clusterRows,
    recommendations: recommendationRows,
    projects: projects.data ?? [],
    assets: assets.data ?? [],
    requests: requests.data ?? [],
    metrics: metrics.data ?? [],
    totals: {
      signals: clusterRows.reduce((sum, c) => sum + c.request_count, 0) + (requests.data?.length ?? 0),
      clusters: clusterRows.length,
      highPriorityGaps: clusterRows.filter((c) => Number(c.gap_score) >= 70).length,
      overlaps: recommendationRows.filter((r) => r.overlap_flag).length,
      trackedProjects: projects.data?.length ?? 0,
      peopleCovered: recommendationRows.reduce((sum, r) => sum + r.affected_population, 0),
    },
  };
});

export const submitCitizenRequest = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      language: string;
      rawText: string | null;
      statedSummary: string | null;
      category: string | null;
      infrastructureType: string | null;
      problemType: string | null;
      severity: number | null;
      recurrence: string | null;
      district: string | null;
      village: string | null;
      lat: number | null;
      lng: number | null;
      confidence: number | null;
      inferred: Record<string, string>;
      evidence: string[];
    }) => input,
  )
  .handler(async ({ data }) => {
    const supabase = publicClient();
    const { data: row, error } = await supabase
      .from("citizen_requests")
      .insert({
        language: data.language,
        raw_text: data.rawText,
        stated_summary: data.statedSummary,
        category: data.category,
        infrastructure_type: data.infrastructureType,
        problem_type: data.problemType,
        severity: data.severity,
        recurrence: data.recurrence,
        district: data.district,
        village: data.village,
        lat: data.lat,
        lng: data.lng,
        confidence: data.confidence,
        inferred: data.inferred,
        evidence: data.evidence,
      })
      .select("id, public_ref")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const confirmCitizenRequest = createServerFn({ method: "POST" })
  .inputValidator((input: { id: string; confirmed: boolean; correction?: string | null }) => input)
  .handler(async ({ data }) => {
    const supabase = publicClient();
    const patch: { confirmed: boolean; status: string; raw_text?: string } = {
      confirmed: data.confirmed,
      status: data.confirmed ? "confirmed" : "needs_review",
    };
    if (data.correction) patch.raw_text = data.correction;
    const { error } = await supabase.from("citizen_requests").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setRecommendationDecision = createServerFn({ method: "POST" })
  .inputValidator((input: { id: string; status: string; note?: string | null }) => input)
  .handler(async ({ data }) => {
    const allowed = ["pending", "accepted", "modified", "rejected", "investigating"];
    if (!allowed.includes(data.status)) throw new Error("Unsupported decision");
    const supabase = publicClient();
    const { error } = await supabase
      .from("recommendations")
      .update({ status: data.status, decision_note: data.note ?? null })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
