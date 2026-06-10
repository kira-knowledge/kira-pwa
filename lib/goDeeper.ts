import type { Plan } from "./auth";

export type GoDeeperButton = { label: string; action: "deepen" | "upgrade" };

// Pure: what the Go Deeper button says/does for a plan (Figma: free sees the PRO upsell).
export function goDeeperButton(plan: Plan): GoDeeperButton {
  return plan === "pro"
    ? { label: "Go Deeper", action: "deepen" }
    : { label: "Go Deeper • Get it with PRO", action: "upgrade" };
}
