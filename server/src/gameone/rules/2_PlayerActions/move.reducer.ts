//#region Move

import { Connections } from "src/gameone/gameone-contents";
import { getPlayer } from "../gameone.rule.helpers";
import {
  AllPossibleActionKind,
  GameoneState,
  MoveAction,
  StateReducer,
} from "../state.types";

export const MoveReducer: StateReducer<MoveAction> = (state, action) => {
  // il giocatore può muovere se :
  // - è il suo turno
  if (state.players[state.currentPlayerIndex] !== action.playerId) {
    throw new Error("non è il tuo turno!");
  }
  // - non ci sono nemici nella stessa tile
  const { tile: myTile, character: myCharacter } = getPlayer(
    action.playerId,
    state,
  );
  if (myTile.enemiesIn.length >= myTile.playersIn.length)
    throw new Error(
      "il giocatore non si può muovere perché il numero dei giocatori nella tile non supera quello dei nemici",
    );
  // - ha ancora mosse a disposizione
  if (
    state.currentPlayerPerformedActions.filter((act) => act === action.kind)
      .length === myCharacter.movementSpeed
  ) {
    throw new Error(
      "il giocatore non si può muovere perché ha finito il numero dei movimenti",
    );
  }
  // - c'è una connessione esistente o possibile nella direzione richiesta
  const nodeInDirection = myTile.nodes[action.direction];
  if (nodeInDirection === undefined) {
    throw new Error(
      "il giocatore non si può muovere in quella direzione perché non c'è un passaggio",
    );
  }
  let allowedNextActions: AllPossibleActionKind[] = [];
  const placeTileAt: Connections | null = null;
  if (nodeInDirection === null) {
    allowedNextActions = ["PickATile" as AllPossibleActionKind];
  } else {
    nodeInDirection.playersIn.push(action.playerId);
    myTile.playersIn = myTile.playersIn.filter(
      (pid) => pid !== action.playerId,
    );
  }
  return {
    previousAction: action.kind,
    allowedNextActions,
    tileToPlace: null,
    placeTileAt,
    currentPlayerPerformedActions: state.currentPlayerPerformedActions.concat([
      action.kind,
    ]),
  } satisfies Partial<GameoneState>;
};
//#endregion Move
