import { GamestateModel } from "./gamestate.model";

import { describe, expect, it } from "vitest";

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
