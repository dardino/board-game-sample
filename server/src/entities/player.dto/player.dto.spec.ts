import { PlayerDto } from "./player.dto";

describe(
  "PlayerDto",
  () => {

    it(
      "should be defined",
      () => {

        const newPlayer = new PlayerDto(
          1,
          "MyNickName",
          false,
        );
        expect(newPlayer).toBeDefined();
        expect(newPlayer.id).toEqual(1);
        expect(newPlayer.nickname).toEqual("MyNickName");
        expect(newPlayer.isPlaying).toBeFalsy();

      },
    );

  },
);
