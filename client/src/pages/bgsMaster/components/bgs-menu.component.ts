import { BgsComponentTypeStatic } from "../../../helpers/components";
import { Registration } from "../../../services/registration/registration.service";
import style from "./bgs-menu.module.css";
import template from "./bgs-menu.template.html?raw";

export const BgsMenuComponent: BgsComponentTypeStatic = class BgsMenuComponent extends HTMLElement {

  public static readonly tagName = "bgs-menu";

  #unsubscribeRegistrationChanges: (() => void) | null = null;

  #renderRequest = 0;

  public static register () {
    customElements.define(
      BgsMenuComponent.tagName,
      BgsMenuComponent,
    );
  }

  constructor () {
    super();
    this.innerHTML = template;
    this.style.display = "contents";
    this.#nav.classList.add(style.nav);
    this.render();
  }

  connectedCallback () {
    this.#unsubscribeRegistrationChanges = Registration.SubscribeToChanges(() => {
      void this.render();
    });
  }

  disconnectedCallback () {
    this.#unsubscribeRegistrationChanges?.();
    this.#unsubscribeRegistrationChanges = null;
  }

  async render () {
    const renderRequest = ++this.#renderRequest;
    const userInfo = await Registration.GetMe();
    if (renderRequest !== this.#renderRequest) return;
    [
      this.#linkLogout,
      this.#gameList,
    ].forEach((el) => el.classList.toggle(
      "hidden",
      userInfo === null,
    ));

    [this.#linkJoin].forEach((el) => el.classList.toggle(
      "hidden",
      userInfo !== null,
    ));

    this.#user.textContent = userInfo?.nickname ?? "";
  }


  get #nav () {
    return this.querySelector<HTMLElement>("#nav")!;
  }

  get #linkJoin () {
    return this.querySelector<HTMLLIElement>("#join")!;
  }

  get #linkLogout () {
    return this.querySelector<HTMLLIElement>("#logout")!;
  }

  get #gameList () {
    return this.querySelector<HTMLLIElement>("#gamelist")!;
  }

  get #user () {
    return this.querySelector<HTMLLIElement>("#user")!;
  }


};
