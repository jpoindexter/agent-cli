import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { EditorSaveError } from "./EditorSaveError";

describe("EditorSaveError", () => {
  it("shows the save failure and explicit recovery actions", () => {
    const html = renderToStaticMarkup(
      <EditorSaveError
        message="Could not save file App.tsx: permission denied"
        recoveryError={null}
        saving={false}
        canOpenExternally
        onRetry={vi.fn()}
        onOpenExternally={vi.fn()}
      />,
    );

    expect(html).toContain('role="alert"');
    expect(html).toContain("Save failed");
    expect(html).toContain("Could not save file App.tsx: permission denied");
    expect(html).toContain("Retry");
    expect(html).toContain("Open externally");
  });

  it("disables retry while a real save is already running", () => {
    const html = renderToStaticMarkup(
      <EditorSaveError
        message="Could not save file App.tsx: permission denied"
        recoveryError={null}
        saving={true}
        canOpenExternally
        onRetry={vi.fn()}
        onOpenExternally={vi.fn()}
      />,
    );

    expect(html).toContain("Retrying");
    expect(html).toContain("disabled");
  });

  it("shows opener failures without hiding retry", () => {
    const html = renderToStaticMarkup(
      <EditorSaveError
        message="Could not save file App.tsx: permission denied"
        recoveryError="Could not open App.tsx externally: denied"
        saving={false}
        canOpenExternally
        onRetry={vi.fn()}
        onOpenExternally={vi.fn()}
      />,
    );

    expect(html).toContain("Could not open App.tsx externally: denied");
    expect(html).toContain("Retry");
  });
});
