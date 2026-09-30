import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { formatCount, formatInr, signalDot, signalLevel, titleCase } from "@/lib/jannexus-format";
import { platformQuery } from "@/lib/platform-query";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/budget")({
  head: () => ({
    meta: [
      { title: "Budget scenarios — JanNexus" },
      {
        name: "description",
        content:
          "Move the budget and see which recommendations fit, how many people are covered, and what stays unfunded this cycle.",
      },
      { property: "og:title", content: "Budget scenarios — JanNexus" },
      {
        property: "og:description",
        content: "A budget-aware portfolio, not a wish list: see the trade-off before sanctioning.",
      },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(platformQuery),
  component: Budget,
});

function Budget() {
  const { data } = useSuspenseQuery(platformQuery);
  const [crore, setCrore] = useState(12);
  const [mode, setMode] = useState<"priority" | "reach">("priority");

  const total = data.recommendations.reduce((sum, rec) => sum + rec.estimated_cost_inr, 0);
  const budget = crore * 10000000;

  const { funded, deferred, covered, spend } = useMemo(() => {
    const ranked = [...data.recommendations].sort((a, b) => {
      if (mode === "priority") return Number(b.priority_score) - Number(a.priority_score);
      const reachA = a.affected_population / Math.max(a.estimated_cost_inr, 1);
      const reachB = b.affected_population / Math.max(b.estimated_cost_inr, 1);
      return reachB - reachA;
    });

    const selected: typeof ranked = [];
    const rest: typeof ranked = [];
    let spent = 0;
    for (const rec of ranked) {
      if (spent + rec.estimated_cost_inr <= budget) {
        selected.push(rec);
        spent += rec.estimated_cost_inr;
      } else {
        rest.push(rec);
      }
    }
    return {
      funded: selected,
      deferred: rest,
      spend: spent,
      covered: selected.reduce((sum, rec) => sum + rec.affected_population, 0),
    };
  }, [budget, data.recommendations, mode]);

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <p className="label-eyebrow">Budget-aware portfolio</p>
      <h1 className="mt-2 text-3xl font-semibold">What fits this cycle</h1>
      <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
        The full recommendation set costs {formatInr(total)}. Set an allocation and JanNexus shows which
        interventions fit, and states plainly what is left out.
      </p>

      <div className="surface-panel mt-8 p-6">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="min-w-[280px] flex-1">
            <label htmlFor="budget" className="label-eyebrow">
              Allocation
            </label>
            <p className="numeric mt-2 text-3xl font-semibold">₹{crore.toFixed(1)} cr</p>
            <input
              id="budget"
              type="range"
              min={1}
              max={Math.ceil(total / 10000000)}
              step={0.5}
              value={crore}
              onChange={(event) => setCrore(Number(event.target.value))}
              className="mt-4 w-full accent-primary"
            />
            <p className="numeric mt-1 flex justify-between text-xs text-muted-foreground">
              <span>₹1 cr</span>
              <span>₹{Math.ceil(total / 10000000)} cr (full set)</span>
            </p>
          </div>

          <div>
            <p className="label-eyebrow">Selection rule</p>
            <div className="mt-2 flex gap-2">
              {(
                [
                  ["priority", "Highest priority first"],
                  ["reach", "Most people per rupee"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setMode(key)}
                  className={cn(
                    "rounded-full border px-3.5 py-2 text-xs transition-colors",
                    mode === key
                      ? "border-primary bg-primary/15 text-foreground"
                      : "border-border text-muted-foreground hover:bg-secondary",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="numeric mt-6 grid gap-3 sm:grid-cols-4">
          {[
            ["Funded", `${funded.length} of ${data.recommendations.length}`],
            ["Committed", formatInr(spend)],
            ["Unallocated", formatInr(Math.max(budget - spend, 0))],
            ["People covered", formatCount(covered)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-border bg-muted/20 p-4">
              <p className="label-eyebrow">{label}</p>
              <p className="mt-1.5 text-lg font-semibold">{value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <Column title="Funded in this scenario" items={funded} tone="funded" />
        <Column title="Deferred — stated openly" items={deferred} tone="deferred" />
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        This is a planning simulation only. JanNexus does not sanction or release funds; every line still needs
        an officer decision and the normal approval process.
      </p>
    </div>
  );
}

function Column({
  title,
  items,
  tone,
}: {
  title: string;
  items: { id: string; title: string; village: string | null; estimated_cost_inr: number; affected_population: number; priority_score: number; category: string }[];
  tone: "funded" | "deferred";
}) {
  return (
    <div className="surface-panel p-5">
      <p className="label-eyebrow">{title}</p>
      <ul className="mt-4 space-y-3">
        {items.length ? (
          items.map((item) => {
            const level = signalLevel(Number(item.priority_score));
            return (
              <li
                key={item.id}
                className={cn(
                  "rounded-lg border p-4",
                  tone === "funded" ? "border-primary/40 bg-primary/5" : "border-border bg-muted/20",
                )}
              >
                <div className="flex items-center gap-2">
                  <span className={cn("size-2 rounded-full", signalDot[level])} />
                  <span className="numeric text-xs text-muted-foreground">
                    {item.id} · {titleCase(item.category)} · priority {Number(item.priority_score)}
                  </span>
                </div>
                <p className="mt-2 text-sm font-medium">{item.title}</p>
                <p className="numeric mt-1.5 text-xs text-muted-foreground">
                  {item.village} · {formatInr(item.estimated_cost_inr)} ·{" "}
                  {formatCount(item.affected_population)} people
                </p>
              </li>
            );
          })
        ) : (
          <li className="text-sm text-muted-foreground">Nothing in this column at the current allocation.</li>
        )}
      </ul>
    </div>
  );
}
