import { BgsComponentTypeStatic } from "../../helpers/components";
import style from "./bgs-game.module.css";
import template from "./bgs-game.template.html?raw";

export const BgsGameComponent: BgsComponentTypeStatic = class BgsGameComponent extends HTMLElement {

  public static readonly tagName = "bgs-game";

  public static register () {
    customElements.define(
      BgsGameComponent.tagName,
      BgsGameComponent,
    );
  }

  constructor () {
    super();
    this.innerHTML = template;
    this.classList.add(style.game);
    this.render();

    this.#joiningDialog.showModal();
  }

  get #joiningDialog () {
    return this.querySelector("#joining") as HTMLDialogElement;
  }


  async render () {
    //
  }

};
