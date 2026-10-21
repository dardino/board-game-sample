import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("./bgs-game-tile.module.css", () => ({
  default: {
    tileHost: "tileHost",
  },
}));

vi.mock("./bgs-game-tile.template.html?css-module", () => ({
  default: "<div class=\"tileSurface\" role=\"img\" aria-label=\"Game tile\"></div>",
}));

class MockHTMLElement {

  innerHTML = "";

  classList = {
    add: vi.fn(),
  };

  hasChildNodes () {
    return this.innerHTML.length > 0;
  }

}

describe("BgsGameTileComponent", () => {
  let BgsGameTileComponent: typeof import("./bgs-game-tile.component").BgsGameTileComponent;

  beforeAll(async () => {
    vi.stubGlobal("HTMLElement", MockHTMLElement);
    ({ BgsGameTileComponent } = await import("./bgs-game-tile.component"));
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  it("initializes its template and host class when connected", () => {
    const tile = new BgsGameTileComponent();

    expect(tile.innerHTML).toBe("");
    expect(tile.classList.add).not.toHaveBeenCalled();

    tile.connectedCallback?.();

    expect(tile.innerHTML).toContain("tileSurface");
    expect(tile.classList.add).toHaveBeenCalledWith("tileHost");
  });
});
