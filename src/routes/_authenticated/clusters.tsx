import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";

import {
  formatCount,
  formatInr,
  signalDot,
  signalLabel,
  signalLevel,
  titleCase,
} from "@/lib/jannexus-format";
import { platformQuery } from "@/lib/platform-query";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/clusters")({
  head: () => ({
    meta: [
      { title: "Development clusters — JanNexus" },
      {
        name: "description",
        content:
          "Semantically similar citizen requests grouped into geographic development clusters, with the infrastructure and projects already in place.",
      },
      { property: "og:title", content: "Development clusters — JanNexus" },
      {
        property: "og:description",
        content: "Hundreds of differently worded requests become one measurable development need.",
      },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(platformQuery),
  component: Clusters,
});

function Clusters() {
  const { data } = useSuspenseQuery(platformQuery);
  const [openId, setOpenId] = useState<string | null>(data.clusters[0]?.id ?? null);

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <p className="label-eyebrow">Semantic deduplication &amp; clustering</p>
      <h1 className="mt-2 text-3xl font-semibold">Development clusters</h1>
      <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
        Requests worded differently — “road near school is broken”, “रास्ता खराब है”, “शाळेचा रस्ता बंद होतो” —
        collapse into one development need with a radius, a population and an evidence base.
      </p>

      <div className="surface-panel mt-6 p-5 text-sm">
        <p className="label-eyebrow">How priority is scored</p>
        <p className="mt-2 font-mono text-xs">priority = 0.45 × demand + 0.45 × gap + 0.10 × severity (avg severity ÷ 5 × 100)</p>
        <p className="mt-2 text-muted-foreground">
          Demand reflects request volume, density and recurrence. Gap reflects how far existing assets and funded
          projects fall short. Because it is a weighted average, priority always sits between its inputs.
        </p>
        <p className="mt-2 text-muted-foreground">
          Request counts are aggregates: historic grievance-portal records (demo figures) plus reports submitted
          through JanNexus. Only a sample of individual reports is stored in this demo.
        </p>
      </div>

      <div className="mt-8 space-y-4">
        {data.clusters.map((cluster) => {
          const level = signalLevel(Number(cluster.priority_score));
          const open = openId === cluster.id;
          const members = data.requests.filter((request) => request.cluster_id === cluster.id);
          const overlapping = data.projects.filter(
            (project) =>
              Math.abs(project.lat - cluster.lat) < 0.08 && Math.abs(project.lng - cluster.lng) < 0.08,
          );
          const nearbyAssets = data.assets.filter(
            (asset) => Math.abs(asset.lat - cluster.lat) < 0.08 && Math.abs(asset.lng - cluster.lng) < 0.08,
          );

          return (
            <section key={cluster.id} className="surface-panel overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenId(open ? null : cluster.id)}
                className="flex w-full flex-wrap items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-secondary/40"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className={cn("size-2.5 rounded-full", signalDot[level])} />
                    <span className="numeric text-xs text-muted-foreground">
                      {cluster.id} · {signalLabel[level]}
                    </span>
                  </div>
                  <h2 className="mt-2 text-lg font-semibold">{cluster.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {cluster.village}, {cluster.taluka} · radius {Number(cluster.radius_km)} km ·{" "}
                    {titleCase(cluster.recurrence)}
                  </p>
                </div>
                <div className="numeric grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-4">
                  <Metric label="Requests" value={formatCount(cluster.request_count)} />
                  <Metric label="People" value={formatCount(cluster.affected_population)} />
                  <Metric label="Severity" value={Number(cluster.severity_avg).toFixed(1)} />
                  <Metric label="Priority" value={String(Number(cluster.priority_score))} />
                </div>
              </button>

              {open && (
                <div className="grid gap-6 border-t border-border/60 px-6 py-5 md:grid-cols-2">
                  <div>
                    <p className="label-eyebrow">Sample requests in this cluster</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {members.length} individual report{members.length === 1 ? "" : "s"} stored of{" "}
                      {formatCount(cluster.request_count)} aggregated · {cluster.count_source}
                    </p>
                    <p className="mt-1 numeric text-xs text-muted-foreground">
                      {`0.45 × ${Number(cluster.demand_score)} + 0.45 × ${Number(cluster.gap_score)} + 0.10 × ${Math.round((Number(cluster.severity_avg) / 5) * 100)} = ${Number(cluster.priority_score)}`}
                    </p>
                    <ul className="mt-3 space-y-3">
                      {members.length ? (
                        members.map((request) => (
                          <li key={request.id} className="rounded-lg border border-border bg-muted/20 p-3">
                            <p className="text-sm">{request.raw_text}</p>
                            <p className="mt-1.5 text-xs text-muted-foreground">
                              {request.language?.toUpperCase()} · severity {request.severity} ·{" "}
                              {titleCase(request.problem_type)}
                            </p>
                          </li>
                        ))
                      ) : (
                        <li className="text-sm text-muted-foreground">
                          Sample requests for this cluster are aggregated only.
                        </li>
                      )}
                    </ul>
                    <p className="mt-3 text-xs text-muted-foreground">
                      Languages in cluster: {cluster.languages.map((l) => l.toUpperCase()).join(" / ")} · first
                      seen {cluster.first_seen} · last seen {cluster.last_seen}
                    </p>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <p className="label-eyebrow">Existing investment nearby</p>
                      <ul className="mt-3 space-y-2">
                        {overlapping.length ? (
                          overlapping.map((project) => (
                            <li key={project.id} className="rounded-lg border border-border bg-muted/20 p-3">
                              <p className="text-sm font-medium">{project.name}</p>
                              <p className="numeric mt-1 text-xs text-muted-foreground">
                                {titleCase(project.status)} · {formatInr(project.budget_inr)} ·{" "}
                                {project.scheme}
                              </p>
                              <p className="mt-1 text-xs text-accent">{project.coverage_note}</p>
                            </li>
                          ))
                        ) : (
                          <li className="text-sm text-muted-foreground">
                            No sanctioned project found within this cluster.
                          </li>
                        )}
                      </ul>
                    </div>

                    <div>
                      <p className="label-eyebrow">Infrastructure on record</p>
                      <ul className="mt-3 space-y-2">
                        {nearbyAssets.map((asset) => (
                          <li key={asset.id} className="flex items-start justify-between gap-3 text-sm">
                            <span>
                              {asset.name}
                              <span className="block text-xs text-muted-foreground">{asset.notes}</span>
                            </span>
                            <span
                              className={cn(
                                "numeric shrink-0 rounded-full px-2 py-0.5 text-xs",
                                asset.condition === "poor"
                                  ? "bg-destructive/20 text-destructive"
                                  : "bg-secondary text-muted-foreground",
                              )}
                            >
                              {asset.condition}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <span className="block">
      <span className="label-eyebrow block">{label}</span>
      <span className="text-base font-semibold">{value}</span>
    </span>
  );
}
