import { BgsComponentTypeStatic } from "../../helpers/components";
import template from "./bgs-master.template.html?raw";

export const BgsMasterComponent: BgsComponentTypeStatic = class BgsMasterComponent extends HTMLElement {

  public static readonly tagName = "bgs-master";

  public static register () {
    customElements.define(
      BgsMasterComponent.tagName,
      BgsMasterComponent,
    );
  }

  constructor () {
    super();
    this.innerHTML = template;
    this.style.display = "contents";
  }

};
