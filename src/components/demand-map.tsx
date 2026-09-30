import { ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

import type { MapPoint } from "./demand-map.client";

const DemandMapClient = lazy(() => import("./demand-map.client"));

function MapSkeleton({ className }: { className?: string | undefined }) {
  return (
    <div className={className}>
      <div className="grid h-full place-items-center rounded-xl border border-border bg-muted/30 text-sm text-muted-foreground">
        Loading map…
      </div>
    </div>
  );
}

export function DemandMap({
  points,
  onSelect,
  className,
}: {
  points: MapPoint[];
  onSelect?: ((id: string) => void) | undefined;
  className?: string | undefined;
}) {
  return (
    <ClientOnly fallback={<MapSkeleton className={className} />}>
      <Suspense fallback={<MapSkeleton className={className} />}>
        <DemandMapClient points={points} onSelect={onSelect} className={className} />
      </Suspense>
    </ClientOnly>
  );
}

export type { MapPoint };
