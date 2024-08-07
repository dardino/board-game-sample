import { shuffleArray } from "../../../tools/arrays";
import { STARTING_TILES } from "../../gameone-contents";
import { Flow } from "../gameone.flow";
import { prepareTile } from "../gameone.tile.helpers";
import {
  PlaceFirstTileAction,
  StateReducer,
  TILE_ANGLES,
} from "../state.types";

//#region PlaceFirstTile
export const PlaceFirstTileReducer: StateReducer<PlaceFirstTileAction> = (
  state,
  action,
) => {
  if (state.players.length === 0) {
    throw new Error(
      "Impossibile piazzare la prima tile senza aggiungere i giocatori!",
    );
  }
  const firstTile = shuffleArray(STARTING_TILES)[0];
  const angle = shuffleArray(TILE_ANGLES.slice())[0];
  const connected = prepareTile(firstTile, angle, state.players.slice());
  return {
    onboardTiles: [connected],
    allowedNextActions: Flow.Setup.PlaceFirstTile,
    previousAction: action.kind,
  };
};
//#endregion PlaceFirstTile
