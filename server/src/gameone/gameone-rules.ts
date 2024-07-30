import { shuffleArray } from "src/tools/arrays";
import {
  ADVANCED_ENEMIES,
  BASE_ENEMIES,
  BOSS_ENEMIES,
  BOSS_TILES,
  Character,
  CHARACTERS,
  Connections,
  Enemy,
  OTHER_TILES,
  STARTING_TILES,
  Tile,
} from "./gameone-contents";

//#region GameState
const GAME_PHASES = ["Setup", "PlayerTurn", "PhaseFeed", "EndGame"] as const;
/**
 *  0 = 0°;
 *  1 = 60°;
 *  2 = 120°;
 *  3 = 180°;
 *  4 = 240°;
 *  5 = 300°;
 */
const TILE_ANGLES = [0, 1, 2, 3, 4, 5] as const;
type GamePhases = (typeof GAME_PHASES)[number];
type TileAngles = (typeof TILE_ANGLES)[number];
type ConnectedTile = Tile & {
  x: number;
  y: number;
  orientation: TileAngles;
  nodes: Partial<Record<Connections, ConnectedTile | null>>;
  playersIn: number[];
  enemiesIn: Enemy[];
};

interface CharacterWithName extends Character {
  characterName: string;
  life: number;
  energy: number;
}
interface GameoneState {
  phase: GamePhases | null;
  previousAction: AllPossibleActionKind | null;
  allowedNextActions: AllPossibleActionKind[];
  tileToPlace: Tile | null;
  placeTileAt: Connections | null;
  tilesDeck: {
    L1: Tile[];
    L2: Tile[];
    L3: Tile[];
  };
  onboardTiles: ConnectedTile[];
  playerOrder: number[];
  players: number[];
  charactersByPlayers: Array<{
    playerId: number;
    character: CharacterWithName;
  }>;
  boss: Enemy | null;
  currentPlayerIndex: number;
  currentPlayerPerformedActions: AllPossibleActionKind[];
}
export function getInitialState(): GameoneState {
  return {
    boss: null,
    charactersByPlayers: [],
    onboardTiles: [],
    tileToPlace: null,
    phase: null,
    previousAction: null,
    playerOrder: [],
    players: [],
    placeTileAt: null,
    tilesDeck: {
      L1: [],
      L2: [],
      L3: [],
    },
    allowedNextActions: ["SetPlayers" as AllPossibleActionKind],
    currentPlayerIndex: -1,
    currentPlayerPerformedActions: [],
  };
}

//#endregion GameState

//#region reducer types
interface EmptyObject {}
type GameAction<TPhase extends GamePhases, TAction, OtherArgs = EmptyObject> = {
  phase: TPhase;
  kind: TAction;
} & OtherArgs;

type StateReducer<TArgs extends GameAction<any, any, any>> = (
  oldState: GameoneState,
  args: TArgs,
) => Partial<GameoneState>;
//#endregion reducer types

//#region PHASE: "Setup"

//#region SetPlayers
type SetPlayersAction = GameAction<
  "Setup",
  "SetPlayers",
  { players: number[] }
