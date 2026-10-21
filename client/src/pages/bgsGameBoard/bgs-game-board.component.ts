import { BgsComponentTypeStatic } from "../../helpers/components";
import { BgsGameTileComponent } from "./components/bgs-game-tile/bgs-game-tile.component";
import style from "./bgs-game-board.module.css";
import template from "./bgs-game-board.template.html?css-module";

export interface BgsGameBoardElement extends HTMLElement {
  setGameState (snapshot: unknown): void;
}

interface GameBoardTile {
  id: number;
}

function isRecord (value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isGameBoardTile (value: unknown): value is GameBoardTile {
  return isRecord(value) &&
    typeof value.id === "number" &&
    Number.isSafeInteger(value.id);
}

export const BgsGameBoardComponent: BgsComponentTypeStatic = class BgsGameBoardComponent extends HTMLElement {

  public static readonly tagName = "bgs-game-board";

  connectedCallback () {
    this.dispatchEvent(new CustomEvent("bgs-game-board-connected", {
      bubbles: true,
      composed: true,
    }));
  }

  constructor () {
    super();
    this.innerHTML = template;
    this.classList.add(style.boardPage);
  }

  public static register () {
    BgsGameTileComponent.register();
    customElements.define(
      BgsGameBoardComponent.tagName,
      BgsGameBoardComponent,
    );
  }

  setGameState (snapshot: unknown) {
    if (!isRecord(snapshot) || !Array.isArray(snapshot.onboardTiles) ||
      !snapshot.onboardTiles.every(isGameBoardTile)) {
      console.error("Unable to render game board: invalid onboardTiles snapshot.");
      return;
    }
    const tiles = this.querySelector<HTMLElement>("#gameTiles");
    if (!tiles) {
      console.error("Unable to render game board: tile container is missing.");
      return;
    }

    tiles.replaceChildren(...snapshot.onboardTiles.map(({ id }) => {
      const tile = document.createElement(BgsGameTileComponent.tagName);
      tile.dataset.tileId = String(id);
      tile.setAttribute("aria-label", `Game tile ${id}`);
      return tile;
    }));
  }

};
