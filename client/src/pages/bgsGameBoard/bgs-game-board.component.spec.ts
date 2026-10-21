import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createElement: vi.fn(),
  registerTile: vi.fn(),
}));

vi.mock("./bgs-game-board.module.css", () => ({
  default: {
    boardPage: "boardPage",
  },
}));

vi.mock("./bgs-game-board.template.html?css-module", () => ({
  default: "",
}));

vi.mock("./components/bgs-game-tile/bgs-game-tile.module.css", () => ({
  default: {
    tileHost: "tileHost",
  },
}));

vi.mock("./components/bgs-game-tile/bgs-game-tile.template.html?css-module", () => ({
  default: "",
}));

vi.mock("./components/bgs-game-tile/bgs-game-tile.component", () => ({
  BgsGameTileComponent: {
    tagName: "bgs-game-tile",
    register: mocks.registerTile,
  },
}));

class MockTileElement {

  attributes = new Map<string, string>();

  dataset: Record<string, string> = {};

  setAttribute (name: string, value: string) {
    this.attributes.set(name, value);
  }

}

class MockHTMLElement {

  static tileContainer = {
    replaceChildren: vi.fn(),
  };

  innerHTML = "";

  classList = {
    add: vi.fn(),
  };

  querySelector (selector: string) {
    return selector === "#gameTiles"
      ? MockHTMLElement.tileContainer
      : null;
  }

}

describe("BgsGameBoardComponent", () => {
  let BgsGameBoardComponent: typeof import("./bgs-game-board.component").BgsGameBoardComponent;

  beforeAll(async () => {
    vi.stubGlobal("HTMLElement", MockHTMLElement);
    mocks.createElement.mockImplementation(() => new MockTileElement());
    vi.stubGlobal("document", {
      createElement: mocks.createElement,
    });
    vi.stubGlobal("customElements", {
      define: vi.fn(),
      get: vi.fn(() => undefined),
    });
    ({ BgsGameBoardComponent } = await import("./bgs-game-board.component"));
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders one tile component for every tile in the latest snapshot", () => {
    const board = new BgsGameBoardComponent();
    const setGameState = Reflect.get(board, "setGameState");
    const snapshot = {
      onboardTiles: [
        { id: 11,
          x: 0,
          y: 0,
          orientation: 0 },
        { id: 22,
          x: 1,
          y: 0,
          orientation: 3 },
      ],
    };

    if (typeof setGameState === "function") setGameState.call(board, snapshot);

    expect(mocks.createElement).toHaveBeenCalledTimes(2);
    expect(MockHTMLElement.tileContainer.replaceChildren).toHaveBeenCalledOnce();
    expect(MockHTMLElement.tileContainer.replaceChildren.mock.calls[0]).toHaveLength(2);
  });

  it("registers the tile custom element before registering the board", () => {
    const define = vi.fn();
    vi.stubGlobal("customElements", {
      define,
      get: vi.fn(() => undefined),
    });

    BgsGameBoardComponent.register();

    expect(mocks.registerTile).toHaveBeenCalledOnce();
    expect(define).toHaveBeenCalledWith("bgs-game-board", BgsGameBoardComponent);
    expect(mocks.registerTile.mock.invocationCallOrder[0]).toBeLessThan(
      define.mock.invocationCallOrder[0]!,
    );
  });
});
