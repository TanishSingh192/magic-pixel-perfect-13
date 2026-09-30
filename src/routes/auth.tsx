import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";

import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { safeNext } from "@/lib/safe-next";

const NEXT_KEY = "jannexus:auth-next";

export const Route = createFileRoute("/auth")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    next: typeof s.next === "string" ? s.next : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Planner sign-in — JanNexus" },
      { name: "description", content: "Sign in to the JanNexus planner console to review citizen reports and recommendations." },
      { property: "og:title", content: "Planner sign-in — JanNexus" },
      { property: "og:description", content: "Secure access to the JanNexus planner console." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { next } = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const target = () => safeNext(next ?? sessionStorage.getItem(NEXT_KEY));

  const go = () => {
    const dest = target();
    sessionStorage.removeItem(NEXT_KEY);
    // Full navigation so paths outside the router (e.g. consent) load correctly.
    window.location.assign(dest);
  };

  useEffect(() => {
    if (next) sessionStorage.setItem(NEXT_KEY, safeNext(next));
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) go();
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) go();
    });
    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth?next=${encodeURIComponent(target())}` },
      });
      if (error) setError(error.message);
      else setNotice("Check your email to confirm your account, then sign in.");
    }
    setBusy(false);
  }

  async function onGoogle() {
    setError(null);
    sessionStorage.setItem(NEXT_KEY, target());
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/auth`,
    });
    if (result.error) setError(result.error.message ?? "Google sign-in failed");
  }

  return (
    <div className="mx-auto flex max-w-md flex-col px-6 py-16">
      <p className="label-eyebrow">Planner access</p>
      <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">
        {mode === "signin" ? "Sign in to the console" : "Create a planner account"}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Citizen reports are private. Sign in to review them and make recommendation decisions. Citizens can still{" "}
        <button type="button" className="text-primary underline" onClick={() => navigate({ to: "/report" })}>
          report an issue
        </button>{" "}
        without an account.
      </p>

      <div className="surface-panel mt-8 rounded-lg p-6">
        <button
          type="button"
          onClick={onGoogle}
          className="w-full rounded-md border border-border bg-secondary px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary/80"
        >
          Continue with Google
        </button>
        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
        </div>
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <label className="text-sm">
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm">
            Password
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </label>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          {notice && <p className="text-sm text-accent">{notice}</p>}
          <button
            type="submit"
            disabled={busy}
            className="mt-1 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>
        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-foreground"
        >
          {mode === "signin" ? "New planner? Create an account" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
