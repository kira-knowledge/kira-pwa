export type Citation = {
  n: number;
  title: string;
  author: string;
  thumbnail: string;
  source_url: string;
};

export type ChatRecord = {
  id: string;
  question: string;
  answer: string;
  citations: Citation[];
  suggested: string[];
  grounded_by: string;
  ts: number;
  theme?: string;
};

const KEY = "kira.chat.history";
const MAX = 10;

// Pure: newest first, capped at MAX, never mutates the input.
export function capHistory(history: ChatRecord[], record: ChatRecord): ChatRecord[] {
  return [record, ...history].slice(0, MAX);
}

export function loadHistory(): ChatRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function appendHistory(record: ChatRecord): ChatRecord[] {
  const next = capHistory(loadHistory(), record);
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* ignore quota / availability errors */
    }
  }
  return next;
}
