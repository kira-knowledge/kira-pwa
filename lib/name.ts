// Pure: best-effort first name from Supabase user metadata / email.
export function firstNameFrom(
  fullName: string | undefined,
  email: string | undefined
): string | null {
  const fromName = fullName?.trim().split(/\s+/)[0];
  if (fromName) return fromName;
  const local = email?.split("@")[0];
  if (!local) return null;
  return local.charAt(0).toUpperCase() + local.slice(1);
}
