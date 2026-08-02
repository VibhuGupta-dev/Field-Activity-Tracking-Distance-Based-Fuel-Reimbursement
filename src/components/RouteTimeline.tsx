"use client";

export interface RoutePointView {
  key: string;
  label: string;
  time: string;
  kind: "start" | "activity" | "end";
}

interface RouteTimelineProps {
  points: RoutePointView[];
  distanceKm: number | null;
  isEstimate?: boolean;
}

export function RouteTimeline({ points, distanceKm, isEstimate = true }: RouteTimelineProps) {
  if (points.length === 0) return null;

  return (
    <div>
      {distanceKm !== null && (
        <div className="mb-5 flex items-baseline gap-2">
          <span className="font-[family-name:var(--font-mono)] text-[30px] font-medium leading-none tracking-tight">
            {distanceKm.toFixed(1)}
          </span>
          <span className="text-[13px] text-[var(--color-text-muted)]">
            km travelled{isEstimate ? " · straight-line estimate" : ""}
          </span>
        </div>
      )}

      <div className="flex items-start overflow-x-auto pb-1">
        {points.map((point, i) => (
          <div key={point.key} className="flex shrink-0 items-start">
            <div className="flex flex-col items-center" style={{ minWidth: 88 }}>
              <Waypoint kind={point.kind} isLatest={i === points.length - 1} />
              <span className="mt-2 max-w-[84px] truncate text-center text-[11.5px] font-medium text-[var(--color-text)]">
                {point.label}
              </span>
              <span className="font-[family-name:var(--font-mono)] text-[10.5px] text-[var(--color-text-muted)]">
                {point.time}
              </span>
            </div>
            {i < points.length - 1 && (
              <div className="mt-[9px] h-[2px] w-10 shrink-0 bg-[var(--color-border)] sm:w-16" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Waypoint({
  kind,
  isLatest,
}: {
  kind: "start" | "activity" | "end";
  isLatest: boolean;
}) {
  if (kind === "start") {
    return (
      <div className="h-5 w-5 rounded-full border-2 border-[var(--color-accent)] bg-[var(--color-accent)]" />
    );
  }
  if (kind === "end") {
    return (
      <div className="h-5 w-5 rounded-full border-2 border-[var(--color-success)] bg-[var(--color-success)]" />
    );
  }
  return (
    <div className="relative h-5 w-5 rounded-full border-2 border-[var(--color-accent)] bg-[var(--color-bg)]">
      {isLatest && (
        <span className="absolute inset-0 animate-ping rounded-full bg-[var(--color-accent)] opacity-40" />
      )}
    </div>
  );
}
