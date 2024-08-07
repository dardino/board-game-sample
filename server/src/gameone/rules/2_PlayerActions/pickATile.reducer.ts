import { Flow } from "../gameone.flow";
import { getPlayer } from "../gameone.rule.helpers";
import { getNeighborhoodCoord, getRingNumber } from "../gameone.tile.helpers";
import { PickATileAction, StateReducer } from "../state.types";

export const PickATileReducer: StateReducer<PickATileAction> = (
  state,
  action,
) => {
  if (state.previousAction !== "Move") {
    throw new Error("Non puoi esplorare senza aver mosso!");
  }
  const { tile: myTile } = getPlayer(action.playerId, state);
  const nodeInDirection = myTile.nodes[action.position];
  if (nodeInDirection === undefined) {
    throw new Error(
      "la tile non può essere posizionata perché non c'è un passaggio in quella direzione",
    );
  }
  if (nodeInDirection !== null) {
    throw new Error(
      "la tile non si può posizionare in quella direzione perché già occupata",
    );
  }
  const tileCoord = getNeighborhoodCoord(myTile, action.position);
  const tileRing = getRingNumber(tileCoord);
  const tileToPlace = state.tilesDeck[tileRing].pop();
  if (tileToPlace == null) {
    throw new Error("Non ho trovato tile del livello richiesto: " + tileRing);
  }
  return {
    previousAction: action.kind,
    placeTileAt: action.position,
    tileToPlace,
    allowedNextActions: Flow.PlayerTurn.PickATile,
  };
};
