import { BgsComponentTypeStatic } from "../../../../helpers/components";
import style from "./bgs-game-tile.module.css";
import template from "./bgs-game-tile.template.html?css-module";

export const BgsGameTileComponent: BgsComponentTypeStatic = class BgsGameTileComponent extends HTMLElement {

  public static readonly tagName = "bgs-game-tile";

  connectedCallback () {
    this.classList.add(style.tileHost);
    if (!this.hasChildNodes()) {
      this.innerHTML = template;
    }
  }

  public static register () {
    if (customElements.get(BgsGameTileComponent.tagName)) return;
    customElements.define(
      BgsGameTileComponent.tagName,
      BgsGameTileComponent,
    );
  }

};
