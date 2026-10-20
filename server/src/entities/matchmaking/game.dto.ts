export class GameDto {

  public gameId = 0;

  public playersMax = 0;

  public playersMin = 0;

  public joinedPlayers = 0;

  public players: string[] = [];

  public elapsed: number | null = null;

  public title = "";

}
