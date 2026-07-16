import { describe, expect, it, vi } from "vitest";
import { createEditorFileUtilityActions } from "./editorFileUtilityActions";

const file = { id: "1", name: "notes.md", path: "/repo/docs/notes.md" };

const createOptions = () => ({
  copyText: vi.fn(async () => {}),
  getSelectedFile: vi.fn(() => file as typeof file | null),
  getView: vi.fn(() => null as { focus: () => void } | null),
  notify: vi.fn(),
  openExternal: vi.fn(async () => {}),
  openFileDirect: vi.fn(async () => {}),
  openSearchPanel: vi.fn(),
  revealInDir: vi.fn(async () => {}),
  saveFile: vi.fn(async () => true),
  scheduleFrame: (callback: () => void) => callback(),
  setRecoveryError: vi.fn(),
});

describe("createEditorFileUtilityActions", () => {
  it("reloads the selected file from disk with editor focus", async () => {
    const options = createOptions();
    const actions = createEditorFileUtilityActions(options);

    await actions.reloadFromDisk();

    expect(options.openFileDirect).toHaveBeenCalledWith(file, { focusEditor: true });
  });

  it("skips reload and external open without a selected file", async () => {
    const options = createOptions();
    options.getSelectedFile.mockReturnValue(null);
    const actions = createEditorFileUtilityActions(options);

    await actions.reloadFromDisk();
    await actions.openExternally();

    expect(options.openFileDirect).not.toHaveBeenCalled();
    expect(options.openExternal).not.toHaveBeenCalled();
  });

  it("overwrites the selected file with a forced save", async () => {
    const options = createOptions();
    const actions = createEditorFileUtilityActions(options);

    await actions.overwrite();

    expect(options.saveFile).toHaveBeenCalledWith({ force: true });
  });

  it("reports a recovery error when external open fails", async () => {
    const options = createOptions();
    options.openExternal.mockRejectedValue("EPERM");
    const actions = createEditorFileUtilityActions(options);

    await actions.openExternally();

    expect(options.setRecoveryError).toHaveBeenCalledWith(null);
    expect(options.setRecoveryError).toHaveBeenLastCalledWith(
      "Could not open notes.md externally: EPERM",
    );
  });

  it("reports a recovery error when reveal fails", async () => {
    const options = createOptions();
    options.revealInDir.mockRejectedValue("ENOENT");
    const actions = createEditorFileUtilityActions(options);

    await actions.reveal();

    expect(options.setRecoveryError).toHaveBeenLastCalledWith("Could not reveal notes.md: ENOENT");
  });

  it("copies a path and notifies with its basename", async () => {
    const options = createOptions();
    const actions = createEditorFileUtilityActions(options);

    await actions.copyPath("/repo/src/main.ts");

    expect(options.copyText).toHaveBeenCalledWith("/repo/src/main.ts");
    expect(options.notify).toHaveBeenCalledWith("Copied main.ts path");
  });

  it("opens the editor search panel and refocuses the view", () => {
    const options = createOptions();
    const view = { focus: vi.fn() };
    options.getView.mockReturnValue(view);
    const actions = createEditorFileUtilityActions(options);

    actions.openSearch();

    expect(options.openSearchPanel).toHaveBeenCalledWith(view);
    expect(view.focus).toHaveBeenCalled();
  });
});
