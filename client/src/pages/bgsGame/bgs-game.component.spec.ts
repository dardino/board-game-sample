import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  gameService: {
    Initialize: vi.fn(),
    ConnectToGame: vi.fn(),
    Disconnect: vi.fn(),
    StartGame: vi.fn(),
    GameId: 42,
  },
  registration: {
    NickName: "creator",
  },
  navigate: vi.fn(),
  matchPath: vi.fn(() => ({
    params: {
      id: "42",
    },
  })),
}));

vi.mock("../../services/game/game.service", () => ({
  GameService: mocks.gameService,
}));
vi.mock("../../routes/navigation", () => ({
  matchPath: mocks.matchPath,
  navigate: mocks.navigate,
}));
vi.mock("../../services/registration/registration.service", () => ({
  Registration: mocks.registration,
}));

class MockButton {

  disabled = false;

  hidden = false;

  #clickHandler: EventListener | null = null;

  addEventListener (_type: string, listener: EventListenerOrEventListenerObject) {
    this.#clickHandler = typeof listener === "function"
      ? listener
      : (event) => listener.handleEvent(event);
  }

  removeEventListener () {
    this.#clickHandler = null;
  }

  click () {
    this.#clickHandler?.call(this, new Event("click"));
  }

}

class MockHTMLElement {

  static button: MockButton;

  static startButton: MockButton;

  static phase: { textContent: string };

  static playerList: { replaceChildren: ReturnType<typeof vi.fn> };

  innerHTML = "";

  classList = { add: vi.fn() };

  #button = new MockButton();

  #startButton = new MockButton();

  #dialog = { showModal: vi.fn() };

  #phase = { textContent: "" };

  #playerList = { replaceChildren: vi.fn() };

  constructor () {
    MockHTMLElement.button = this.#button;
    MockHTMLElement.startButton = this.#startButton;
    MockHTMLElement.phase = this.#phase;
    MockHTMLElement.playerList = this.#playerList;
  }

  querySelector (selector: string) {
    if (selector === "#cancelJoiningButton") return this.#button;
    if (selector === "#startGameButton") return this.#startButton;
    if (selector === "#joining") return this.#dialog;
    if (selector === "#joiningDialogPhase") return this.#phase;
    if (selector === "#joinedPlayersList") return this.#playerList;
    return null;
  }

}

class MockEventSource {

  static instances: MockEventSource[] = [];

  onmessage: ((event: MessageEvent<string>) => void) | null = null;

  onerror: ((event: Event) => void) | null = null;

  close = vi.fn();

  constructor (public readonly url: string) {
    MockEventSource.instances.push(this);
  }

  emit (data: unknown) {
    this.onmessage?.({ data: JSON.stringify(data) } as MessageEvent<string>);
  }

}

describe("BgsGameComponent", () => {
  let BgsGameComponent: typeof import("./bgs-game.component").BgsGameComponent;

  beforeAll(async () => {
    vi.stubGlobal("HTMLElement", MockHTMLElement);
    vi.stubGlobal("window", {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    vi.stubGlobal("location", { pathname: "/game/42" });
    vi.stubGlobal("EventSource", MockEventSource);
    vi.stubGlobal("document", {
      createElement: vi.fn(() => ({ textContent: "" })),
    });
    ({ BgsGameComponent } = await import("./bgs-game.component"));
  });

  beforeEach(() => {
    vi.clearAllMocks();
    MockEventSource.instances = [];
    mocks.gameService.ConnectToGame.mockResolvedValue(42);
    mocks.gameService.Disconnect.mockResolvedValue(undefined);
    mocks.gameService.StartGame.mockResolvedValue(undefined);
    mocks.registration.NickName = "creator";
  });

  it("leaves the game and navigates to the list when cancel is clicked", async () => {
    const component = new BgsGameComponent();
    component.connectedCallback?.();

    MockHTMLElement.button.click();

    await vi.waitFor(() => {
      expect(mocks.gameService.Disconnect).toHaveBeenCalledWith(false);
      expect(mocks.navigate).toHaveBeenCalledWith("/games");
    });
  });

  it("updates the waiting modal when the server reports a lobby change", async () => {
    const component = new BgsGameComponent();
    component.connectedCallback?.();

    await vi.waitFor(() => expect(MockEventSource.instances).toHaveLength(1));
    MockEventSource.instances[0].emit({
      type: "game-updated",
      game: {
        gameId: 42,
        createdBy: "creator",
        playersMax: 4,
        playersMin: 2,
        joinedPlayers: 2,
        players: ["creator", "guest"],
        elapsed: null,
        title: "Test game",
      },
    });

    expect(MockHTMLElement.phase.textContent).toBe("Waiting for other players... (2/2-4)");
    expect(MockHTMLElement.playerList.replaceChildren).toHaveBeenCalledTimes(1);
    expect(MockHTMLElement.playerList.replaceChildren.mock.calls[0][0]).toMatchObject({
      textContent: "creator",
    });
    expect(MockHTMLElement.startButton.hidden).toBe(false);
    expect(MockHTMLElement.startButton.disabled).toBe(false);
    MockHTMLElement.startButton.click();
    await vi.waitFor(() => {
      expect(mocks.gameService.StartGame).toHaveBeenCalledOnce();
    });
  });

  it("keeps the start button disabled until the minimum players join", async () => {
    const component = new BgsGameComponent();
    component.connectedCallback?.();
    await vi.waitFor(() => expect(MockEventSource.instances).toHaveLength(1));

    MockEventSource.instances[0].emit({
      type: "game-updated",
      game: {
        gameId: 42,
        createdBy: "creator",
        playersMax: 4,
        playersMin: 2,
        joinedPlayers: 1,
        players: ["creator"],
        elapsed: null,
        title: "Test game",
      },
    });

    expect(MockHTMLElement.startButton.hidden).toBe(false);
    expect(MockHTMLElement.startButton.disabled).toBe(true);
  });

  it("does not show the start button to a non-owner", async () => {
    mocks.registration.NickName = "guest";
    const component = new BgsGameComponent();
    component.connectedCallback?.();
    await vi.waitFor(() => expect(MockEventSource.instances).toHaveLength(1));

    MockEventSource.instances[0].emit({
      type: "game-updated",
      game: {
        gameId: 42,
        createdBy: "creator",
        playersMax: 4,
        playersMin: 2,
        joinedPlayers: 2,
        players: ["creator", "guest"],
        elapsed: null,
        title: "Test game",
      },
    });

    expect(MockHTMLElement.startButton.hidden).toBe(true);
    expect(MockHTMLElement.startButton.disabled).toBe(false);
  });

  it("navigates to the in-progress page when the server starts the game", async () => {
    const component = new BgsGameComponent();
    component.connectedCallback?.();
    await vi.waitFor(() => expect(MockEventSource.instances).toHaveLength(1));

    MockEventSource.instances[0].emit({
      type: "game-updated",
      game: {
        gameId: 42,
        createdBy: "creator",
        playersMax: 4,
        playersMin: 2,
        joinedPlayers: 2,
        players: ["creator", "guest"],
        elapsed: 1,
        title: "Test game",
      },
    });

    expect(mocks.navigate).toHaveBeenCalledWith(
      "/game/:id/in-progress",
      { id: "42" },
    );
    component.disconnectedCallback?.();
    expect(mocks.gameService.Disconnect).not.toHaveBeenCalled();
  });
});
