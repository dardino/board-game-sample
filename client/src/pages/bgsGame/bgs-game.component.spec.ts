import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  gameService: {
    Initialize: vi.fn(),
    ConnectToGame: vi.fn(),
    Disconnect: vi.fn(),
  },
  matchmakingService: {
    getGame: vi.fn(),
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
vi.mock("../../services/games/matchmaking.service", () => ({
  MatchMakingService: mocks.matchmakingService,
}));
vi.mock("../../routes/navigation", () => ({
  matchPath: mocks.matchPath,
  navigate: mocks.navigate,
}));

class MockButton {

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

  innerHTML = "";

  classList = { add: vi.fn() };

  #button = new MockButton();

  #dialog = { showModal: vi.fn() };

  #phase = { textContent: "" };

  constructor () {
    MockHTMLElement.button = this.#button;
  }

  querySelector (selector: string) {
    if (selector === "#cancelJoiningButton") return this.#button;
    if (selector === "#joining") return this.#dialog;
    if (selector === "#joiningDialogPhase") return this.#phase;
    return null;
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
    ({ BgsGameComponent } = await import("./bgs-game.component"));
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.gameService.ConnectToGame.mockResolvedValue(42);
    mocks.gameService.Disconnect.mockResolvedValue(undefined);
    mocks.matchmakingService.getGame.mockResolvedValue({
      gameId: 42,
      joinedPlayers: 1,
      playersMin: 2,
      playersMax: 4,
      title: "Test game",
    });
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
});
