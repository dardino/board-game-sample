import { BgsComponentTypeStatic } from "../../helpers/components";
import style from "./bgs-game-board.module.css";
import template from "./bgs-game-board.template.html?css-module";

export const BgsGameBoardComponent: BgsComponentTypeStatic = class BgsGameBoardComponent extends HTMLElement {

  public static readonly tagName = "bgs-game-board";

  constructor () {
    super();
    this.innerHTML = template;
    this.classList.add(style.boardPage);
  }

  public static register () {
    customElements.define(
      BgsGameBoardComponent.tagName,
      BgsGameBoardComponent,
    );
  }

};
