import { BgsComponentTypeStatic } from "../../helpers/components";
import style from "./bgs-landing.module.css";
import template from "./bgs-landing.template.html?raw";

export const BgsLandingComponent: BgsComponentTypeStatic = class BgsLandingComponent extends HTMLElement {

  public static readonly tagName = "bgs-landing";

  public static register () {

    customElements.define(
      BgsLandingComponent.tagName,
      BgsLandingComponent,
    );

  }

  constructor () {

    super();
    this.innerHTML = template;
    this.classList.add(style.landing);

  }

};
