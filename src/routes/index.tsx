import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Languages, MapPinned, ScanSearch, ShieldCheck, Sparkles } from "lucide-react";

import heroImage from "@/assets/hero-district.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "JanNexus — citizen voices to evidence-backed investment decisions" },
      {
        name: "description",
        content:
          "JanNexus converts multilingual citizen requests into structured, geographically grounded infrastructure needs, then shows planners the evidence, the gap and the budget trade-off.",
      },
      { property: "og:title", content: "JanNexus — decision support for public investment" },
      {
        property: "og:description",
        content: "Need → Evidence → Gap → Intervention → Budget-aware portfolio → Impact tracking.",
      },
    ],
  }),
  component: Landing,
});

const pipeline = [
  { step: "Citizen signal", detail: "Voice, text or photo in Hindi, Marathi or English" },
  { step: "AI understanding", detail: "Structured civic need, stated facts kept apart from inferences" },
  { step: "Clustering", detail: "Semantically similar requests grouped by geography" },
  { step: "Gap analysis", detail: "Demand weighed against infrastructure and existing projects" },
  { step: "Recommendation", detail: "Intervention with an evidence trail and a cost estimate" },
  { step: "Portfolio & impact", detail: "Budget scenarios, then tracked outcomes" },
];

const capabilities = [
  {
    icon: Languages,
    title: "Multilingual, multimodal intake",
    body: "A farmer can send a voice note in Marathi with a photo of a flooded road. No department names, no scheme codes, no forms.",
  },
  {
    icon: ScanSearch,
    title: "Every recommendation carries evidence",
    body: "Citizen demand, recurrence, infrastructure condition, geography and existing spend — each shown as a traceable line item.",
  },
  {
    icon: MapPinned,
    title: "Geographic demand hotspots",
    body: "Hundreds of differently worded requests collapse into one development cluster with a radius, a population and a priority score.",
  },
  {
    icon: ShieldCheck,
    title: "Human-in-the-loop by design",
    body: "Officers accept, modify, reject or ask for more evidence. JanNexus never approves spending on its own.",
  },
];

function Landing() {
  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="hero-glow absolute inset-0" aria-hidden />
        <div className="grid-backdrop absolute inset-0 opacity-40" aria-hidden />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:py-28">
          <div>
            <p className="label-eyebrow">AI for digital public infrastructure &amp; governance</p>
            <h1 className="mt-5 text-4xl font-bold leading-[1.05] sm:text-5xl lg:text-6xl">
              Turning citizen voices into evidence-backed public investment decisions.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              JanNexus is the intelligence layer between what people report and where money goes. It reads
              requests in any language, finds where demand is high and coverage is low, and hands planners a
              recommendation they can interrogate.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/report"
                className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Report a problem
                <ArrowRight className="size-4" />
              </Link>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-5 py-3 text-sm font-semibold transition-colors hover:bg-secondary"
              >
                Open the planner console
              </Link>
            </div>
            <p className="numeric mt-8 text-xs text-muted-foreground">
              Need → Evidence → Gap → Intervention → Budget-aware portfolio → Impact
            </p>
          </div>

          <div className="surface-panel overflow-hidden">
            <img
              src={heroImage}
              alt="Aerial view of a district with a flooded village access road and demand hotspots marked"
              width={1600}
              height={1008}
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="label-eyebrow">The core journey</p>
            <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">
              One statement becomes a decision-ready case
            </h2>
          </div>
          <p className="max-w-md text-sm text-muted-foreground">
            “The road to our school gets flooded every monsoon” is useful. JanNexus makes it answerable.
          </p>
        </div>

        <ol className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {pipeline.map((item, index) => (
            <li key={item.step} className="surface-panel p-5">
              <div className="flex items-center gap-3">
                <span className="numeric grid size-7 place-items-center rounded-md bg-secondary text-xs text-muted-foreground">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="text-base font-semibold">{item.step}</h3>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{item.detail}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-y border-border/60 bg-card/40">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="grid gap-6 md:grid-cols-2">
            {capabilities.map((cap) => (
              <div key={cap.title} className="flex gap-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-secondary text-accent">
                  <cap.icon className="size-5" />
                </span>
                <div>
                  <h3 className="text-base font-semibold">{cap.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{cap.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="surface-panel flex flex-wrap items-center justify-between gap-6 p-8">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs text-accent">
              <Sparkles className="size-3.5" />
              Demo dataset: Pune district
            </span>
            <h2 className="mt-4 text-2xl font-semibold">See the decision console</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Six live demand clusters, seven government projects, and the recommendations that follow — with
              “why this?” and “why not here?” for each one.
            </p>
          </div>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Open console
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
