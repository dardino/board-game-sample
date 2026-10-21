import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  registerMe: vi.fn(),
  deleteMe: vi.fn(),
}));

vi.mock("../../api/resources/me.proxy", () => ({
  MeProxy: {
    registerMe: mocks.registerMe,
    deleteMe: mocks.deleteMe,
    getMe: vi.fn(),
  },
}));

import { Registration } from "./registration.service";

describe("Registration", () => {
  it("notifies subscribers after successful login and logout", async () => {
    const listener = vi.fn();
    const unsubscribe = Registration.SubscribeToChanges(listener);
    mocks.registerMe.mockResolvedValue({
      id: 17,
      isPlaying: false,
      nickname: "adventurer",
    });
    mocks.deleteMe.mockResolvedValue(undefined);

    await expect(Registration.RegisterMe("adventurer")).resolves.toBe(true);
    await expect(Registration.Unregister()).resolves.toBe(true);

    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
  });
});
