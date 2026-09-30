import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { DemandMap, type MapPoint } from "@/components/demand-map";
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

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Planner console — JanNexus" },
      {
        name: "description",
        content:
          "District-level demand hotspots, infrastructure gaps, investment overlaps and live citizen signals in one decision console.",
      },
      { property: "og:title", content: "Planner console — JanNexus" },
      {
        property: "og:description",
        content: "Demand hotspots, gaps and overlaps across the district on one map.",
      },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(platformQuery),
  component: Dashboard,
});

type Layer = "clusters" | "projects" | "assets";

function Dashboard() {
  const { data } = useSuspenseQuery(platformQuery);
  const [layers, setLayers] = useState<Record<Layer, boolean>>({
    clusters: true,
    projects: true,
    assets: false,
  });
  const [selected, setSelected] = useState<string | null>(null);

  const points = useMemo<MapPoint[]>(() => {
    const result: MapPoint[] = [];
    if (layers.clusters) {
      data.clusters.forEach((cluster) =>
        result.push({
          id: cluster.id,
          title: cluster.title,
          subtitle: `${formatCount(cluster.request_count)} requests · ${cluster.village ?? cluster.district} · priority ${Number(cluster.priority_score)}`,
          lat: cluster.lat,
          lng: cluster.lng,
          score: Number(cluster.priority_score),
          kind: "cluster",
        }),
      );
    }
    if (layers.projects) {
      data.projects.forEach((project) =>
        result.push({
          id: project.id,
          title: project.name,
          subtitle: `${titleCase(project.status)} · ${formatInr(project.budget_inr)} · ${project.scheme ?? ""}`,
          lat: project.lat,
          lng: project.lng,
          score: 0,
          kind: "project",
        }),
      );
    }
    if (layers.assets) {
      data.assets.forEach((asset) =>
        result.push({
          id: asset.id,
          title: asset.name,
          subtitle: `${titleCase(asset.asset_type)} · condition ${asset.condition}`,
          lat: asset.lat,
          lng: asset.lng,
          score: 0,
          kind: "asset",
        }),
      );
    }
    return result;
  }, [data, layers]);

  const stats = [
    { label: "Citizen signals", value: formatCount(data.totals.signals) },
    { label: "Development clusters", value: formatCount(data.totals.clusters) },
    { label: "High-priority gaps", value: formatCount(data.totals.highPriorityGaps) },
    { label: "Potential overlaps", value: formatCount(data.totals.overlaps) },
    { label: "Projects tracked", value: formatCount(data.totals.trackedProjects) },
    { label: "People in scope", value: formatCount(data.totals.peopleCovered) },
  ];

  const selectedCluster = data.clusters.find((cluster) => cluster.id === selected);

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label-eyebrow">Pune district · decision console</p>
          <h1 className="mt-2 text-3xl font-semibold">Where demand is high and coverage is low</h1>
        </div>
        <Link
          to="/recommendations"
          className="rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Review recommendations
        </Link>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((stat) => (
          <div key={stat.label} className="surface-panel p-4">
            <p className="label-eyebrow">{stat.label}</p>
            <p className="numeric mt-2 text-2xl font-semibold">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="surface-panel overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-5 py-3">
            <p className="label-eyebrow">Map layers</p>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["clusters", "Citizen demand"],
                  ["projects", "Existing projects"],
                  ["assets", "Infrastructure"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setLayers((prev) => ({ ...prev, [key]: !prev[key] }))}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs transition-colors",
                    layers[key]
                      ? "border-primary bg-primary/15 text-foreground"
                      : "border-border text-muted-foreground hover:bg-secondary",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <DemandMap points={points} onSelect={setSelected} className="h-[440px] w-full" />
          <div className="flex flex-wrap items-center gap-4 border-t border-border/60 px-5 py-3 text-xs text-muted-foreground">
            {(["low", "emerging", "significant", "critical"] as const).map((level) => (
              <span key={level} className="inline-flex items-center gap-2">
                <span className={cn("size-2.5 rounded-full", signalDot[level])} />
                {signalLabel[level]}
              </span>
            ))}
          </div>
        </div>

        <div className="surface-panel p-5">
          <p className="label-eyebrow">Demand hotspots</p>
          <ul className="mt-4 space-y-3">
            {data.clusters.map((cluster) => {
              const level = signalLevel(Number(cluster.priority_score));
              return (
                <li key={cluster.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(cluster.id)}
                    className={cn(
                      "w-full rounded-lg border px-4 py-3 text-left transition-colors",
                      selected === cluster.id
                        ? "border-primary bg-primary/10"
                        : "border-border hover:bg-secondary/60",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">{cluster.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {cluster.village} · {cluster.taluka} · radius {Number(cluster.radius_km)} km
                        </p>
                      </div>
                      <span className={cn("mt-1 size-2.5 shrink-0 rounded-full", signalDot[level])} />
                    </div>
                    <div className="numeric mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>{formatCount(cluster.request_count)} requests</span>
                      <span>severity {Number(cluster.severity_avg).toFixed(1)}</span>
                      <span>gap {Number(cluster.gap_score)}</span>
                      <span>priority {Number(cluster.priority_score)}</span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {selectedCluster && (
        <div className="surface-panel mt-6 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="label-eyebrow">Cluster {selectedCluster.id}</p>
              <h2 className="mt-2 text-xl font-semibold">{selectedCluster.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {titleCase(selectedCluster.category)} · {titleCase(selectedCluster.problem_type)} ·{" "}
                {titleCase(selectedCluster.recurrence)} · languages{" "}
                {selectedCluster.languages.map((l) => l.toUpperCase()).join(" / ")}
              </p>
            </div>
            <Link
              to="/clusters"
              className="rounded-md border border-border px-4 py-2 text-sm transition-colors hover:bg-secondary"
            >
              See all clusters
            </Link>
          </div>
          <div className="numeric mt-5 grid gap-4 sm:grid-cols-4">
            {[
              ["Requests", formatCount(selectedCluster.request_count)],
              ["People affected", formatCount(selectedCluster.affected_population)],
              ["Demand score", String(Number(selectedCluster.demand_score))],
              ["Gap score", String(Number(selectedCluster.gap_score))],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-border bg-muted/20 p-4">
                <p className="label-eyebrow">{label}</p>
                <p className="mt-1.5 text-lg font-semibold">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="surface-panel mt-6 p-5">
        <p className="label-eyebrow">Latest citizen signals</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="pb-2 pr-4 font-medium">Reference</th>
                <th className="pb-2 pr-4 font-medium">What was reported</th>
                <th className="pb-2 pr-4 font-medium">Location</th>
                <th className="pb-2 pr-4 font-medium">Severity</th>
                <th className="pb-2 font-medium">Cluster</th>
              </tr>
            </thead>
            <tbody>
              {data.requests.slice(0, 12).map((request) => (
                <tr key={request.id} className="border-b border-border/50 last:border-0">
                  <td className="numeric py-2.5 pr-4 text-xs text-muted-foreground">{request.public_ref}</td>
                  <td className="max-w-sm py-2.5 pr-4">
                    <span className="block truncate">{request.stated_summary ?? request.raw_text}</span>
                    <span className="text-xs text-muted-foreground">
                      {request.language?.toUpperCase()} · {titleCase(request.problem_type)}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4 text-xs text-muted-foreground">
                    {request.village ?? "—"}
                    {request.taluka ? `, ${request.taluka}` : ""}
                  </td>
                  <td className="numeric py-2.5 pr-4">{request.severity ?? "—"}</td>
                  <td className="numeric py-2.5 text-xs">
                    {request.cluster_id ?? <span className="text-muted-foreground">unclustered</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
