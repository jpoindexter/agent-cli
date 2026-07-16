import { describe, expect, it, vi } from "vitest";
import { createChatSearchNavigation } from "./chatSearchNavigation";
import type { ProjectSession, ProjectSessionsByProject } from "./workspaceStateTypes";

const session = (id: string, archived = false): ProjectSession => ({
  archived, id, status: "running", title: id, updatedAt: 1,
});

const result = { messageId: "m1", projectPath: "/repo", sessionId: "chat" };

const createOptions = () => ({
  focusMessage: vi.fn(),
  getSessions: vi.fn((): ProjectSessionsByProject => ({ "/repo": [session("chat")] })),
  setError: vi.fn(),
  showArchived: vi.fn(),
  showProjectsDrawer: vi.fn(),
  switchSession: vi.fn(async () => {}),
});

describe("createChatSearchNavigation", () => {
  it("switches to the found chat, focuses the message, and opens the drawer", async () => {
    const options = createOptions();
    const open = createChatSearchNavigation(options);

    await open(result);

    expect(options.switchSession).toHaveBeenCalledWith("/repo", "chat");
    expect(options.focusMessage).toHaveBeenCalledWith("m1");
    expect(options.showProjectsDrawer).toHaveBeenCalled();
    expect(options.showArchived).not.toHaveBeenCalled();
  });

  it("reveals archived sessions before switching to them", async () => {
    const options = createOptions();
    options.getSessions.mockReturnValue({ "/repo": [session("chat", true)] });
    const open = createChatSearchNavigation(options);

    await open(result);

    expect(options.showArchived).toHaveBeenCalled();
    expect(options.switchSession).toHaveBeenCalled();
  });

  it("reports missing navigation metadata instead of switching", async () => {
    const options = createOptions();
    options.getSessions.mockReturnValue({});
    const open = createChatSearchNavigation(options);

    await open(result);

    expect(options.setError).toHaveBeenCalledWith(
      "This chat's navigation metadata is unavailable. Open its project and try again.",
    );
    expect(options.switchSession).not.toHaveBeenCalled();
  });
});
