import { PlayerDto } from "../player.dto/player.dto";
import { GameDto } from "./game.dto";

describe("GameDto", () => {
  it("should be defined", () => {
    const player: PlayerDto = {
      id: 0,
      isPlaying: false,
      nickname: "testPlayer",
    };
    expect(GameDto.createGame("", player)).toBeDefined();
    expect(player.isPlaying).toBeTruthy();
  });
});
