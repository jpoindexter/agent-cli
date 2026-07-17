import { useRef, useState } from "react";

export type ProjectEntryOpenStatus =
  | { kind: "idle" }
  | { kind: "loading"; path: string }
  | { kind: "error"; message: string; path: string };

export const useProjectEntryOpenState = () => {
  const [status, setStatusState] = useState<ProjectEntryOpenStatus>({ kind: "idle" });
  const statusRef = useRef<ProjectEntryOpenStatus>(status);
  const setStatus = (next: ProjectEntryOpenStatus) => { statusRef.current = next; setStatusState(next); };
  const reportError = (message: string | null) => {
    if (!message || statusRef.current.kind === "idle") return;
    setStatus({ kind: "error", message, path: statusRef.current.path });
  };
  const track = async (path: string, operation: () => Promise<boolean>) => {
    setStatus({ kind: "loading", path });
    try {
      const opened = await operation();
      if (statusRef.current.kind === "loading") setStatus({ kind: "idle" });
      return opened;
    } catch (error) {
      reportError(String(error));
      return false;
    }
  };
  return { reportError, status, track };
};
