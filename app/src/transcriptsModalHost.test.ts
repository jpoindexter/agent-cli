import { describe, expect, it, vi } from "vitest";
import { transcriptsModalPropsFrom } from "./transcriptsModalHost";

const createController = () => ({
  openTranscriptId: "t1" as string | null,
  paneTranscripts: [],
  setOpenTranscriptId: vi.fn(),
  setTranscriptsOpen: vi.fn(),
  transcriptsOpen: true,
});

describe("transcriptsModalPropsFrom", () => {
  it("binds the transcripts controller and closes through it", () => {
    const controller = createController();
    const props = transcriptsModalPropsFrom(controller, {
      projectId: "/repo", projectSessionId: "chat",
    });

    expect(props).toMatchObject({
      activeTranscriptId: "t1", open: true, projectId: "/repo",
      projectSessionId: "chat", transcripts: [],
    });
    expect(props.onSelect).toBe(controller.setOpenTranscriptId);

    props.onClose();
    expect(controller.setTranscriptsOpen).toHaveBeenCalledWith(false);
  });
});