>;
const SetPlayersReducer: StateReducer<SetPlayersAction> = (_state, action) => {
  return {
    players: action.players,
    previousAction: action.kind,
    allowedNextActions: Flow.Setup.SetPlayers,
  };
};
//#endregion ShuffleTiles
//#region ShuffleTiles
type ShuffleTilesAction = GameAction<"Setup", "ShuffleTiles">;
const ShuffleTilesReducer: StateReducer<ShuffleTilesAction> = (
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
//#region PlaceFirstTile
type PlaceFirstTileAction = GameAction<"Setup", "PlaceFirstTile">;
const PlaceFirstTileReducer: StateReducer<PlaceFirstTileAction> = (
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
//#region SetPlayngOrder
type SetPlayngOrderAction = GameAction<"Setup", "SetPlayngOrder">;
const SetPlayngOrderReducer: StateReducer<SetPlayngOrderAction> = (
  state,
  action,
) => {
  return {
    playerOrder: shuffleArray(state.players),
    allowedNextActions: Flow.Setup.SetPlayngOrder,
    previousAction: action.kind,
  };
};
//#endregion SetPlayngOrder
//#region CharacterSelection
type CharacterSelectionAction = GameAction<
  "Setup",
  "CharacterSelection",
  {
    selectedCharacters: {
      playerId: number;
      characterId: number;
      characterName: string;
    }[];
  }
>;
function buildCharacters({
  characterId,
  characterName,
  playerId,
}: CharacterSelectionAction["selectedCharacters"][number]): GameoneState["charactersByPlayers"][number] {
  const character = CHARACTERS.find((char) => char.characterId === characterId);
  if (!character)
    throw new Error(
      "Non ho trovato un personaggio con questo id: " + characterId,
    );
  return {
    playerId,
    character: {
      ...character,
      characterName,
      life: character.startingLife,
      energy: character.startingEnergy,
    },
  };
}
const CharacterSelectionReducer: StateReducer<CharacterSelectionAction> = (
  _state,
  action,
) => {
  return {
    charactersByPlayers: action.selectedCharacters.map(buildCharacters),
    allowedNextActions: Flow.Setup.CharacterSelection,
    previousAction: action.kind,
  };
};
//#endregion CharacterSelection
//#region DrawBoss
type DrawBossAction = GameAction<"Setup", "DrawBoss">;
const DrawBossReducer: StateReducer<DrawBossAction> = (_state, action) => {
  return {
    boss: shuffleArray(BOSS_ENEMIES)[0],
    previousAction: action.kind,
    allowedNextActions: Flow.Setup.DrawBoss,
  };
};
//#endregion DrawBoss
//#region GoToPlayerTurn
type GoToPlayerTurnAction = GameAction<"Setup", "GoToPlayerTurn">;
const GoToPlayerTurnReducer: StateReducer<GoToPlayerTurnAction> = (
  _state,
  action,
) => {
  return {
    phase: "PlayerTurn",
    previousAction: action.kind,
    allowedNextActions: Flow.Setup.GoToPlayerTurn,
    currentPlayerIndex: 0,
    currentPlayerPerformedActions: [],
  };
};
//#endregion DrawBoss
//#endregion PHASE: "Setup"

//#region PHASE: "PlayerTurn"
type PlayerTurnAction<Kind extends string, TAction> = GameAction<
  "PlayerTurn",
  Kind,
  TAction & { playerId: number }
>;
//#region Move

type MoveAction = PlayerTurnAction<"Move", { direction: Connections }>;
const MoveReducer: StateReducer<MoveAction> = (state, action) => {
  // il giocatore può muovere se :
  // - è il suo turno
  if (state.playerOrder[state.currentPlayerIndex] !== action.playerId) {
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
    allowedNextActions = ["GetTile" as AllPossibleActionKind];
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
//#region PlaceTile
type GetTileAction = PlayerTurnAction<"GetTile", { position: Connections }>;
const GetTileReducer: StateReducer<GetTileAction> = (state, action) => {
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
    allowedNextActions: Flow.PlayerTurn.GetTile,
  };
};
//#endregion PlaceTile
//#region PlaceTile
type PlaceTileAction = PlayerTurnAction<"PlaceTile", { rotation: TileAngles }>;
const PlaceTileReducer: StateReducer<PlaceTileAction> = (state, action) => {
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
//#endregion PHASE: "PlayerTurn"

type AllPossibleAction =
  | SetPlayersAction
  | DrawBossAction
  | ShuffleTilesAction
  | PlaceFirstTileAction
  | SetPlayngOrderAction
  | CharacterSelectionAction
  | GoToPlayerTurnAction
  | MoveAction
  | GetTileAction
  | PlaceTileAction;
export type AllPossibleActionKind = AllPossibleAction["kind"];
type InferActionByKind<Kind extends AllPossibleActionKind> =
  AllPossibleAction & { kind: Kind };
type InferKindsByPhase<Phase extends GamePhases> = (AllPossibleAction & {
  phase: Phase;
})["kind"];

const allActionsMap: {
  [key in AllPossibleActionKind]: StateReducer<InferActionByKind<key>>;
} = {
  SetPlayers: SetPlayersReducer,
  ShuffleTiles: ShuffleTilesReducer,
  PlaceFirstTile: PlaceFirstTileReducer,
  DrawBoss: DrawBossReducer,
  SetPlayngOrder: SetPlayngOrderReducer,
  CharacterSelection: CharacterSelectionReducer,
  GoToPlayerTurn: GoToPlayerTurnReducer,
  Move: MoveReducer,
  GetTile: GetTileReducer,
  PlaceTile: PlaceTileReducer,
};

const Flow = {
  Setup: {
    SetPlayers: ["DrawBoss"],
    DrawBoss: ["ShuffleTiles"],
    ShuffleTiles: ["PlaceFirstTile"],
    PlaceFirstTile: ["SetPlayngOrder"],
    SetPlayngOrder: ["CharacterSelection"],
    CharacterSelection: ["GoToPlayerTurn"],
    GoToPlayerTurn: ["Move"],
  },
  PlayerTurn: { Move: ["Move"], GetTile: ["PlaceTile"], PlaceTile: ["Move"] },
  PhaseFeed: {},
  EndGame: {},
} satisfies {
  [key in GamePhases]: {
    [kind in InferKindsByPhase<key>]: AllPossibleActionKind[];
  };
};

export const GameOneMatchManager = (
  gameState: GameoneState,
  action: AllPossibleAction,
): GameoneState => {
  if (!gameState.allowedNextActions.includes(action.kind)) {
    throw new Error("Non è possibile eseguire questa azione!");
  }
  const reducer = allActionsMap[action.kind] as StateReducer<AllPossibleAction>;
  const partialGameState = reducer(gameState, action);
  return {
    ...gameState,
    ...partialGameState,
  };
};

export function prepareTile(
  tile: Tile,
  rotation: TileAngles,
  withPlayers: number[],
): ConnectedTile {
  return rotateTile(
    {
      ...tile,
      x: 0,
      y: 0,
      orientation: rotation,
      playersIn: withPlayers,
      enemiesIn: [],
      nodes: {
        BL: null,
        BR: null,
        L: null,
        R: null,
        TL: null,
        TR: null,
      },
    },
    rotation,
  );
}
function rotateTile(tile: ConnectedTile, rotation: TileAngles): ConnectedTile {
  if (Object.values(tile.nodes).some((val) => val != null)) {
    throw Error(
      "La rotazione deve avvenire solo per tile preparate ma non ancora collegate!",
    );
  }
  // metto i nodi in un array
  const nodes: Array<{ pos: Connections; node: Tile | null | undefined }> = [
    { pos: "TL", node: tile.nodes.TL },
    { pos: "TR", node: tile.nodes.TR },
    { pos: "R", node: tile.nodes.R },
    { pos: "BR", node: tile.nodes.BR },
    { pos: "BL", node: tile.nodes.BL },
    { pos: "L", node: tile.nodes.L },
    { pos: "TL", node: tile.nodes.TL },
    { pos: "TR", node: tile.nodes.TR },
    { pos: "R", node: tile.nodes.R },
    { pos: "BR", node: tile.nodes.BR },
    { pos: "BL", node: tile.nodes.BL },
    { pos: "L", node: tile.nodes.L },
  ];
  const rotatedNodes = nodes.slice(rotation, rotation + 6);
  tile.nodes = {};
  rotatedNodes.forEach(({ pos, node }) => {
    // aggiungo solo le posizioni "null", le altre no
    if (node === null) {
      tile.nodes[pos] = node;
    }
  });
  tile.orientation = rotation;
  return tile;
}

function getNeighborhoodCoord(
  tile: ConnectedTile,
  direction: Connections,
): {
  x: number;
  y: number;
} {
  const delta = neighborhood[direction];
  return {
    x: delta[0] + tile.x,
    y: delta[1] + tile.y,
  };
}
function getRingNumber(tile: { x: number; y: number }): "L1" | "L2" | "L3" {
  const X = Math.abs(tile.x);
  const Y = Math.abs(tile.y);
  const dist = Math.max(Math.floor((X + Y) / 2), Y);
  return `L${Math.min(dist, 3)}` as "L1" | "L2" | "L3";
}
const neighborhood: Record<Connections, [number, number]> = {
  //   X, Y
  TL: [-1, -1],
  TR: [+1, -1],
  L: [-2, 0],
  R: [+2, 0],
  BL: [-1, +1],
  BR: [+1, +1],
};

function getOppositeConnection(conn: Connections): Connections {
  return Connections[(Connections.indexOf(conn) + 3) % 6];
}

function getPlayer(
  playerId: number,
  game: GameoneState,
): {
  tile: ConnectedTile;
  character: CharacterWithName;
  possibleActions: AllPossibleActionKind[];
} {
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
function getPossibleActions(
  character: CharacterWithName,
  performedActions: AllPossibleActionKind[],
  tile: ConnectedTile,
) {
  const possibleActions: AllPossibleActionKind[] = [];
  const hasOtherMoves =
    character.movementSpeed >
    performedActions.filter((act) => act === "Move").length;
  const notBlocked = tile.enemiesIn.length < tile.playersIn.length;
  const notDead = character.life > 0;
  const canMove = hasOtherMoves && notBlocked && notDead;
  if (canMove) {
    possibleActions.push("Move");
  }
  return possibleActions;
}
