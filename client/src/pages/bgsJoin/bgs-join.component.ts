import { PlayerDto } from "@dto/player.dto/player.dto";
import { BgsComponentTypeStatic } from "../../helpers/components";
import { navigate } from "../../routes/navigation";
import { Registration } from "../../services/registration/registration.service";
import { cookieparser } from "../../tools/cookieparser";
import template from "./bgs-join.template.html?raw";

export const BgsJoinComponent: BgsComponentTypeStatic = class BgsJoinComponent extends HTMLElement {

  public static readonly tagName = "bgs-join";

  public static register () {
    customElements.define(
      BgsJoinComponent.tagName,
      BgsJoinComponent,
    );
  }

  get #elNotRegistered () {
    return this.querySelector<HTMLDivElement>("#notRegistered")!;
  }

  get #elRegistered () {
    return this.querySelector<HTMLDivElement>("#registered")!;
  }

  get #elInput () {
    return this.querySelector<HTMLInputElement>("input")!;
  }

  get #elNickname () {
    return this.querySelector<HTMLSpanElement>("#nickname")!;
  }

  get #elRegisterForm () {
    return this.querySelector<HTMLFormElement>("#registerForm")!;
  }

  get #elLogout () {
    return this.querySelector<HTMLButtonElement>("#logout")!;
  }

  get #elErrorMessage () {
    return this.querySelector<HTMLSpanElement>("#errorMessage")!;
  }

  #cookie: Record<string, string> = {};

  #playerInfo: PlayerDto = { id: 0,
    isPlaying: false,
    nickname: "" };

  #errorMessages: string[] = [];

  /**
   * funzione che si occuperà di aggiornare gli elementi del DOM di questo componente basandosi sullo stato del componente
   */
  render () {
    if (Registration.instance.status === "registered") {
      this.#elNotRegistered.classList.add("hidden");
      this.#elRegistered.classList.remove("hidden");
    } else {
      this.#elNotRegistered.classList.remove("hidden");
      this.#elRegistered.classList.add("hidden");
    }

    this.#elInput.value = this.#playerInfo.nickname;
    this.#elNickname.innerHTML = this.#playerInfo.nickname;
    this.#elErrorMessage.innerHTML = this.#errorMessages.join("<br />");
  }

  // #region Component lyfecycle
  constructor () {
    super();
    this.innerHTML = template;
    this.style.display = "contents";
    this.#cookie = cookieparser();
    this.#playerInfo.nickname = this.#cookie["player.nickname"] ?? "";
  }

  connectedCallback () {
    this.#attachEvents();
    Registration.instance.GetMe().then((resp) => {
      if (!resp) return;
      this.#playerInfo = resp;
    });
  }

  disconnectedCallback () {
    this.#detachEvents();
  }
  // #endregion

  // #region events management
  #attachEvents () {
    this.#elRegisterForm.addEventListener(
      "submit",
      this.#submit,
    );
    this.#elLogout.addEventListener(
      "click",
      this.#clickLogout,
    );
  }

  #detachEvents () {
    this.#elRegisterForm.removeEventListener(
      "submit",
      this.#submit,
    );
    this.#elLogout.removeEventListener(
      "click",
      this.#clickLogout,
    );
  }

  #clickLogout = () => {
    Registration.instance.Unregister().finally(() => this.render());
  };

  #submit = (event: SubmitEvent) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    Registration.instance.RegisterMe(this.#elInput.value).then(() => {
      return Registration.instance.GetMe().then((resp) => {
        if (!resp) {
          this.#errorMessages = Registration.instance.Errors;
          this.render();
        } else {
          this.#playerInfo = resp;
          navigate("/");
        }
      });
    });
  };

  // #endregion


};
