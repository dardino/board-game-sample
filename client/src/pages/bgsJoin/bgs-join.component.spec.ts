import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  registration: {
    Errors: [] as string[],
    GetMe: vi.fn(),
    RegisterMe: vi.fn(),
    status: "unregistered",
  },
  navigate: vi.fn(),
  storage: new Map<string, string>(),
}));

vi.mock("../../routes/navigation", () => ({
  navigate: mocks.navigate,
}));

vi.mock("../../services/registration/registration.service", () => ({
  Registration: mocks.registration,
}));

class MockElement {

  value = "";

  textContent = "";

  classList = {
    add: vi.fn(),
    remove: vi.fn(),
  };

  #listeners = new Map<string, EventListenerOrEventListenerObject>();

  addEventListener (type: string, listener: EventListenerOrEventListenerObject) {
    this.#listeners.set(type, listener);
  }

  removeEventListener (type: string) {
    this.#listeners.delete(type);
  }

}

class MockHTMLElement {

  static input = new MockElement();

  static errorMessage = new MockElement();

  innerHTML = "";

  style = { display: "" };

  #elements = new Map<string, MockElement>([
    ["#notRegistered", new MockElement()],
    ["#registered", new MockElement()],
    ["input", MockHTMLElement.input],
    ["#nickname", new MockElement()],
    ["#registerForm", new MockElement()],
    ["#logout", new MockElement()],
    ["#errorMessage", MockHTMLElement.errorMessage],
  ]);

  constructor () {
    MockHTMLElement.input = new MockElement();
    this.#elements.set("input", MockHTMLElement.input);
    MockHTMLElement.errorMessage = new MockElement();
    this.#elements.set("#errorMessage", MockHTMLElement.errorMessage);
  }

  querySelector (selector: string) {
    return this.#elements.get(selector) ?? null;
  }

}

describe("BgsJoinComponent", () => {
  let BgsJoinComponent: typeof import("./bgs-join.component").BgsJoinComponent;

  beforeAll(async () => {
    vi.stubGlobal("HTMLElement", MockHTMLElement);
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => mocks.storage.get(key) ?? null,
      setItem: (key: string, value: string) => mocks.storage.set(key, value),
    });
    ({ BgsJoinComponent } = await import("./bgs-join.component"));
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.registration.Errors = [];
    mocks.registration.status = "unregistered";
    mocks.registration.GetMe.mockResolvedValue(null);
    mocks.registration.RegisterMe.mockResolvedValue(false);
    mocks.storage.clear();
    MockHTMLElement.input = new MockElement();
    MockHTMLElement.errorMessage = new MockElement();
  });

  it("prefills the nickname with the last one used", async () => {
    mocks.storage.set("board-game-sample.last-used-nickname", "last-player");
    const component = new BgsJoinComponent();
    component.connectedCallback?.();

    await vi.waitFor(() => {
      expect(MockHTMLElement.input.value).toBe("last-player");
    });
  });
});
