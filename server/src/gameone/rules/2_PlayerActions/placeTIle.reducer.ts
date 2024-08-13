import {
  ADVANCED_ENEMIES,
  BASE_ENEMIES,
  Enemy,
} from "src/gameone/gameone-contents";
import { shuffleArray } from "src/tools/arrays";
import { Flow } from "../gameone.flow";
import { getPlayer } from "../gameone.rule.helpers";
import { getOppositeConnection, prepareTile } from "../gameone.tile.helpers";
import { PlaceTileAction, StateReducer } from "../state.types";

// #region PlaceTile
export const PlaceTileReducer: StateReducer<PlaceTileAction> = (
  state,
  action,
) => {

  if (state.tileToPlace == null) {

    throw new Error("impossibile eseguire il piazzamento senza aver selezionato una tile");

  }
  if (state.placeTileAt == null) {

    throw new Error("impossibile eseguire il piazzamento senza aver scelto una direzione");

  }

  // prendo la tile attuale
  const { tile: myTile } = getPlayer(
    action.playerId,
    state,
  );
  // e rimuovo il giocatore
  myTile.playersIn = myTile.playersIn.filter((id) => id !== action.playerId);

  // creo una tile connessa aggiungendo il giocatore corrente ( devo fare il movimento )
  const tilesOnBoard = state.onboardTiles.slice();
  const connectedTile = prepareTile(
    state.tileToPlace,
    action.rotation,
    [action.playerId],
  );
  tilesOnBoard.push(connectedTile);
  // la connetto all'opposto di quello indicato in `placeTileAt`
  const opposite = getOppositeConnection(state.placeTileAt);
  if (connectedTile.nodes[opposite] === undefined) {

    throw new Error("impossibile eseguire il piazzamento con questo orientamento poiché i collegamenti non combaciano con la tile di partenza");

  }
  // gli connetto la nuova e viceversa
  myTile.nodes[state.placeTileAt] = connectedTile;
  connectedTile.nodes[opposite] = myTile;
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

  return {
    previousAction: action.kind,
    allowedNextActions: Flow.PlayerTurn.PlaceTile,
    onboardTiles: tilesOnBoard,
    currentPlayerPerformedActions: state.currentPlayerPerformedActions.concat([
      "Move", // ho mosso di 1, la move non fa il movimento fintanto che la tile non è piazzata
      action.kind,
    ]),
  };

};
// #endregion PlaceTile
