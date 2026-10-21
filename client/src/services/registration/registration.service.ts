import { PlayerDto } from "@dto/player.dto/player.dto";
import { ResponseError } from "../../api/baseProxy";
import { MeProxy } from "../../api/resources/me.proxy";

function getErrorMessage (error: ResponseError): string {
  const detail = error.body.detail;
  if (
    detail &&
    typeof detail === "object" &&
    "message" in detail &&
    typeof detail.message === "string"
  ) {
    return detail.message;
  }
  return error.body.message ?? error.statusText;
}

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
    if (!Registration.instance.#hasLoaded) {
      await Registration.instance.#loadMe();
    }
    if (Registration.instance.#imRegistered) return Registration.instance.#playerInfo;
    else return null;
  }

  static SubscribeToChanges (listener: () => void) {
    Registration.instance.#changeListeners.add(listener);
    return () => Registration.instance.#changeListeners.delete(listener);
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
  static async RegisterMe (nickName: string): Promise<boolean> {
    const registered = await Registration.instance.#registerMe(nickName);
    if (registered) Registration.instance.#notifyStateChanged();
    return registered;
  }

  /**
   * Prova a de-registrarsi dal gioco, se riesce viene restituito `true`, altrimenti `false`
   * @returns una `Promise` che si risolve con `true` se la cancellazione va a buon fine, `false` altrimenti
   */
  static async Unregister () {
    const unregistered = await Registration.instance.#deleteMe();
    if (unregistered) Registration.instance.#notifyStateChanged();
    return unregistered;
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

  #hasLoaded: boolean;

  #loadPromise: Promise<boolean> | null = null;

  #errorMessages: string[] = [];

  #changeListeners = new Set<() => void>();

  private constructor () {
    this.#hasLoaded = false;
  }

  /**
   * Loads the user's information asynchronously.
   * If the user is found, sets the #imRegistered flag to true and assigns the response to #playerInfo.
   * If the user is not found, sets the #imRegistered flag to false.
   * If an error occurs, logs the error to the console.
   */
  async #loadMe (): Promise<boolean> {
    if (this.#loadPromise) return this.#loadPromise;
    this.#loadPromise = this.#fetchMe();
    try {
      return await this.#loadPromise;
    } finally {
      this.#loadPromise = null;
    }
  }

  async #fetchMe (): Promise<boolean> {
    this.#errorMessages = [];
    try {
      const resp = await MeProxy.getMe();
      this.#imRegistered = true;
      this.#hasLoaded = true;
      this.#playerInfo = resp!;
      return true;
    } catch (err) {
      if (err instanceof ResponseError && err.status === 404) {
        this.#imRegistered = false;
        this.#hasLoaded = true;
        this.#errorMessages = [];
      } else if (err instanceof ResponseError) {
        this.#imRegistered = false;
        this.#hasLoaded = false;
        this.#errorMessages = [getErrorMessage(err)];
      } else {
        console.error(err);
        this.#hasLoaded = false;
        this.#errorMessages = ["Impossibile verificare la registrazione."];
      }
      return false;
    }
  }

  async #registerMe (nickName: string): Promise<boolean> {
    if (this.#loadPromise) await this.#loadPromise;
    this.#errorMessages = [];
    try {
      const resp = await MeProxy.registerMe(nickName.trim());
      this.#imRegistered = true;
      this.#hasLoaded = true;
      this.#playerInfo = resp;
      return true;
    } catch (err) {
      if (err instanceof ResponseError && err.status === 400) {
        this.#imRegistered = false;
        this.#hasLoaded = false;
        this.#errorMessages = [getErrorMessage(err)];
      } else {
        console.error(err);
        this.#errorMessages = ["Impossibile completare la registrazione."];
      }
      return false;
    }
  }

  async #deleteMe () {
    try {
      await MeProxy.deleteMe();
      this.#imRegistered = false;
      this.#hasLoaded = true;
      this.#errorMessages = [];
      this.#playerInfo = { id: 0,
        isPlaying: false,
        nickname: "" };
      return true;
    } catch (err) {
      if (err instanceof ResponseError && err.status === 404) {
        this.#imRegistered = false;
        this.#hasLoaded = true;
        this.#errorMessages = [];
        this.#playerInfo = { id: 0,
          isPlaying: false,
          nickname: "" };
        return true;
      } else if (err instanceof ResponseError) {
        this.#errorMessages = [getErrorMessage(err)];
      } else {
        console.error(err);
        this.#errorMessages = ["Impossibile completare la disconnessione."];
      }
      return false;
    }
  }

  #notifyStateChanged () {
    for (const listener of this.#changeListeners) listener();
  }

  // #endregion

}
