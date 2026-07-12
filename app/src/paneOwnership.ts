const PANE_CONTEXT_SEPARATOR = "\n";

export const paneContextKey = (projectRoot: string | null, sessionId: string | null): string | null =>
  projectRoot && sessionId ? `${projectRoot}${PANE_CONTEXT_SEPARATOR}${sessionId}` : null;

export const paneContextParts = (key: string): { projectRoot: string; sessionId: string } | null => {
  const separator = key.lastIndexOf(PANE_CONTEXT_SEPARATOR);
  if (separator <= 0 || separator === key.length - 1) return null;
  return {
    projectRoot: key.slice(0, separator),
    sessionId: key.slice(separator + PANE_CONTEXT_SEPARATOR.length),
  };
};

export const paneContextBelongsToProject = (key: string, projectRoot: string): boolean =>
  paneContextParts(key)?.projectRoot === projectRoot;

export const removeProjectPaneContexts = <T>(contexts: Record<string, T>, projectRoot: string): Record<string, T> =>
  Object.fromEntries(Object.entries(contexts).filter(([key]) => !paneContextBelongsToProject(key, projectRoot)));
