import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  matchPath: vi.fn(() => ({
    params: {
      id: "42",
    },
  })),
}));

vi.mock("../../routes/navigation", () => ({
  matchPath: mocks.matchPath,
  navigate: mocks.navigate,
}));

vi.mock("../../services/registration/registration.service", () => ({
  Registration: {
    PlayerId: 1,
  },
}));

vi.mock("./bgs-game-in-progress.module.css", () => ({
  default: {
    game: "game",
  },
}));

vi.mock("./bgs-game-in-progress.template.html?css-module", () => ({
  default: "",
}));

class MockHTMLElement {

  static current: MockHTMLElement | null = null;

  innerHTML = "";

  classList = { add: vi.fn() };

  connectionStatus = { textContent: "" };

  constructor () {
    MockHTMLElement.current = this;
  }

  querySelector (selector: string) {
    return selector === "#connectionStatus"
      ? this.connectionStatus
      : null;
  }

}

class MockWebSocket {

  static readonly OPEN = 1;

  static instances: MockWebSocket[] = [];

  readonly listeners = new Map<string, EventListener[]>();

  readonly url: URL;

  readyState = MockWebSocket.OPEN;

  sentMessages: string[] = [];

  constructor (url: URL) {
    this.url = url;
    MockWebSocket.instances.push(this);
  }

  addEventListener (type: string, listener: EventListener) {
    const listeners = this.listeners.get(type) ?? [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }

  send (message: string) {
    this.sentMessages.push(message);
  }

  close () {
    this.readyState = 3;
  }

  emit (type: string, event: Event) {
    for (const listener of this.listeners.get(type) ?? []) listener(event);
  }

}

describe("BgsGameInProgressComponent", () => {
  let BgsGameInProgressComponent: typeof import("./bgs-game-in-progress.component").BgsGameInProgressComponent;

  beforeAll(async () => {
    vi.stubGlobal("HTMLElement", MockHTMLElement);
    vi.stubGlobal("WebSocket", MockWebSocket);
    vi.stubGlobal("location", {
      href: "http://localhost/game/42/in-progress",
      pathname: "/game/42/in-progress",
    });
    ({ BgsGameInProgressComponent } = await import("./bgs-game-in-progress.component"));
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    MockWebSocket.instances = [];
  });

  it("returns to the games list when the server reports a removed game", () => {
    const component = new BgsGameInProgressComponent();
    component.connectedCallback?.();
    const socket = MockWebSocket.instances[0];
    if (!socket) throw new Error("The game socket was not created.");

    socket.emit("message", new MessageEvent("message", {
      data: JSON.stringify({
        type: "game-error",
        gameId: 42,
        code: "GAME_NOT_FOUND",
        message: "The game is no longer available.",
      }),
    }));

    expect(mocks.navigate).toHaveBeenCalledWith("/games");
  });

  it("keeps the current page for other game errors", () => {
    const component = new BgsGameInProgressComponent();
    component.connectedCallback?.();
    const socket = MockWebSocket.instances[0];
    if (!socket) throw new Error("The game socket was not created.");

    socket.emit("message", new MessageEvent("message", {
      data: JSON.stringify({
        type: "game-error",
        gameId: 42,
        message: "Invalid WebSocket message.",
      }),
    }));

    expect(mocks.navigate).not.toHaveBeenCalled();
    expect(MockHTMLElement.current?.connectionStatus.textContent).toBe("Invalid WebSocket message.");
  });

  it("returns to the games list when the socket disconnects", () => {
    const component = new BgsGameInProgressComponent();
    component.connectedCallback?.();
    const socket = MockWebSocket.instances[0];
    if (!socket) throw new Error("The game socket was not created.");

    socket.emit("close", new Event("close"));

    expect(mocks.navigate).toHaveBeenCalledWith("/games");
  });

  it("does not redirect when the component closes its socket during navigation", () => {
    const component = new BgsGameInProgressComponent();
    component.connectedCallback?.();
    const socket = MockWebSocket.instances[0];
    if (!socket) throw new Error("The game socket was not created.");

    component.disconnectedCallback?.();
    socket.emit("close", new Event("close"));

    expect(mocks.navigate).not.toHaveBeenCalled();
  });
});
