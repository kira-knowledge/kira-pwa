// Fail-fast guard for server-only configuration. Routes call this at request
// time (not module load) so a missing var produces a clear 500, not a crash
// at build time.
export function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} not configured`);
  }
  return value;
}
