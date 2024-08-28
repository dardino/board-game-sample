import { PlayerDto } from "@dto/player.dto/player.dto";
import { ResponseError } from "../../api/baseProxy";
import { MeProxy } from "../../api/resources/me.proxy";

export class Registration {

  // #region service come SINGLETON
  static #instance: Registration | null;

  private static get instance () {
    if (Registration.#instance == null) Registration.#instance = new Registration();
    return Registration.#instance!;
  }
  // #endregion service come SINGLETON

  /**
   * Recupera le informazioni sul giocatore corrente, se non è caricato prova a caricarlo
   * @returns informazioni sul giocatore corrente o null se non è registrato
   */
  static async GetMe () {
    if (Registration.instance.#playerInfo.nickname === "") {
      await Registration.instance.#loadMe();
    }
    if (Registration.instance.#imRegistered) return Registration.instance.#playerInfo;
    else return null;
  }

  static get PlayerId () {
    return Registration.instance.#playerInfo.id;
  }

  static get NickName (): string {
    return Registration.instance.#playerInfo.nickname;
  }

  /**
   * Prova a registrarsi con un nick name, se riesce viene restituito `true`, altrimenti `false`
   * @param nickName nick name da utilizzare per la registrazione
   * @returns una `Promise` che si risolve con `true` se la registrazione va a buon fine, `false` altrimenti
   */
  static RegisterMe (nickName: string): Promise<boolean> {
    return Registration.instance.#registerMe(nickName);
  }

  /**
   * Prova a de-registrarsi dal gioco, se riesce viene restituito `true`, altrimenti `false`
   * @returns una `Promise` che si risolve con `true` se la cancellazione va a buon fine, `false` altrimenti
   */
  static async Unregister () {
    return Registration.instance.#deleteMe();
  }

  /**
   * Returns an array of error messages.
   * @returns An array of error messages.
   */
  static get Errors (): string[] {
    return Registration.instance.#errorMessages;
  }

  static get status () {
    if (Registration.instance.#errorMessages.length > 0) return "error";
    if (Registration.instance.#imRegistered) return "registered";
    return "unregistered";
  }


  // #region controller logics

  #playerInfo: PlayerDto = {
    id: 0,
    isPlaying: false,
    nickname: "",
  };

  #imRegistered = false;

  #errorMessages: string[] = [];

  private constructor () {
    this.#loadMe();
  }

  /**
   * Loads the user's information asynchronously.
   * If the user is found, sets the #imRegistered flag to true and assigns the response to #playerInfo.
   * If the user is not found, sets the #imRegistered flag to false.
   * If an error occurs, logs the error to the console.
   */
  async #loadMe (): Promise<boolean> {
    this.#errorMessages = [];
    try {
      const resp = await MeProxy.getMe();
      this.#imRegistered = true;
      this.#playerInfo = resp!;
      return true;
    } catch (err) {
      if (err instanceof ResponseError && err.status === 404) {
        // utente non trovato
        this.#imRegistered = false;
        this.#errorMessages = [err.body.message];
      } else {
        console.error(err);
      }
      return false;
    }
  }

  async #registerMe (nickName: string): Promise<boolean> {
    this.#errorMessages = [];
    try {
      const resp = await MeProxy.registerMe(nickName);
      this.#imRegistered = true;
      this.#playerInfo = resp;
      return true;
    } catch (err) {
      if (err instanceof ResponseError && err.status === 400) {
        // esiste già:
        this.#imRegistered = false;
        this.#errorMessages = [err.body.message];
      } else {
        console.error(err);
      }
      return false;
    }
  }

  async #deleteMe () {
    this.#imRegistered = false;
    try {
      await MeProxy.deleteMe();
      this.#imRegistered = false;
      this.#playerInfo = { id: 0, isPlaying: false, nickname: "" };
      return true;
    } catch (err) {
      if (err instanceof ResponseError && err.status === 400) {
        this.#errorMessages = [err.body.message];
      } else {
        console.error(err);
      }
      return false;
    }
  }
  // #endregion

}
