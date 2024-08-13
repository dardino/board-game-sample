import { PlayerDto } from "@dto/player.dto/player.dto";
import { ResponseError } from "../../api/baseController";
import { MeController } from "../../api/resources/me.controller";
import { cookieparser } from "../../tools/cookieparser";
import template from "./bgs-join.template.html?raw";

export class BgsJoinComponent extends HTMLElement {

  public static readonly tagName = "bgs-join";

  public static register () {

    customElements.define(
      BgsJoinComponent.tagName,
      BgsJoinComponent
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

  #imRegistered = false;

  #playerInfo: PlayerDto = { id: 0,
    isPlaying: false,
    nickname: "" };

  #errorMessages: string[] = [];

  /**
   * funzione che si occuperà di aggiornare gli elementi del DOM di questo componente basandosi sullo stato del componente
   */
  render () {

    if (this.#imRegistered) {

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
    this.#cookie = cookieparser();
    this.#playerInfo.nickname = this.#cookie["player.nickname"] ?? "";

  }

  connectedCallback () {

    this.#attachEvents();
    if (this.#playerInfo.nickname != "") {

      this.#loadMe().finally(() => this.render());

    }

  }

  disconnectedCallback () {

    this.#detachEvents();

  }
  // #endregion

  // #region events management
  #attachEvents () {

    this.#elRegisterForm.addEventListener(
      "submit",
      this.#submit
    );
    this.#elLogout.addEventListener(
      "click",
      this.#clickLogout
    );

  }

  #detachEvents () {

    this.#elRegisterForm.removeEventListener(
      "submit",
      this.#submit
    );
    this.#elLogout.removeEventListener(
      "click",
      this.#clickLogout
    );

  }

  #clickLogout = () => {

    this.#deleteMe().finally(() => this.render());

  };

  #submit = (event: SubmitEvent) => {

    event.preventDefault();
    event.stopImmediatePropagation();

    this.#registerMe().finally(() => this.render());

  };
    // #endregion

  // #region controller logics
  /**
   * Loads the user's information asynchronously.
   * If the user is found, sets the #imRegistered flag to true and assigns the response to #playerInfo.
   * If the user is not found, sets the #imRegistered flag to false.
   * If an error occurs, logs the error to the console.
   */
  async #loadMe () {

    this.#errorMessages = [];
    try {

      const resp = await MeController.getMe();
      this.#imRegistered = true;
      this.#playerInfo = resp!;

    } catch (err) {

      if (err instanceof ResponseError && err.status === 404) {

        // utente non trovato
        this.#imRegistered = false;
        this.#errorMessages = [err.body.message];

      } else {

        console.error(err);

      }

    }

  }

  async #registerMe () {

    const nickName = this.#elInput.value;
    this.#errorMessages = [];
    try {

      const resp = await MeController.registerMe(nickName);
      this.#imRegistered = true;
      this.#playerInfo = resp;

    } catch (err) {

      if (err instanceof ResponseError && err.status === 400) {

        // esiste già:
        this.#imRegistered = false;
        this.#errorMessages = [err.body.message];

      } else {

        console.error(err);

      }

    }

  }

  async #deleteMe () {

    this.#imRegistered = false;
    try {

      await MeController.deleteMe();

    } catch (err) {

      console.error(err);

    }

  }
  // #endregion

}
