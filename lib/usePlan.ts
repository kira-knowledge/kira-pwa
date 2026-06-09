"use client";
import { useEffect, useState } from "react";
import { createClient } from "./supabase/client";
import { planFromProfile, type Plan } from "./auth";

// Display-only plan reader for the header badge. Gating stays server-side
// (middleware + API 401), so reading the plan client-side is safe.
export function usePlan(): { plan: Plan; signedIn: boolean; loading: boolean } {
  const [plan, setPlan] = useState<Plan>("free");
  const [signedIn, setSignedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!active) return;
        if (!user) {
          setSignedIn(false);
          setPlan("free");
          return;
        }
        setSignedIn(true);
        const { data: profile } = await supabase
          .from("profiles")
          .select("plan")
          .eq("id", user.id)
          .single();
        if (!active) return;
        setPlan(planFromProfile(profile));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return { plan, signedIn, loading };
}
