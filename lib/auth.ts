export type Plan = "free" | "pro";

// Pure: normalize a profile row's plan to the known union, defaulting to free.
export function planFromProfile(
  profile: { plan?: unknown } | null | undefined
): Plan {
  return profile?.plan === "pro" ? "pro" : "free";
}
