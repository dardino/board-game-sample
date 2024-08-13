import { PlayerDto } from "./player.dto";
import { hasNickname } from "./player.dto.utils";

/**
 * Tests for the `hasNickname` function.
 */
describe(
  "hasNickname",
  () => {

    const player1: PlayerDto = {
      id: 1,
      nickname: "testPlayer1",
      isPlaying: false,
    };
    const player2: PlayerDto = {
      id: 2,
      nickname: "testPlayer2",
      isPlaying: false,
    };

    /**
     * Tests that the `hasNickname` function returns true if the player has the specified nickname.
     */
    it(
      "should return true if the player has the specified nickname",
      () => {

        const nickname = "testPlayer1";
        const predicate = hasNickname(nickname);
        expect(predicate(player1)).toBe(true);

      },
    );

    /**
     * Tests that the `hasNickname` function returns false if the player does not have the specified nickname.
     */
    it(
      "should return false if the player does not have the specified nickname",
      () => {

        const nickname = "testPlayer1";
        const predicate = hasNickname(nickname);
        expect(predicate(player2)).toBe(false);

      },
    );

  },
);
