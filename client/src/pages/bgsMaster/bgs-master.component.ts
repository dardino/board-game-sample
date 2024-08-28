import { BgsComponentTypeStatic } from "../../helpers/components";
import { Registration } from "../../services/registration/registration.service";
import template from "./bgs-master.template.html?raw";

export const BgsMasterComponent: BgsComponentTypeStatic = class BgsMasterComponent extends HTMLElement {

  public static readonly tagName = "bgs-master";

  get #linkJoin () {
    return this.querySelector<HTMLLIElement>("#join")!;
  }

  get #linkLogout () {
    return this.querySelector<HTMLLIElement>("#logout")!;
  }

  get #user () {
    return this.querySelector<HTMLLIElement>("#user")!;
  }

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
    this.render();
  }

  async render () {
    const userInfo = await Registration.instance.GetMe();
    this.#linkLogout.classList.toggle("hidden", userInfo === null);
    this.#linkJoin.classList.toggle("hidden", userInfo !== null);
    this.#user.innerHTML = userInfo?.nickname ?? "";
  }

};
