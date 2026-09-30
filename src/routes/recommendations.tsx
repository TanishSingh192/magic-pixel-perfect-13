import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, Check, HelpCircle, PencilLine, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { setRecommendationDecision, type Recommendation } from "@/lib/jannexus.functions";
import {
  formatCount,
  formatInr,
  signalDot,
  signalLevel,
  statusLabel,
  titleCase,
} from "@/lib/jannexus-format";
import { platformQuery } from "@/lib/platform-query";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/recommendations")({
  head: () => ({
    meta: [
      { title: "Recommendations — JanNexus" },
      {
        name: "description",
        content:
          "Evidence-backed intervention recommendations with why this, why not the alternatives, expected impact and an officer decision trail.",
      },
      { property: "og:title", content: "Recommendations — JanNexus" },
      {
        property: "og:description",
        content: "Every recommendation shows its evidence, its alternatives and who decided.",
      },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(platformQuery),
  component: Recommendations,
});

type EvidenceItem = { source: string; detail: string };
type ExpectedImpact = {
  metric?: string;
  value?: string;
  population_served?: number;
  cost_per_person_inr?: number;
};

const decisions = [
  { status: "accepted", label: "Accept", icon: Check },
  { status: "modified", label: "Accept with changes", icon: PencilLine },
  { status: "investigating", label: "Need more evidence", icon: HelpCircle },
  { status: "rejected", label: "Reject", icon: X },
] as const;

function Recommendations() {
  const { data } = useSuspenseQuery(platformQuery);
  const queryClient = useQueryClient();
  const decide = useServerFn(setRecommendationDecision);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: string; note: string | null }) =>
      decide({ data: { id, status, note } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: platformQuery.queryKey });
      toast.success("Decision recorded");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <p className="label-eyebrow">Human-in-the-loop decisions</p>
      <h1 className="mt-2 text-3xl font-semibold">Recommendations</h1>
      <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
        JanNexus proposes, an officer decides. Nothing here is a sanction — each card states its evidence, the
        alternatives considered and the impact it expects.
      </p>

      <div className="mt-8 space-y-6">
        {data.recommendations.map((rec) => (
          <Card
            key={rec.id}
            rec={rec}
            note={notes[rec.id] ?? ""}
            onNote={(value) => setNotes((prev) => ({ ...prev, [rec.id]: value }))}
            pending={mutation.isPending}
            onDecide={(status) => mutation.mutate({ id: rec.id, status, note: notes[rec.id]?.trim() || null })}
          />
        ))}
      </div>
    </div>
  );
}

function Card({
  rec,
  note,
  onNote,
  onDecide,
  pending,
}: {
  rec: Recommendation;
  note: string;
  onNote: (value: string) => void;
  onDecide: (status: string) => void;
  pending: boolean;
}) {
  const evidence = (rec.evidence as EvidenceItem[] | null) ?? [];
  const whyThis = (rec.why_this as string[] | null) ?? [];
  const whyNot = (rec.why_not as string[] | null) ?? [];
  const impact = (rec.expected_impact as ExpectedImpact | null) ?? {};
  const level = signalLevel(Number(rec.priority_score));

  return (
    <section className="surface-panel p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <div className="flex flex-wrap items-center gap-3">
            <span className={cn("size-2.5 rounded-full", signalDot[level])} />
            <span className="numeric text-xs text-muted-foreground">
              {rec.id} · {titleCase(rec.category)} · priority {Number(rec.priority_score)}
            </span>
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-xs",
                rec.status === "pending" ? "bg-secondary text-muted-foreground" : "bg-primary/20 text-foreground",
              )}
            >
              {statusLabel[rec.status] ?? titleCase(rec.status)}
            </span>
            {rec.overlap_flag && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-signal-emerging/20 px-2.5 py-0.5 text-xs text-signal-emerging">
                <AlertTriangle className="size-3" />
                Overlaps existing spend
              </span>
            )}
          </div>
          <h2 className="mt-3 text-lg font-semibold">{rec.title}</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {rec.intervention} · {rec.village}, {rec.district}
          </p>
        </div>
        <div className="numeric text-right">
          <p className="text-xl font-semibold">{formatInr(rec.estimated_cost_inr)}</p>
          <p className="text-xs text-muted-foreground">
            {formatCount(rec.affected_population)} people ·{" "}
            {impact.cost_per_person_inr ? `₹${formatCount(impact.cost_per_person_inr)}/person` : "—"}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <div className="rounded-lg border border-evidence/40 bg-evidence/10 p-4">
          <p className="label-eyebrow">Evidence trail</p>
          <ul className="mt-3 space-y-2 text-sm">
            {evidence.map((item) => (
              <li key={item.source + item.detail}>
                <span className="text-foreground">{item.source}:</span>{" "}
                <span className="text-muted-foreground">{item.detail}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-4">
          <div>
            <p className="label-eyebrow">Why this</p>
            <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
              {whyThis.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="label-eyebrow">Why not the alternatives</p>
            <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
              {whyNot.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-lg border border-border bg-muted/20 p-4">
        <p className="label-eyebrow">Expected impact</p>
        <p className="mt-2 text-sm">
          <span className="text-muted-foreground">{impact.metric ?? "Impact"}:</span>{" "}
          <span className="numeric">{impact.value ?? "—"}</span>
          {impact.population_served ? (
            <span className="text-muted-foreground">
              {" "}
              · {formatCount(impact.population_served)} people served
            </span>
          ) : null}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Model confidence {Math.round(Number(rec.confidence) * 100)}%. Verify on the ground before sanction.
        </p>
      </div>

      {rec.decision_note && (
        <p className="mt-4 rounded-lg border border-primary/40 bg-primary/10 p-3 text-sm">
          Officer note: {rec.decision_note}
        </p>
      )}

      <div className="mt-5 space-y-3">
        <input
          value={note}
          onChange={(event) => onNote(event.target.value)}
          placeholder="Add a decision note (optional)"
          className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-ring"
        />
        <div className="flex flex-wrap gap-2">
          {decisions.map((decision) => (
            <button
              key={decision.status}
              type="button"
              disabled={pending}
              onClick={() => onDecide(decision.status)}
              className={cn(
                "inline-flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-60",
                decision.status === "accepted"
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : decision.status === "rejected"
                    ? "border border-destructive/60 text-destructive hover:bg-destructive/10"
                    : "border border-border hover:bg-secondary",
              )}
            >
              <decision.icon className="size-4" />
              {decision.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
