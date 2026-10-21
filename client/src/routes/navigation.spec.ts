import { afterEach, describe, expect, it, vi } from "vitest";
import { navigate } from "./navigation";

describe("navigate", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("replaces browser history for automatic route transitions", () => {
    const replaceState = vi.fn();
    const pushState = vi.fn();
    const dispatchEvent = vi.fn();
    vi.stubGlobal("history", {
      replaceState,
      pushState,
    });
    vi.stubGlobal("document", { dispatchEvent });

    navigate(
      "/game/:id/in-progress/character-selection",
      { id: "42" },
      { replace: true },
    );

    expect(replaceState).toHaveBeenCalledWith(
      {},
      "",
      "/game/42/in-progress/character-selection",
    );
    expect(pushState).not.toHaveBeenCalled();
    expect(dispatchEvent).toHaveBeenCalledOnce();
  });
});
