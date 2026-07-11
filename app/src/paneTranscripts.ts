export type PaneTranscript = {
  id: string;
  projectId: string;
  projectSessionId: string;
  paneLabel: string;
  profileLabel: string;
  savedAt: number;
  text: string;
};

const MAX_TRANSCRIPTS = 60;
const MAX_TRANSCRIPT_CHARS = 100_000;

export const buildPaneTranscript = (input: Omit<PaneTranscript, "text"> & { text: string }): PaneTranscript => ({
  ...input,
  text: input.text.length > MAX_TRANSCRIPT_CHARS ? input.text.slice(-MAX_TRANSCRIPT_CHARS) : input.text,
});

/* Newest first, oldest pruned past the cap. A transcript with no real output
   is dropped so exits that produced nothing don't clutter the review list. */
export const addPaneTranscript = (current: PaneTranscript[], transcript: PaneTranscript): PaneTranscript[] => {
  if (transcript.text.trim().length === 0) return current;
  return [transcript, ...current].slice(0, MAX_TRANSCRIPTS);
};

export const transcriptsForSession = (
  current: PaneTranscript[],
  projectId: string,
  projectSessionId: string,
): PaneTranscript[] =>
  current.filter((entry) => entry.projectId === projectId && entry.projectSessionId === projectSessionId);

export const normalizePaneTranscripts = (value: unknown): PaneTranscript[] => {
  if (!Array.isArray(value)) return [];
  const cleaned: PaneTranscript[] = [];
  for (const item of value) {
    if (typeof item !== "object" || item == null) continue;
    const t = item as Record<string, unknown>;
    if (
      typeof t.id === "string" &&
      typeof t.projectId === "string" &&
      typeof t.projectSessionId === "string" &&
      typeof t.paneLabel === "string" &&
      typeof t.profileLabel === "string" &&
      typeof t.savedAt === "number" &&
      typeof t.text === "string"
    ) {
      cleaned.push(t as unknown as PaneTranscript);
    }
  }
  return cleaned.slice(0, MAX_TRANSCRIPTS);
};

export const transcriptTimeLabel = (savedAt: number, now: number): string => {
  const elapsed = now - savedAt;
  if (elapsed < 60_000) return "just now";
  if (elapsed < 3_600_000) return `${Math.floor(elapsed / 60_000)}m ago`;
  if (elapsed < 86_400_000) return `${Math.floor(elapsed / 3_600_000)}h ago`;
  return `${Math.floor(elapsed / 86_400_000)}d ago`;
};
