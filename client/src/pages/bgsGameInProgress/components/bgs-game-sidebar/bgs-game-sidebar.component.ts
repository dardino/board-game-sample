import { BgsComponentTypeStatic } from "../../../../helpers/components";
import style from "./bgs-game-sidebar.module.css";

export const BgsGameSidebarComponent: BgsComponentTypeStatic = class BgsGameSidebarComponent extends HTMLElement {

  public static readonly tagName = "bgs-game-sidebar";

  constructor () {
    super();
    this.classList.add(style.sidebarHost);
    this.setAttribute("role", "complementary");
    this.setAttribute("aria-label", "Game information");
  }

  public static register () {
    customElements.define(
      BgsGameSidebarComponent.tagName,
      BgsGameSidebarComponent,
    );
  }

};
