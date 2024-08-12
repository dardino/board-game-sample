//#region Move

import { getPlayer } from "../gameone.rule.helpers";
import {
  AllPossibleActionKind,
  GameoneState,
  MoveAction,
  StateReducer,
} from "../state.types";

/**
 * Esegue un movimento con le regole di movimento:
 *   un giocatore, per poter muovere, deve essere 'libero'.
 *   un giocatore è libero se:
 *     - è il suo turno
 *     - è vivo (vita > 0)
 *     - non è bloccato da nemici
 *     - ha ancora movimenti a disposizione
 *   per poter andare in una qualunque direzione deve esistere un 'passaggio' in quella direzione
 *   il passaggio esiste se la tile in cui si trova il giocatore ha nella direzione specificata:
 *     - una connessione possibile e nessuna tile collegata
 *     - una connessione valida con la tile collegata
 *   viceversa il movimento non sarà possibile se non c'è una connessione valida o potenzialmente valida.
 * se il giocatore può muovere nella direzione indicata allora si verifica quanto segue:
 *   - se e c'è giù una tile allora il movimento si conclude spostando il giocatore nella tile indicata.
 *   - se non c'è una tile allora il giocatore deve prima:
 *     - pescare una nuova tile (PickATile)
 *     - orientarla e piazzarla nel modo corretto
 *       e quindi si aggiungono eventuali nemici (PlaceTile)
 *     - muovere il proprio personaggio nella tile appena aggiunta. (Move)
 * @param state
 * @param action
 * @returns
 */
export const MoveReducer: StateReducer<MoveAction> = (state, action) => {
  // il giocatore può muovere se :
  // - è il suo turno
  if (state.players[state.currentPlayerIndex] !== action.playerId) {
    throw new Error(
      `non è il tuo turno! (tocca al giocatore con ID <${state.players[state.currentPlayerIndex]}>)`,
    );
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
    placeTileAt: action.direction,
    currentPlayerPerformedActions: state.currentPlayerPerformedActions.concat([
      action.kind,
    ]),
  } satisfies Partial<GameoneState>;
};
//#endregion Move
