// @vitest-environment jsdom
import { renderToStaticMarkup } from "react-dom/server";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ProjectThreadsDrawer, type ProjectThreadsDrawerProps } from "./ProjectThreadsDrawer";

afterEach(cleanup);

const props = (overrides: Partial<ProjectThreadsDrawerProps> = {}): ProjectThreadsDrawerProps => ({
  activeProjectPath: "/repo", activeSessionId: "one", backgroundExits: [], expandedProjects: {},
  projects: [{ path: "/repo", status: "exited" }], recentProjects: ["/recent"], newTaskShortcut: "Cmd+N", sessionsByProject: { "/repo": [{ id: "one", title: "Current work", status: "exited", updatedAt: Date.now() }] },
  entryStatus: { kind: "idle" },
  switcherOpen: false,
  showArchived: false, projectStatus: () => "exited", sessionStatus: () => "exited",
  onNewProject: vi.fn(), onNewTask: vi.fn(), onOpenProject: vi.fn(), onProjectContextMenu: vi.fn(), onSelectProject: vi.fn(), onSelectSession: vi.fn(),
  onRetryProjectOpen: vi.fn(),
  onSwitcherOpenChange: vi.fn(),
  onSessionContextMenu: vi.fn(), onToggleArchived: vi.fn(), onToggleExpanded: vi.fn(), ...overrides,
});

describe("ProjectThreadsDrawer", () => {
  it("renders the active project and chat", () => {
    const html = renderToStaticMarkup(<ProjectThreadsDrawer {...props()} />);
    expect(html).toContain('aria-label="Switch project"');
    expect(html).toContain('aria-label="New Task (Cmd+N)"');
    expect(html).toContain("Cmd+N");
    expect(html).toContain("Active project repo, Idle");
    expect(html).toContain("Active chat Current work, Idle");
  });

  it("renders actionable first-use project entry", () => {
    const input = props({ activeProjectPath: null, projects: [], recentProjects: [] });
    const { getByRole, getByText } = render(<ProjectThreadsDrawer {...input} />);
    expect(getByText("Start with a project")).toBeTruthy();
    fireEvent.click(getByRole("button", { name: "Open Project…" }));
    fireEvent.click(getByRole("button", { name: "New Project…" }));
    expect(input.onOpenProject).toHaveBeenCalledOnce();
    expect(input.onNewProject).toHaveBeenCalledOnce();
  });

  it("keeps a cleared project list neutral", () => {
    const { getByText } = render(<ProjectThreadsDrawer {...props({ activeProjectPath: null, projects: [], recentProjects: ["/recent"] })} />);
    expect(getByText("No projects are open")).toBeTruthy();
  });

  it("keeps existing projects visible while another project opens", () => {
    const { getByRole, getByText } = render(<ProjectThreadsDrawer {...props({ entryStatus: { kind: "loading", path: "/next" } })} />);
    expect(getByRole("status").getAttribute("aria-busy")).toBe("true");
    expect(getByText("Opening next…")).toBeTruthy();
    expect(getByRole("button", { name: "Active project repo, Idle" })).toBeTruthy();
  });

  it("shows project-open failure with a retry action", () => {
    const input = props({ activeProjectPath: null, projects: [], entryStatus: { kind: "error", path: "/missing", message: "Project folder is unavailable" } });
    const { getByRole, getByText, queryByText } = render(<ProjectThreadsDrawer {...input} />);
    expect(getByText("Couldn’t open missing")).toBeTruthy();
    expect(getByRole("alert")).toBeTruthy();
    expect(queryByText("Start with a project")).toBeNull();
    fireEvent.click(getByRole("button", { name: "Retry opening project" }));
    expect(input.onRetryProjectOpen).toHaveBeenCalledOnce();
  });
});
