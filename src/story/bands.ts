export const BANDS = ["poor", "fair", "good"] as const;
export type Band = (typeof BANDS)[number];

export function isBand(value: unknown): value is Band {
  return typeof value === "string" && (BANDS as readonly string[]).includes(value);
}
