
import { PlayerDto } from "@dto/player.dto/player.dto";
import { describe, expect, it } from "vitest";
import { GameModel } from "./game.model";
describe(
  "GameModel tests",
  () => {

    it(
      "GameModel should be defined",
      () => {

        const player: PlayerDto = {
          id: 0,
          isPlaying: false,
          nickname: "testPlayer",
        };
        expect(GameModel.createGame(
          "",
          player,
        )).toBeDefined();
        expect(player.isPlaying).toBeTruthy();

      },
    );

  },
);
