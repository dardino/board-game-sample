import { BgsComponentTypeStatic } from "../../helpers/components";
import template from "./bgs-master.template.html?raw";
import { BgsMenuComponent } from "./components/bgs-menu.component";

export const BgsMasterComponent: BgsComponentTypeStatic = class BgsMasterComponent extends HTMLElement {

  public static readonly tagName = "bgs-master";

  public static register () {
    customElements.define(
      BgsMasterComponent.tagName,
      BgsMasterComponent,
    );
    BgsMenuComponent.register();
  }

  constructor () {
    super();
    this.innerHTML = template;
    this.style.display = "contents";
  }

};
