import type { EditorViewState } from "./editorState";
import { launchProfileById } from "./launchProfiles";
import { normalizeTerminalPaneLabel } from "./terminalPane";

export type SessionFileTab = {
  id: string;
  name: string;
  path: string;
  kind: "file";
  dirty?: boolean;
};

export type PersistedEditorBuffer = {
  text: string;
  savedText: string;
  bytes: number | null;
  modifiedMs: number | null;
  error: string | null;
  recoveryError: string | null;
};

export type PersistedEditorSnapshot = {
  tabs: SessionFileTab[];
  activePath: string | null;
  buffers: Record<string, PersistedEditorBuffer>;
  viewStates: Record<string, EditorViewState>;
};

export type SessionEditorSnapshots = Record<string, PersistedEditorSnapshot>;
export type PaneLayoutRecord = { slot: number; profileId: string; label: string | null };
export type PaneLayoutsBySession = Record<string, PaneLayoutRecord[]>;
export type PaneLayoutSource = { slot: number; profile: { id: string }; label?: string | null };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value != null && !Array.isArray(value);

const finiteNumberOrNull = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const finiteNonNegativeNumber = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) ? Math.max(0, value) : 0;

const normalizeSessionTab = (value: unknown): SessionFileTab | null => {
  if (!isRecord(value)) return null;
  if (typeof value.path !== "string" || !value.path.trim()) return null;
  if (value.kind !== "file") return null;
  const name = typeof value.name === "string" && value.name.trim()
    ? value.name
    : value.path.split(/[\\/]/).filter(Boolean).pop() ?? value.path;
  return {
    id: typeof value.id === "string" && value.id.trim() ? value.id : value.path,
    name,
    path: value.path,
    kind: "file",
    dirty: value.dirty === true ? true : undefined,
  };
};

const normalizeEditorBuffer = (value: unknown): PersistedEditorBuffer | null => {
  if (!isRecord(value) || typeof value.text !== "string" || typeof value.savedText !== "string") return null;
  return {
    text: value.text,
    savedText: value.savedText,
    bytes: finiteNumberOrNull(value.bytes),
    modifiedMs: finiteNumberOrNull(value.modifiedMs),
    error: typeof value.error === "string" ? value.error : null,
    recoveryError: typeof value.recoveryError === "string" ? value.recoveryError : null,
  };
};

const normalizeEditorBuffers = (value: unknown): Record<string, PersistedEditorBuffer> => {
  if (!isRecord(value)) return {};
  return Object.fromEntries(
    Object.entries(value).flatMap(([path, rawBuffer]) => {
      if (!path) return [];
      const buffer = normalizeEditorBuffer(rawBuffer);
      return buffer ? [[path, buffer]] : [];
    }),
  );
};

const normalizeViewState = (value: unknown): EditorViewState | null => {
  if (!isRecord(value)) return null;
  if (
    typeof value.anchor !== "number" ||
    typeof value.head !== "number" ||
    typeof value.scrollTop !== "number" ||
    !Number.isFinite(value.anchor) ||
    !Number.isFinite(value.head) ||
    !Number.isFinite(value.scrollTop)
  ) {
    return null;
  }
  return {
    anchor: finiteNonNegativeNumber(value.anchor),
    head: finiteNonNegativeNumber(value.head),
    scrollTop: finiteNonNegativeNumber(value.scrollTop),
    focused: value.focused === true,
  };
};

const normalizeEditorViewStates = (value: unknown): Record<string, EditorViewState> => {
  if (!isRecord(value)) return {};
  return Object.fromEntries(
    Object.entries(value).flatMap(([path, rawState]) => {
      if (!path) return [];
      const state = normalizeViewState(rawState);
      return state ? [[path, state]] : [];
    }),
  );
};

const normalizeEditorSnapshot = (value: unknown): PersistedEditorSnapshot | null => {
  if (!isRecord(value)) return null;
  const tabs = Array.isArray(value.tabs) ? value.tabs.flatMap((tab) => {
    const normalized = normalizeSessionTab(tab);
    return normalized ? [normalized] : [];
  }) : [];
  const tabPaths = new Set(tabs.map((tab) => tab.path));
  const activePath = typeof value.activePath === "string" && tabPaths.has(value.activePath) ? value.activePath : null;
  return {
    tabs,
    activePath,
    buffers: normalizeEditorBuffers(value.buffers),
    viewStates: normalizeEditorViewStates(value.viewStates),
  };
};

export const normalizeSessionEditorSnapshots = (value: unknown): SessionEditorSnapshots => {
  if (!isRecord(value)) return {};
  return Object.fromEntries(
    Object.entries(value).flatMap(([key, rawSnapshot]) => {
      if (!key) return [];
      const snapshot = normalizeEditorSnapshot(rawSnapshot);
      return snapshot ? [[key, snapshot]] : [];
    }),
  );
};

const normalizePaneLayoutRecord = (value: unknown): PaneLayoutRecord | null => {
  if (!isRecord(value)) return null;
  const slot = typeof value.slot === "number" && Number.isInteger(value.slot) && value.slot >= 0 ? value.slot : null;
  if (slot == null) return null;
  const profileId = typeof value.profileId === "string" && value.profileId.trim()
    ? launchProfileById(value.profileId).id
    : launchProfileById("").id;
  return {
    slot,
    profileId,
    label: normalizeTerminalPaneLabel(value.label),
  };
};

export const normalizePaneLayoutsBySession = (value: unknown): PaneLayoutsBySession => {
  if (!isRecord(value)) return {};
  return Object.fromEntries(
    Object.entries(value).flatMap(([key, rawRecords]) => {
      if (!key || !Array.isArray(rawRecords)) return [];
      const bySlot = new Map<number, PaneLayoutRecord>();
      for (const rawRecord of rawRecords) {
        const record = normalizePaneLayoutRecord(rawRecord);
        if (record) bySlot.set(record.slot, record);
      }
      const records = [...bySlot.values()].sort((a, b) => a.slot - b.slot);
      return records.length > 0 ? [[key, records]] : [];
    }),
  );
};

export const paneLayoutFromPanes = (panes: PaneLayoutSource[]): PaneLayoutRecord[] =>
  panes
    .map((pane) => ({
      slot: pane.slot,
      profileId: launchProfileById(pane.profile.id).id,
      label: normalizeTerminalPaneLabel(pane.label),
    }))
    .sort((a, b) => a.slot - b.slot);
