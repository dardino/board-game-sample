import { PlayerDto } from "../player.dto/player.dto";
import { GameDto } from "./game.dto";

describe(
  "GameDto tests",
  () => {

    it(
      "GameDto should be defined",
      () => {

        const player: PlayerDto = {
          id: 0,
          isPlaying: false,
          nickname: "testPlayer",
        };
        expect(GameDto.createGame(
          "",
          player,
        )).toBeDefined();
        expect(player.isPlaying).toBeTruthy();

      },
    );

  },
);
