import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { formatCount, formatInr, statusLabel, titleCase } from "@/lib/jannexus-format";
import { platformQuery } from "@/lib/platform-query";

export const Route = createFileRoute("/impact")({
  head: () => ({
    meta: [
      { title: "Impact tracking — JanNexus" },
      {
        name: "description",
        content:
          "Baseline, current and target values for every accepted intervention, so the loop closes between citizen signal and measured outcome.",
      },
      { property: "og:title", content: "Impact tracking — JanNexus" },
      {
        property: "og:description",
        content: "Did the intervention work? Baseline, current and target for each accepted recommendation.",
      },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(platformQuery),
  component: Impact,
});

function Impact() {
  const { data } = useSuspenseQuery(platformQuery);

  const grouped = data.recommendations
    .map((rec) => ({
      rec,
      metrics: data.metrics.filter((metric) => metric.recommendation_id === rec.id),
    }))
    .filter((entry) => entry.metrics.length > 0);

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <p className="label-eyebrow">Closing the loop</p>
      <h1 className="mt-2 text-3xl font-semibold">Impact tracking</h1>
      <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
        A recommendation is only as good as what changed afterwards. Each metric below carries its baseline, its
        latest reading and the target used to justify the spend.
      </p>

      <div className="mt-8 space-y-6">
        {grouped.map(({ rec, metrics }) => (
          <section key={rec.id} className="surface-panel p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-2xl">
                <span className="numeric text-xs text-muted-foreground">
                  {rec.id} · {titleCase(rec.category)} · {statusLabel[rec.status] ?? titleCase(rec.status)}
                </span>
                <h2 className="mt-2 text-lg font-semibold">{rec.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {rec.village}, {rec.district}
                </p>
              </div>
              <p className="numeric text-right text-sm text-muted-foreground">
                {formatInr(rec.estimated_cost_inr)}
                <span className="block">{formatCount(rec.affected_population)} people</span>
              </p>
            </div>

            <div className="mt-5 space-y-5">
              {metrics.map((metric) => {
                const span = Math.abs(metric.target - metric.baseline) || 1;
                const done = Math.abs(metric.current - metric.baseline) / span;
                const progress = Math.max(0, Math.min(1, done));
                return (
                  <div key={metric.id}>
                    <div className="flex flex-wrap items-baseline justify-between gap-3">
                      <p className="text-sm font-medium">{metric.metric}</p>
                      <p className="numeric text-xs text-muted-foreground">
                        baseline {metric.baseline} → now {metric.current} → target {metric.target}{" "}
                        {metric.unit}
                      </p>
                    </div>
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full bg-accent transition-all"
                        style={{ width: `${Math.round(progress * 100)}%` }}
                      />
                    </div>
                    <p className="numeric mt-1 text-xs text-muted-foreground">
                      {Math.round(progress * 100)}% of the way to target
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <p className="mt-8 text-xs text-muted-foreground">
        Demo readings for the Pune district dataset. In deployment these come from departmental reporting and
        follow-up citizen signals from the same clusters.
      </p>
    </div>
  );
}
