import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { WorkspaceContextDock } from "./WorkspaceContextDock";

describe("WorkspaceContextDock", () => {
  it("groups real session, workspace, and tool state", () => {
    const html = renderToStaticMarkup(<WorkspaceContextDock
      session={{ title: "Implement the demo", provider: "Codex", status: "running", messages: 8, usageTokens: 1280 }}
      workspace={{ path: "/repo/Keelhouse", branch: "main", changedFiles: 3 }}
      tools={{ activeFile: "app/src/App.tsx", browserUrl: "http://localhost:4173" }}
    />);

    expect(html).toContain('aria-label="Workspace context"');
    expect(html).toContain("Session");
    expect(html).toContain("Workspace");
    expect(html).toContain("Tools");
    expect(html).toContain("Implement the demo");
    expect(html).toContain("1.3k tokens");
    expect(html).toContain("3 changes");
    expect(html).toContain("app/src/App.tsx");
    expect(html).toContain("http://localhost:4173");
  });

  it("does not fabricate unavailable state", () => {
    const html = renderToStaticMarkup(<WorkspaceContextDock
      session={{ title: "No chat", provider: "Unavailable", status: "idle", messages: 0, usageTokens: null }}
      workspace={{ path: null, branch: null, changedFiles: 0 }}
      tools={{ activeFile: null, browserUrl: null }}
    />);

    expect(html).toContain("Not available");
    expect(html).toContain("No file open");
    expect(html).toContain("No preview URL");
  });
});
