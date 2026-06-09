export type EditState = {
  summary: string;
  key_insights: string[];
  tags: string[];
};

export function setSummary(s: EditState, summary: string): EditState {
  return { ...s, summary };
}

export function setInsight(s: EditState, index: number, value: string): EditState {
  return { ...s, key_insights: s.key_insights.map((x, i) => (i === index ? value : x)) };
}

export function addInsight(s: EditState): EditState {
  return { ...s, key_insights: [...s.key_insights, ""] };
}

export function removeInsight(s: EditState, index: number): EditState {
  return { ...s, key_insights: s.key_insights.filter((_, i) => i !== index) };
}

export function addTag(s: EditState, tag: string): EditState {
  const t = tag.trim();
  if (!t || s.tags.includes(t)) return s;
  return { ...s, tags: [...s.tags, t] };
}

export function removeTag(s: EditState, tag: string): EditState {
  return { ...s, tags: s.tags.filter((x) => x !== tag) };
}

// Shape sent to PATCH: trimmed summary, blank insights dropped, tags as-is.
export function toPatch(s: EditState): EditState {
  return {
    summary: s.summary.trim(),
    key_insights: s.key_insights.map((x) => x.trim()).filter(Boolean),
    tags: s.tags,
  };
}
