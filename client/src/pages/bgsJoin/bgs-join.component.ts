import { PlayerDto } from "@dto/player.dto/player.dto";
import { BgsComponentTypeStatic } from "../../helpers/components";
import { navigate } from "../../routes/navigation";
import { Registration } from "../../services/registration/registration.service";
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

  #playerInfo: PlayerDto = { id: 0,
    isPlaying: false,
    nickname: "" };

  #errorMessages: string[] = [];

  /**
   * funzione che si occuperà di aggiornare gli elementi del DOM di questo componente basandosi sullo stato del componente
   */
  render () {
    if (Registration.status === "registered") {
      this.#elNotRegistered.classList.add("hidden");
      this.#elRegistered.classList.remove("hidden");
    } else {
      this.#elNotRegistered.classList.remove("hidden");
      this.#elRegistered.classList.add("hidden");
    }

    this.#elInput.value = this.#playerInfo.nickname;
    this.#elNickname.textContent = this.#playerInfo.nickname;
    this.#elErrorMessage.textContent = this.#errorMessages.join("\n");
  }

  // #region Component lyfecycle
  constructor () {
    super();
    this.innerHTML = template;
    this.style.display = "contents";
  }

  connectedCallback () {
    this.#attachEvents();
    Registration.GetMe().then((resp) => {
      if (resp) this.#playerInfo = resp;
      this.#errorMessages = Registration.Errors;
      this.render();
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

  #clickLogout = async () => {
    const unregistered = await Registration.Unregister();
    this.#errorMessages = Registration.Errors;
    if (unregistered) {
      this.#playerInfo = { id: 0,
        isPlaying: false,
        nickname: "" };
    }
    this.render();
  };

  #submit = async (event: SubmitEvent) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    const registered = await Registration.RegisterMe(this.#elInput.value);
    if (!registered) {
      this.#errorMessages = Registration.Errors;
      this.render();
      return;
    }

    const player = await Registration.GetMe();
    if (!player) {
      this.#errorMessages = Registration.Errors;
      this.render();
      return;
    }
    this.#playerInfo = player;
    navigate("/");
  };

  // #endregion


};
