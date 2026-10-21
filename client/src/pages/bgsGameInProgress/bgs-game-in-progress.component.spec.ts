import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  getMe: vi.fn(async () => ({
    id: 1,
    isPlaying: true,
    nickname: "player-one",
  })),
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
    GetMe: mocks.getMe,
    PlayerId: 1,
    status: "registered",
    Errors: [],
  },
}));

vi.mock("./bgs-game-in-progress.module.css", () => ({
  default: {
    game: "game",
    gameLayoutWithSidebar: "gameLayoutWithSidebar",
  },
}));

vi.mock("./bgs-game-in-progress.template.html?css-module", () => ({
  default: "",
}));

vi.mock("./components/bgs-game-chat/bgs-game-chat.module.css", () => ({
  default: {
    chat: "chat",
  },
}));

vi.mock("./components/bgs-game-chat/bgs-game-chat.template.html?css-module", () => ({
  default: "",
}));

vi.mock("./components/bgs-game-sidebar/bgs-game-sidebar.module.css", () => ({
  default: {
    sidebarHost: "sidebarHost",
  },
}));

class MockHTMLElement {

  static current: MockHTMLElement | null = null;

  innerHTML = "";

  classList = { add: vi.fn() };

  connectionStatus = { textContent: "" };

  #listeners = new Map<string, EventListenerOrEventListenerObject>();

  addEventListener (type: string, listener: EventListenerOrEventListenerObject) {
    this.#listeners.set(type, listener);
  }

  removeEventListener (type: string) {
    this.#listeners.delete(type);
  }

  dispatchEvent (event: Event) {
    const listener = this.#listeners.get(event.type);
    if (typeof listener === "function") listener(event);
    else listener?.handleEvent(event);
    return true;
  }

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
    vi.stubGlobal("crypto", {
      randomUUID: () => "chat-request-1",
    });
    ({ BgsGameInProgressComponent } = await import("./bgs-game-in-progress.component"));
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    MockWebSocket.instances = [];
    mocks.getMe.mockResolvedValue({
      id: 1,
      isPlaying: true,
      nickname: "player-one",
    });
  });

  async function connectComponent () {
    const component = new BgsGameInProgressComponent();
    component.connectedCallback?.();
    await vi.waitFor(() => {
      expect(MockWebSocket.instances).toHaveLength(1);
    });
    const socket = MockWebSocket.instances[0];
    if (!socket) throw new Error("The game socket was not created.");
    return { component, socket };
  }

  it("returns to the games list when the server reports a removed game", async () => {
    const { socket } = await connectComponent();

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

  it("keeps the current page for other game errors", async () => {
    const { socket } = await connectComponent();

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

  it("returns to the games list when the socket disconnects", async () => {
    const { socket } = await connectComponent();

    socket.emit("close", new Event("close"));

    expect(mocks.navigate).toHaveBeenCalledWith("/games");
  });

  it("does not redirect when the component closes its socket during navigation", async () => {
    const { component, socket } = await connectComponent();

    component.disconnectedCallback?.();
    socket.emit("close", new Event("close"));

    expect(mocks.navigate).not.toHaveBeenCalled();
  });

  it("sends chat messages through the subscribed game socket", async () => {
    const { component, socket } = await connectComponent();
    socket.emit("open", new Event("open"));

    component.dispatchEvent(new CustomEvent("game-chat-send", {
      detail: {
        message: "Hello party!",
      },
    }));

    expect(socket.sentMessages.map((message) => JSON.parse(message))).toContainEqual({
      type: "chat-message",
      requestId: "chat-request-1",
      gameId: 42,
      message: "Hello party!",
    });
  });

  it("uses the player identity loaded for this browser when subscribing to the game", async () => {
    mocks.getMe.mockResolvedValue({
      id: 42,
      isPlaying: true,
      nickname: "player-two",
    });
    const { socket } = await connectComponent();

    socket.emit("open", new Event("open"));

    expect(socket.sentMessages.map((message) => JSON.parse(message))).toContainEqual({
      type: "subscribe",
      gameId: 42,
      playerId: 42,
    });
  });
});
