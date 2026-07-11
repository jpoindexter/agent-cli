export type CrashRecoveryState = {
  recovered: boolean;
  restoredProjectCount: number;
};

/* `staleLock` is what the backend reports: a session-lock file that survived
   from the previous run means the last session did not close cleanly. We only
   claim recovery when there is actually restorable state, so a first-ever
   launch or a clean slate never shows a misleading notice. */
export const deriveCrashRecovery = (staleLock: boolean, restoredProjectCount: number): CrashRecoveryState => ({
  recovered: staleLock && restoredProjectCount > 0,
  restoredProjectCount,
});

export const crashRecoveryMessage = (state: CrashRecoveryState): string | null => {
  if (!state.recovered) return null;
  const count = state.restoredProjectCount;
  return `Recovered from an unexpected shutdown — reopened ${count} project${count === 1 ? "" : "s"}.`;
};
