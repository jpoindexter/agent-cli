export const imeCaretStyle = (cx: number, cy: number, cw: number, ch: number) => ({
  transform: `translate(${cx * cw}px, ${cy * ch}px)`,
  width: `${cw}px`,
  height: `${ch}px`,
});

type TerminalImeKeyEvent = Pick<KeyboardEvent, "isComposing" | "key" | "keyCode">;

export const shouldDeferTerminalKeyToIme = (event: TerminalImeKeyEvent): boolean =>
  event.isComposing || event.key === "Dead" || event.key === "Process" || event.keyCode === 229;
