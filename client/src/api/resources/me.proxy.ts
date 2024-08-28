import { PlayerDto } from "@dto/player.dto/player.dto";
import { BaseProxy } from "../baseProxy";

export class MeProxy extends BaseProxy {


  /**
   * Retrieves the information of the current player.
   * @returns A Promise that resolves to a PlayerDto object representing the current player, or null if the player is not found.
   */
  public static getMe: MeProxy["getMe"] = () => new MeProxy().getMe();


  /**
   * Registers a new player with the specified nickname.
   * @param nickname - The nickname of the player.
   * @returns A Promise that resolves to a PlayerDto object representing the registered player.
   */
  public static registerMe: MeProxy["registerMe"] = (...args) => new MeProxy().registerMe(...args);


  /**
   * Deletes the current user.
   * @returns A promise that resolves to a boolean indicating whether the deletion was successful.
   */
  public static deleteMe: MeProxy["deleteMe"] = () => new MeProxy().deleteMe();

  // #region Private
  private constructor () {
    super("me");
  }

  private async getMe (): Promise<PlayerDto | null> {
    return await this.get<PlayerDto | null, "">("");
  }

  private async registerMe (nickname: string): Promise<PlayerDto> {
    return await this.post<PlayerDto, "", { nickname: string }>(
      "",
      { nickname },
    );
  }

  private async deleteMe (): Promise<boolean> {
    return await this.delete<boolean, "">("");
  }
  // #region private

}
