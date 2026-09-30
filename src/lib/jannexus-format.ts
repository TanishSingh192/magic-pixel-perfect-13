export function formatInr(value: number) {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)} lakh`;
  return `₹${value.toLocaleString("en-IN")}`;
}

export function formatCount(value: number) {
  return value.toLocaleString("en-IN");
}

export type SignalLevel = "low" | "emerging" | "significant" | "critical";

export function signalLevel(score: number): SignalLevel {
  if (score >= 85) return "critical";
  if (score >= 70) return "significant";
  if (score >= 55) return "emerging";
  return "low";
}

export const signalLabel: Record<SignalLevel, string> = {
  low: "Low demand",
  emerging: "Emerging demand",
  significant: "Significant demand",
  critical: "High-priority cluster",
};

export const signalDot: Record<SignalLevel, string> = {
  low: "bg-signal-low",
  emerging: "bg-signal-emerging",
  significant: "bg-signal-significant",
  critical: "bg-signal-critical",
};

export const signalText: Record<SignalLevel, string> = {
  low: "text-signal-low",
  emerging: "text-signal-emerging",
  significant: "text-signal-significant",
  critical: "text-signal-critical",
};

export const signalHex: Record<SignalLevel, string> = {
  low: "#3ec98a",
  emerging: "#f0c04a",
  significant: "#f59b3d",
  critical: "#e2564a",
};

export const statusLabel: Record<string, string> = {
  pending: "Awaiting decision",
  accepted: "Accepted",
  modified: "Accepted with changes",
  rejected: "Rejected",
  investigating: "More evidence requested",
};

export function titleCase(value: string | null | undefined) {
  if (!value) return "—";
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
