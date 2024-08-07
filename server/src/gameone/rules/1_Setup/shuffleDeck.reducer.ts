import { shuffleArray } from "../../../tools/arrays";
import { BOSS_TILES, OTHER_TILES, Tile } from "../../gameone-contents";
import { Flow } from "../gameone.flow";
import { ShuffleTilesAction, StateReducer } from "../state.types";

//#region ShuffleTiles
export const ShuffleTilesReducer: StateReducer<ShuffleTilesAction> = (
  state,
  action,
) => {
  if (state.boss == null)
    throw new Error(
      "Non posso mischiare le tile perchè il boss non è stato scelto",
    );
  const tiles1: Tile[] = shuffleArray(
    OTHER_TILES.filter((tile) => tile.ring === 1),
  );
  const tiles2: Tile[] = shuffleArray(
    OTHER_TILES.filter((tile) => tile.ring === 2),
  );
  const bossTile = shuffleArray(BOSS_TILES)[0];
  const tiles3: Tile[] = shuffleArray(
    OTHER_TILES.filter((tile) => tile.ring === 3).concat([bossTile]),
  );
  return {
    allowedNextActions: Flow.Setup.ShuffleTiles,
    previousAction: action.kind,
    tilesDeck: {
      L1: tiles1,
      L2: tiles2,
      L3: tiles3,
    },
  };
};
//#endregion ShuffleTiles
