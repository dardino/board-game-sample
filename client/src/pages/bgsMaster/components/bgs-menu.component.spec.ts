import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getMe: vi.fn(),
  subscribeToChanges: vi.fn(),
  onRegistrationChange: null as (() => void) | null,
}));

vi.mock("../../../services/registration/registration.service", () => ({
  Registration: {
    GetMe: mocks.getMe,
    SubscribeToChanges: mocks.subscribeToChanges,
  },
}));

vi.mock("./bgs-menu.module.css", () => ({
  default: {
    nav: "nav",
  },
}));

vi.mock("./bgs-menu.template.html?raw", () => ({
  default: "",
}));

class MockElement {

  textContent = "";

  classList = {
    add: vi.fn(),
    toggle: vi.fn(),
  };

}

class MockHTMLElement {

  innerHTML = "";

  style = { display: "" };

  elements = new Map<string, MockElement>([
    ["#nav", new MockElement()],
    ["#join", new MockElement()],
    ["#logout", new MockElement()],
    ["#gamelist", new MockElement()],
    ["#user", new MockElement()],
  ]);

  querySelector (selector: string) {
    return this.elements.get(selector) ?? null;
  }

}

describe("BgsMenuComponent", () => {
  let BgsMenuComponent: typeof import("./bgs-menu.component").BgsMenuComponent;

  beforeAll(async () => {
    vi.stubGlobal("HTMLElement", MockHTMLElement);
    ({ BgsMenuComponent } = await import("./bgs-menu.component"));
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.onRegistrationChange = null;
    mocks.getMe.mockResolvedValue(null);
    mocks.subscribeToChanges.mockImplementation((listener: () => void) => {
      mocks.onRegistrationChange = listener;
      return vi.fn();
    });
  });

  it("refreshes the navbar when registration state changes without remounting", async () => {
    const menu = new BgsMenuComponent();
    menu.connectedCallback?.();
    await vi.waitFor(() => {
      expect(mocks.getMe).toHaveBeenCalled();
      expect(menu.querySelector("#join")?.classList.toggle).toHaveBeenCalledWith("hidden", false);
    });

    mocks.getMe.mockResolvedValue({
      id: 42,
      isPlaying: false,
      nickname: "adventurer",
    });
    mocks.onRegistrationChange?.();

    await vi.waitFor(() => {
      expect(menu.querySelector("#join")?.classList.toggle).toHaveBeenLastCalledWith("hidden", true);
      expect(menu.querySelector("#logout")?.classList.toggle).toHaveBeenLastCalledWith("hidden", false);
      expect(menu.querySelector("#gamelist")?.classList.toggle).toHaveBeenLastCalledWith("hidden", false);
      expect(menu.querySelector("#user")?.textContent).toBe("adventurer");
    });
  });

  it("unsubscribes from registration changes when disconnected", () => {
    const menu = new BgsMenuComponent();
    const unsubscribe = vi.fn();
    mocks.subscribeToChanges.mockReturnValue(unsubscribe);
    menu.connectedCallback?.();
    menu.disconnectedCallback?.();

    expect(unsubscribe).toHaveBeenCalledOnce();
  });
});
