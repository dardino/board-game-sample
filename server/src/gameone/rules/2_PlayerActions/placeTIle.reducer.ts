import {
  ADVANCED_ENEMIES,
  BASE_ENEMIES,
  Enemy,
} from "src/gameone/gameone-contents";
import { shuffleArray } from "src/tools/arrays";
import { getPlayer } from "../gameone.rule.helpers";
import { getOppositeConnection, prepareTile } from "../gameone.tile.helpers";
import { PlaceTileAction, StateReducer } from "../state.types";

//#region PlaceTile
export const PlaceTileReducer: StateReducer<PlaceTileAction> = (
  state,
  action,
) => {
  if (state.tileToPlace == null) {
    throw new Error(
      "impossibile eseguire il piazzamento senza aver selezionato una tile",
    );
  }
  if (state.placeTileAt == null) {
    throw new Error(
      "impossibile eseguire il piazzamento senza aver scelto una direzione",
    );
  }
  const tilesOnBoard = state.onboardTiles.slice();
  const connectedTile = prepareTile(state.tileToPlace, action.rotation, []);
  const opposite = getOppositeConnection(state.placeTileAt);
  if (connectedTile.nodes[opposite] === undefined) {
    throw new Error(
      "impossibile eseguire il piazzamento con questo orientamento poiché i collegamenti non combaciano con la tile di partenza",
    );
  }

  // creo una tile connessa
  const { tile: myTile } = getPlayer(action.playerId, state);
  myTile.nodes[state.placeTileAt] = connectedTile;
  connectedTile.nodes[opposite] = myTile;
  // ora ci sposto il giocatore corrente
  connectedTile.playersIn.push(action.playerId);
  myTile.playersIn = myTile.playersIn.filter((id) => id !== action.playerId);
  // se ci sono nemici li aggiungo
  if (connectedTile.enemies) {
    connectedTile.enemies.forEach((pClass) => {
      let nemToAdd: Enemy;
      switch (pClass) {
        case "Base":
          nemToAdd = shuffleArray(BASE_ENEMIES)[0];
          break;
        case "Advanced":
          nemToAdd = shuffleArray(ADVANCED_ENEMIES)[0];
          break;
        case "Boss":
          nemToAdd = state.boss!;
          break;
      }
      connectedTile.enemiesIn.push(nemToAdd);
    });
  }

  tilesOnBoard.push(connectedTile);

  return {
    previousAction: action.kind,
    allowedNextActions: [],
    onboardTiles: tilesOnBoard,
  };
};
//#endregion PlaceTile
