// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { EditorCodeSurface, type EditorCodeSurfaceProps } from "./EditorCodeSurface";

vi.mock("@uiw/react-codemirror", () => ({ default: () => <div data-testid="code-mirror" /> }));

const props = (overrides: Partial<EditorCodeSurfaceProps> = {}): EditorCodeSurfaceProps => ({
  conflict: false, error: null, filePath: "/repo/App.tsx", loading: false, recoveryError: null,
  saving: false, value: "const value = 1;", onChange: vi.fn(), onContextMenu: vi.fn(),
  onCreateEditor: vi.fn(), onOpenExternally: vi.fn(), onOverwrite: vi.fn(), onReload: vi.fn(),
  onRetry: vi.fn(), onSave: vi.fn(), onUpdate: vi.fn(), ...overrides,
});

describe("EditorCodeSurface", () => {
  it("routes the save shortcut", () => {
    const onSave = vi.fn();
    render(<EditorCodeSurface {...props({ onSave })} />);
    fireEvent.keyDown(screen.getByTestId("code-mirror").parentElement!, { key: "s", metaKey: true });
    expect(onSave).toHaveBeenCalledOnce();
  });

  it("renders save recovery actions", () => {
    render(<EditorCodeSurface {...props({ conflict: true, error: "File changed on disk" })} />);
    expect(screen.getByRole("button", { name: "Reload" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Overwrite" })).toBeTruthy();
  });
});
