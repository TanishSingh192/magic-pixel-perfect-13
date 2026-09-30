import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { formatCount, formatInr, statusLabel, titleCase } from "@/lib/jannexus-format";
import { platformQuery } from "@/lib/platform-query";

export const Route = createFileRoute("/_authenticated/impact")({
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

type Metric = (typeof import("@/lib/jannexus.functions"))["getPlatformData"] extends never
  ? never
  : { id: string; metric: string; unit: string; baseline: number; current: number; target: number };

const LIVE_STATUSES = ["accepted", "modified"];

function Impact() {
  const { data } = useSuspenseQuery(platformQuery);

  const recs = data.recommendations
    .map((rec) => ({
      rec,
      live: LIVE_STATUSES.includes(rec.status),
      metrics: data.metrics.filter((metric) => metric.recommendation_id === rec.id),
    }))
    .filter((entry) => entry.metrics.length > 0);
  const live = recs.filter((r) => r.live);
  const projected = recs.filter((r) => !r.live);

  const projects = data.projects
    .map((project) => ({ project, metrics: data.metrics.filter((m) => m.project_id === project.id) }))
    .filter((entry) => entry.metrics.length > 0);

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <p className="label-eyebrow">Closing the loop</p>
      <h1 className="mt-2 text-3xl font-semibold">Impact tracking</h1>
      <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
        Measured progress is shown only for existing projects and for recommendations an officer has accepted.
        Everything still awaiting a decision is shown as a projection, with no progress claimed.
      </p>

      <h2 className="mt-10 text-xl font-semibold">Existing projects — measured outcomes</h2>
      <div className="mt-4 space-y-6">
        {projects.map(({ project, metrics }) => (
          <section key={project.id} className="surface-panel p-6">
            <Header
              eyebrow={`${project.id} · ${project.scheme} · ${titleCase(project.status)}`}
              title={project.name}
              place={`${project.village}, ${project.district}`}
              cost={project.budget_inr}
            />
            <MetricList metrics={metrics} measured={project.status !== "planned"} />
          </section>
        ))}
      </div>

      <h2 className="mt-10 text-xl font-semibold">Accepted recommendations — measured outcomes</h2>
      {live.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          None yet. Once an officer accepts a recommendation, its readings are tracked here.
        </p>
      ) : (
        <div className="mt-4 space-y-6">
          {live.map(({ rec, metrics }) => (
            <section key={rec.id} className="surface-panel p-6">
              <Header
                eyebrow={`${rec.id} · ${titleCase(rec.category)} · ${statusLabel[rec.status] ?? titleCase(rec.status)}`}
                title={rec.title}
                place={`${rec.village}, ${rec.district}`}
                cost={rec.estimated_cost_inr}
                people={rec.affected_population}
              />
              <MetricList metrics={metrics} measured />
            </section>
          ))}
        </div>
      )}

      <h2 className="mt-10 text-xl font-semibold">Awaiting decision — projected impact</h2>
      <div className="mt-4 space-y-6">
        {projected.map(({ rec, metrics }) => (
          <section key={rec.id} className="surface-panel p-6">
            <Header
              eyebrow={`${rec.id} · ${titleCase(rec.category)} · ${statusLabel[rec.status] ?? titleCase(rec.status)} · Projected`}
              title={rec.title}
              place={`${rec.village}, ${rec.district}`}
              cost={rec.estimated_cost_inr}
              people={rec.affected_population}
            />
            <MetricList metrics={metrics} measured={false} />
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

function Header(props: { eyebrow: string; title: string; place: string; cost: number; people?: number }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="max-w-2xl">
        <span className="numeric text-xs text-muted-foreground">{props.eyebrow}</span>
        <h3 className="mt-2 text-lg font-semibold">{props.title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{props.place}</p>
      </div>
      <p className="numeric text-right text-sm text-muted-foreground">
        {formatInr(props.cost)}
        {props.people ? <span className="block">{formatCount(props.people)} people</span> : null}
      </p>
    </div>
  );
}

function MetricList({ metrics, measured }: { metrics: Metric[]; measured: boolean }) {
  return (
    <div className="mt-5 space-y-5">
      {metrics.map((metric) => {
        const span = Math.abs(metric.target - metric.baseline) || 1;
        const progress = Math.max(0, Math.min(1, Math.abs(metric.current - metric.baseline) / span));
        return (
          <div key={metric.id}>
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <p className="text-sm font-medium">{metric.metric}</p>
              <p className="numeric text-xs text-muted-foreground">
                {measured
                  ? `baseline ${metric.baseline} → now ${metric.current} → target ${metric.target} ${metric.unit}`
                  : `baseline ${metric.baseline} → projected ${metric.target} ${metric.unit}`}
              </p>
            </div>
            {measured ? (
              <>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-secondary">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${Math.round(progress * 100)}%` }} />
                </div>
                <p className="numeric mt-1 text-xs text-muted-foreground">
                  {Math.round(progress * 100)}% of the way to target
                </p>
              </>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground">Projection only — no work has started.</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
