import { useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { readText, writeText } from "@tauri-apps/plugin-clipboard-manager";
import { comboMatches } from "./shortcuts";
import { imeCaretStyle, shouldDeferTerminalKeyToIme } from "./terminalIme";
import { isCellSelected, pointFromMouse, selectionToText, type SelectionRange } from "./selection";
import { recordFrameTime, type RenderPerfState } from "./renderPerf";

type MutableRef<T> = { current: T };
type Cell = { t: string; f: [number, number, number]; b: [number, number, number]; bold: boolean };
type Snapshot = { cols: number; rows: number; cx: number; cy: number; cvis: boolean; sb: number; cells: Cell[] };

type TerminalCanvasRuntimeOptions = {
  canvasRef: MutableRef<HTMLCanvasElement | null>;
  imeInputRef: MutableRef<HTMLTextAreaElement | null>;
  terminalHostRef: MutableRef<HTMLDivElement | null>;
  activePaneIdRef: MutableRef<number | null>;
  latest: MutableRef<Snapshot | null>;
  frame: MutableRef<number | null>;
  metrics: MutableRef<{ cw: number; ch: number }>;
  selection: MutableRef<SelectionRange | null>;
  selecting: MutableRef<boolean>;
  requestPaintRef: MutableRef<() => void>;
  renderPerfRef: MutableRef<RenderPerfState>;
  onCommandPalette: () => void;
  onQuickOpen: () => void;
  onSettings: () => void;
  onReady: () => Promise<void>;
  onResize: () => void;
};

const FONT_SIZE = 15;
const FONT_FAMILY = '"JetBrains Mono", "PingFang SC", "Hiragino Sans", "Apple SD Gothic Neo", monospace';
const LINE_HEIGHT = 1.25;
const rgb = (color: [number, number, number]) => `rgb(${color[0]},${color[1]},${color[2]})`;

export const terminalWheelRows = (deltaY: number, cellHeight: number): number => {
  const rawRows = deltaY / cellHeight;
  return Math.sign(rawRows) * Math.max(1, Math.round(Math.abs(rawRows)));
};

const sizeCanvas = (canvas: HTMLCanvasElement, snapshot: Snapshot, cw: number, ch: number, dpr: number) => {
  const width = snapshot.cols * cw;
  const height = snapshot.rows * ch;
  if (canvas.width === Math.round(width * dpr) && canvas.height === Math.round(height * dpr)) return;
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
};

const paintCells = (
  ctx: CanvasRenderingContext2D,
  snapshot: Snapshot,
  cw: number,
  ch: number,
  selection: SelectionRange | null,
) => {
  for (let y = 0; y < snapshot.rows; y += 1) {
    for (let x = 0; x < snapshot.cols; x += 1) {
      const cell = snapshot.cells[y * snapshot.cols + x];
      if (!cell) continue;
      const selected = isCellSelected(x, y, selection);
      ctx.fillStyle = selected ? "#2f6f9f" : rgb(cell.b);
      ctx.fillRect(x * cw, y * ch, cw, ch);
      if (cell.t === " ") continue;
      ctx.fillStyle = selected ? "#ffffff" : rgb(cell.f);
      ctx.font = `${cell.bold ? "bold " : ""}${FONT_SIZE}px ${FONT_FAMILY}`;
      ctx.fillText(cell.t, x * cw, y * ch + (ch - FONT_SIZE) / 2);
    }
  }
};

const paintSnapshot = (options: TerminalCanvasRuntimeOptions, ctx: CanvasRenderingContext2D) => {
  options.frame.current = null;
  const snapshot = options.latest.current;
  const canvas = options.canvasRef.current;
  if (!snapshot || !canvas) {
    if (canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
    return;
  }
  const startedAt = performance.now();
  const { cw, ch } = options.metrics.current;
  const dpr = window.devicePixelRatio || 1;
  sizeCanvas(canvas, snapshot, cw, ch, dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.textBaseline = "top";
  ctx.font = `${FONT_SIZE}px ${FONT_FAMILY}`;
  paintCells(ctx, snapshot, cw, ch, options.selection.current);
  if (snapshot.cvis) {
    ctx.fillStyle = "rgba(230,230,230,0.55)";
    ctx.fillRect(snapshot.cx * cw, snapshot.cy * ch, cw, ch);
  }
  const imeInput = options.imeInputRef.current;
  if (imeInput) Object.assign(imeInput.style, imeCaretStyle(snapshot.cx, snapshot.cy, cw, ch));
  recordFrameTime(options.renderPerfRef.current, performance.now() - startedAt);
};

const createRequestPaint = (options: TerminalCanvasRuntimeOptions, ctx: CanvasRenderingContext2D) => () => {
  if (options.frame.current == null) {
    options.frame.current = requestAnimationFrame(() => paintSnapshot(options, ctx));
  }
};

const scrollViewport = (options: TerminalCanvasRuntimeOptions, requestPaint: () => void, delta: number) => {
  if (options.activePaneIdRef.current == null || !Number.isFinite(delta) || delta === 0) return;
  options.selection.current = null;
  requestPaint();
  void invoke("scroll_pty", { delta: Math.trunc(delta) }).catch(() => {});
};

const handleMetaKey = (event: KeyboardEvent, options: TerminalCanvasRuntimeOptions, requestPaint: () => void) => {
  const key = event.key.toLowerCase();
  if (key === "k") {
    event.preventDefault();
    void invoke("send_key", { code: "KeyL", text: null, shift: false, alt: false, ctrl: true, sup: false }).catch(() => {});
  } else if (key === "c") {
    const snapshot = options.latest.current;
    const text = snapshot && options.selection.current
      ? selectionToText(snapshot.cells, snapshot.cols, options.selection.current)
      : "";
    if (text) {
      event.preventDefault();
      void writeText(text).catch(() => {});
    }
  } else if (key === "v") {
    event.preventDefault();
    options.selection.current = null;
    requestPaint();
    void readText().then((text) => text && invoke("paste", { text })).catch(() => {});
  }
};

const handleAppShortcut = (event: KeyboardEvent, options: TerminalCanvasRuntimeOptions): boolean => {
  const shortcuts: [string, () => void][] = [
    ["chrome.command-palette", options.onCommandPalette],
    ["workspace.quick-open", options.onQuickOpen],
    ["chrome.settings", options.onSettings],
  ];
  const match = shortcuts.find(([id]) => comboMatches(event, id));
  if (!match) return false;
  event.preventDefault();
  match[1]();
  return true;
};

const createKeyHandler = (options: TerminalCanvasRuntimeOptions, requestPaint: () => void) => (event: KeyboardEvent) => {
  const target = event.target instanceof HTMLElement ? event.target : null;
  if (event.isComposing || (target?.matches(".terminal-ime-input") && shouldDeferTerminalKeyToIme(event))) return;
  if (handleAppShortcut(event, options)) return;
  if (target?.closest(".file-rail, .editor-area, .browser-preview, .terminal-titlebar, .agent-composer, .command-palette")) return;
  if (options.activePaneIdRef.current == null) return;
  if (event.metaKey) {
    handleMetaKey(event, options, requestPaint);
    return;
  }
  if (event.shiftKey && (event.code === "PageUp" || event.code === "PageDown")) {
    event.preventDefault();
    const rows = options.latest.current?.rows ?? 24;
    scrollViewport(options, requestPaint, event.code === "PageUp" ? -(rows - 1) : rows - 1);
    return;
  }
  if (!event.code) return;
  options.selection.current = null;
  requestPaint();
  event.preventDefault();
  void invoke("send_key", {
    code: event.code,
    text: event.key.length === 1 && !event.ctrlKey && !event.altKey ? event.key : null,
    shift: event.shiftKey,
    alt: event.altKey,
    ctrl: event.ctrlKey,
    sup: false,
  }).catch(() => {});
};

const attachPointerInput = (options: TerminalCanvasRuntimeOptions, requestPaint: () => void) => {
  const canvas = options.canvasRef.current!;
  const pointForEvent = (event: MouseEvent) => {
    const snapshot = options.latest.current;
    if (!snapshot) return null;
    const { cw, ch } = options.metrics.current;
    return pointFromMouse(canvas.getBoundingClientRect(), cw, ch, snapshot.cols, snapshot.rows, event.clientX, event.clientY);
  };
  const onMouseDown = (event: MouseEvent) => {
    const point = event.button === 0 ? pointForEvent(event) : null;
    if (!point) return;
    event.preventDefault();
    options.selection.current = { start: point, end: point };
    options.selecting.current = true;
    requestPaint();
  };
  const onMouseMove = (event: MouseEvent) => {
    if (!options.selecting.current || !options.selection.current) return;
    const point = pointForEvent(event);
    if (!point) return;
    options.selection.current = { ...options.selection.current, end: point };
    requestPaint();
  };
  const onMouseUp = () => { options.selecting.current = false; };
  const onWheel = (event: WheelEvent) => {
    if (!options.latest.current?.sb) return;
    event.preventDefault();
    scrollViewport(options, requestPaint, terminalWheelRows(event.deltaY, options.metrics.current.ch));
  };
  canvas.addEventListener("mousedown", onMouseDown);
  canvas.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mouseup", onMouseUp);
  return () => {
    canvas.removeEventListener("mousedown", onMouseDown);
    canvas.removeEventListener("wheel", onWheel);
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
  };
};

const prepareCanvas = async (options: TerminalCanvasRuntimeOptions, ctx: CanvasRenderingContext2D) => {
  await (document as Document & { fonts?: { ready: Promise<unknown> } }).fonts?.ready;
  ctx.font = `${FONT_SIZE}px ${FONT_FAMILY}`;
  options.metrics.current = {
    cw: Math.max(1, Math.round(ctx.measureText("M").width)),
    ch: Math.round(FONT_SIZE * LINE_HEIGHT),
  };
  await options.onReady();
};

export function useTerminalCanvasRuntime(options: TerminalCanvasRuntimeOptions): void {
  useEffect(() => {
    const canvas = options.canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const requestPaint = createRequestPaint(options, ctx);
    options.requestPaintRef.current = requestPaint;
    const onKey = createKeyHandler(options, requestPaint);
    const detachPointerInput = attachPointerInput(options, requestPaint);
    const resizeObserver = new ResizeObserver(options.onResize);
    if (options.terminalHostRef.current) resizeObserver.observe(options.terminalHostRef.current);
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", options.onResize);
    void prepareCanvas(options, ctx);
    return () => {
      detachPointerInput();
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", options.onResize);
      resizeObserver.disconnect();
      if (options.frame.current != null) cancelAnimationFrame(options.frame.current);
    };
  }, []);
}
