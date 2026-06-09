function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export function savedLabel(input: string | number): string {
  const saved = new Date(input);
  if (isNaN(saved.getTime())) return "";
  const days = Math.round((startOfDay(new Date()) - startOfDay(saved)) / 86400000);
  if (days <= 0) return "Saved today";
  if (days === 1) return "Saved yesterday";
  return `Saved ${saved.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })}`;
}
