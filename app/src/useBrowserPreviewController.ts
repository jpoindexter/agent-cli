import { useRef, useState } from "react";
import type { AppActionDecision, AppActionDescriptor } from "./appActions";
import { DEFAULT_BROWSER_PREVIEW_URL, type BrowserPreviewRecords } from "./browserPreview";
import { createBrowserPreviewActions } from "./browserPreviewActions";
import type { ScopedSettingsState } from "./scopedSettings";
import { useBrowserPreviewState } from "./useBrowserPreviewState";

export type DetectedLocalDevServer = {
  detectedAt: number;
  paneId: number;
  paneLabel: string;
  projectId: string;
  projectSessionId: string;
  url: string;
};

type MutableValue<T> = { current: T };

type BrowserPreviewControllerOptions = {
  activeRoot: string | null;
  activeSessionId: string | null;
  ensureVisible: () => void;
  gateAction: (action: AppActionDescriptor) => Promise<AppActionDecision>;
  getCurrentRoot: () => string | null;
  getCurrentSessionId: () => string | null;
  saveStore: () => Promise<unknown>;
  scopedSettings: MutableValue<ScopedSettingsState>;
  setScopedSettings: (settings: ScopedSettingsState) => void;
  setStoreValue: (key: string, value: unknown) => Promise<unknown>;
};

type PreviewState = ReturnType<typeof useBrowserPreviewState>;

const createActions = (
  options: BrowserPreviewControllerOptions,
  preview: PreviewState,
  projects: MutableValue<BrowserPreviewRecords>,
  sessions: MutableValue<BrowserPreviewRecords>,
) => createBrowserPreviewActions({
  gateAction: options.gateAction,
  getState: () => ({
    currentRoot: options.getCurrentRoot(),
    currentSessionId: options.getCurrentSessionId(),
    projects: projects.current,
    scopedSettings: options.scopedSettings.current,
    sessions: sessions.current,
  }),
  restoreLocation: preview.restore,
  saveStore: options.saveStore,
  setError: preview.setError,
  setLocation: preview.setLocation,
  setProjects: (records) => { projects.current = records; },
  setScopedSettings: options.setScopedSettings,
  setSessions: (records) => { sessions.current = records; },
  setStoreValue: options.setStoreValue,
});

const activeDetection = (
  detected: DetectedLocalDevServer | null,
  root: string | null,
  sessionId: string | null,
) => detected?.projectId === root && detected.projectSessionId === sessionId ? detected : null;

export function useBrowserPreviewController(options: BrowserPreviewControllerOptions) {
  const projectRecordsRef = useRef<BrowserPreviewRecords>({});
  const sessionRecordsRef = useRef<BrowserPreviewRecords>({});
  const urlRef = useRef(DEFAULT_BROWSER_PREVIEW_URL);
  const detectedServerRef = useRef<DetectedLocalDevServer | null>(null);
  const [detectedServer, setDetectedServerState] = useState<DetectedLocalDevServer | null>(null);
  const preview = useBrowserPreviewState((url) => { urlRef.current = url; });
  const actions = createActions(options, preview, projectRecordsRef, sessionRecordsRef);
  const activeDetectedServer = activeDetection(
    detectedServer, options.activeRoot, options.activeSessionId,
  );
  const setDetectedServer = (server: DetectedLocalDevServer | null) => {
    detectedServerRef.current = server;
    setDetectedServerState(server);
  };
  const openDetectedServer = async () => {
    if (!activeDetectedServer) return false;
    options.ensureVisible();
    return actions.navigate(activeDetectedServer.url);
  };
  const submitAddress = (event: { preventDefault: () => void }) => {
    event.preventDefault();
    return actions.navigate(preview.address);
  };
  return {
    ...preview, activeDetectedServer, detectedServerRef, navigate: actions.navigate,
    openDetectedServer, persistUrl: actions.persistUrl, projectRecordsRef,
    restoreScopedUrl: actions.restoreUrl, sessionRecordsRef, setDetectedServer, submitAddress,
    setProjectRecords: (records: BrowserPreviewRecords) => { projectRecordsRef.current = records; },
    setSessionRecords: (records: BrowserPreviewRecords) => { sessionRecordsRef.current = records; },
    urlRef,
  };
}
