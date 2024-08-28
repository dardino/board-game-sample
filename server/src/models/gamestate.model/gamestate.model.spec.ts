import { GamestateModel } from "./gamestate.model";

describe(
  "GamestateDto",
  () => {

    it(
      "should be defined",
      () => {

        expect(new GamestateModel()).toBeDefined();

      },
    );

  },
);
