import { Flow, isPlayerAction, removeActionFromArray } from "./gameone.flow";
import {
  AllPossibleActionKind,
  CharacterWithName,
  ConnectedTile,
  GameoneState,
} from "./state.types";

/**
 * Elenca tutte le azioni che un giocatore può fare
 * @param character Character
 * @param performedActions azioni già effettuate dal giocatore
 * @param tile tile in cui il giocatore si trova
 * @returns lista delle azioni (kind) che il giocatore può fare
 */
export function getPossibleActions(
  character: CharacterWithName,
  performedActions: AllPossibleActionKind[],
  tile: ConnectedTile,
) {
  const lastAction = performedActions.slice(-1)[0];
  const possibleActions: AllPossibleActionKind[] = isPlayerAction(lastAction)
    ? Flow.PlayerTurn[lastAction]
    : Flow.PlayerTurn.Awake; // Awake contiene tutte le possibili azioni

  // verifico se si può muovere
  const hasOtherMoves =
    character.movementSpeed >
    performedActions.filter((act) => act === "Move").length;
  const notBlocked = tile.enemiesIn.length < tile.playersIn.length;
  const notDead = character.life > 0;
  const canMove = hasOtherMoves && notBlocked && notDead;
  // se no rimuovo l'azione da quelle possibili
  if (!canMove) removeActionFromArray(possibleActions, "Move");

  // rimuovo la "pick a tile" in quanto è una azione che può essere fatta solo se richiesto dal movimento,
  // nel qual caso sarà l'azione di movimento ad impostarla come unica azione possibile
  removeActionFromArray(possibleActions, "PickATile");
  return possibleActions;
}

export interface PlayerStateInfo {
  tile: ConnectedTile;
  character: CharacterWithName;
  possibleActions: AllPossibleActionKind[];
}
/**
 * cerca il giocatore e me restituisce lo stato
 * @param playerId id del giocatore da trovare
 * @param game stato della partita
 * @returns {PlayerStateInfo} informazioni sullo stato del giocatore come ad esempio tile in cui si trova, azioni possibili, info sul suo personaggio
 */
export function getPlayer(
  playerId: number,
  game: GameoneState,
): PlayerStateInfo {
  const tile = game.onboardTiles.find((tile) =>
    tile.playersIn.includes(playerId),
  );
  if (!tile) throw new Error("il giocatore corrente non è sul tabellone!");
  const character = game.charactersByPlayers.find(
    (char) => char.playerId === playerId,
  )?.character;
  if (!character)
    throw new Error("il giocatore corrente non ha scelto il suo personaggio");
  const possibleActions = getPossibleActions(
    character,
    game.currentPlayerPerformedActions,
    tile,
  );
  return { tile, character, possibleActions };
}
