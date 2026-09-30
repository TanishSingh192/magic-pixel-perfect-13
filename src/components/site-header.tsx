import { Link } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const links = [
  { to: "/dashboard", label: "Console" },
  { to: "/clusters", label: "Clusters" },
  { to: "/recommendations", label: "Recommendations" },
  { to: "/budget", label: "Budget" },
  { to: "/impact", label: "Impact" },
] as const;

function useSignedIn() {
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSignedIn(!!s));
    return () => data.subscription.unsubscribe();
  }, []);
  return signedIn;
}

async function signOut() {
  await supabase.auth.signOut();
  window.location.assign("/");
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const signedIn = useSignedIn();

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-lg">
      <div className="mx-auto flex max-w-7xl items-center gap-6 px-6 py-3.5">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
            JN
          </span>
          <span className="font-display text-base font-semibold tracking-tight">JanNexus</span>
        </Link>

        <nav className="ml-auto hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              activeProps={{ className: "bg-secondary text-foreground" }}
            >
              {link.label}
            </Link>
          ))}
          {signedIn ? (
            <button
              type="button"
              onClick={signOut}
              className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              Sign out
            </button>
          ) : (
            <Link
              to="/auth"
              search={{ next: undefined }}
              className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              Sign in
            </Link>
          )}
          <Link
            to="/report"
            className="ml-2 inline-flex items-center rounded-md bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Report an issue
          </Link>
        </nav>

        <button
          type="button"
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
          className="ml-auto inline-flex size-9 items-center justify-center rounded-md border border-border text-muted-foreground md:hidden"
        >
          <Menu className="size-4" />
        </button>
      </div>

      <div className={cn("border-t border-border/60 px-6 pb-4 pt-2 md:hidden", open ? "block" : "hidden")}>
        <div className="flex flex-col gap-1">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-2 text-sm text-muted-foreground"
              activeProps={{ className: "bg-secondary text-foreground" }}
            >
              {link.label}
            </Link>
          ))}
          {signedIn ? (
            <button type="button" onClick={signOut} className="rounded-md px-3 py-2 text-left text-sm text-muted-foreground">
              Sign out
            </button>
          ) : (
            <Link
              to="/auth"
              search={{ next: undefined }}
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-2 text-sm text-muted-foreground"
            >
              Sign in
            </Link>
          )}
          <Link
            to="/report"
            onClick={() => setOpen(false)}
            className="mt-1 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
          >
            Report an issue
          </Link>
        </div>
      </div>
    </header>
  );
}
