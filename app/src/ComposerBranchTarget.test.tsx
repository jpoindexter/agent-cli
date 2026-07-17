// @vitest-environment jsdom
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ComposerBranchTarget } from "./ComposerBranchTarget";

afterEach(cleanup);

const props = () => ({
  currentBranch: "main",
  load: vi.fn(async () => [{ name: "main", current: true }, { name: "release", current: false }]),
  onCheckout: vi.fn(async () => {}), onCreate: vi.fn(async () => {}),
});

describe("ComposerBranchTarget", () => {
  it("searches local branches, marks current, and checks out a selection", async () => {
    const input = props(); const { findByRole, getByRole, queryByRole } = render(<ComposerBranchTarget {...input} />);
    fireEvent.click(getByRole("button", { name: "Choose branch, main" }));
    const search = await findByRole("searchbox", { name: "Search branches" });
    expect((await findByRole("option", { name: "Current branch main" })).getAttribute("aria-selected")).toBe("true");
    fireEvent.change(search, { target: { value: "rel" } });
    expect(queryByRole("option", { name: "Current branch main" })).toBeNull();
    fireEvent.click(getByRole("option", { name: "Switch to branch release" }));
    await waitFor(() => expect(input.onCheckout).toHaveBeenCalledWith("release"));
  });

  it("creates a valid unmatched branch and reports guarded errors", async () => {
    const input = props(); input.onCreate.mockRejectedValueOnce(new Error("uncommitted changes"));
    const { findByRole, getByRole, findByText } = render(<ComposerBranchTarget {...input} />);
    fireEvent.click(getByRole("button", { name: "Choose branch, main" }));
    fireEvent.change(await findByRole("searchbox", { name: "Search branches" }), { target: { value: "feature/api" } });
    fireEvent.click(getByRole("button", { name: "Create and checkout branch feature/api" }));
    expect(await findByText(/uncommitted changes/)).toBeTruthy();
  });
});
