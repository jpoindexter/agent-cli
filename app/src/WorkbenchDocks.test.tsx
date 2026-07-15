import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { FilesDock, SourceControlDock } from "./WorkbenchDocks";

describe("WorkbenchDocks", () => {
  it("renders filtered project files", () => {
    const html = renderToStaticMarkup(<FilesDock files={[{ id: "/repo/src/App.tsx", name: "App.tsx", path: "/repo/src/App.tsx", kind: "file" }]} loading={false} error={null} query="App" selectedFilePath="/repo/src/App.tsx" workspacePath="/repo" onCreateFile={vi.fn()} onCreateFolder={vi.fn()} onOpenFile={vi.fn()} onQueryChange={vi.fn()} onRefresh={vi.fn()} />);
    expect(html).toContain("App.tsx");
    expect(html).toContain("dock-file-row--active");
  });

  it("renders source control status", () => {
    const html = renderToStaticMarkup(<SourceControlDock branch="main" error={null} files={[{ path: "README.md", index: "?", worktree: "?" }]} isRepository loading={false} staged={0} untracked={1} workspacePath="/repo" onFileContextMenu={vi.fn()} onOpenDiff={vi.fn()} onRefresh={vi.fn()} />);
    expect(html).toContain("main");
    expect(html).toContain("1 changes");
    expect(html).toContain("Untracked");
  });
});
