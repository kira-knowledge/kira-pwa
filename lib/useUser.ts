"use client";
import { useEffect, useState } from "react";
import { createClient } from "./supabase/client";

export type UserInfo = {
  email: string | undefined;
  fullName: string | undefined;
  loading: boolean;
};

// Display-only user reader (greeting + profile page). Gating stays server-side.
export function useUser(): UserInfo {
  const [info, setInfo] = useState<UserInfo>({
    email: undefined,
    fullName: undefined,
    loading: true,
  });

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const {
          data: { user },
        } = await createClient().auth.getUser();
        if (!active) return;
        setInfo({
          email: user?.email,
          fullName:
            (user?.user_metadata?.full_name as string | undefined) ??
            (user?.user_metadata?.name as string | undefined),
          loading: false,
        });
      } catch {
        if (active) setInfo({ email: undefined, fullName: undefined, loading: false });
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return info;
}
