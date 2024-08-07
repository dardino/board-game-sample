import { Character, Connections, Enemy, Tile } from "../gameone-contents";

//#region GameState
export const GAME_PHASES = [
  "Setup",
  "PlayerTurn",
  "PhaseFeed",
  "EndGame",
] as const;
/**
 *  0 = 0°;
 *  1 = 60°;
 *  2 = 120°;
 *  3 = 180°;
 *  4 = 240°;
 *  5 = 300°;
 */
export const TILE_ANGLES = [0, 1, 2, 3, 4, 5] as const;
export type GamePhases = (typeof GAME_PHASES)[number];
export type TileAngles = (typeof TILE_ANGLES)[number];
export type ConnectedTile = Tile & {
  x: number;
  y: number;
  orientation: TileAngles;
  nodes: Partial<Record<Connections, ConnectedTile | null>>;
  playersIn: number[];
  enemiesIn: Enemy[];
};

export interface CharacterWithName extends Character {
  characterName: string;
  life: number;
  energy: number;
}
export interface GameoneState {
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
export type StateReducer<TArgs extends GameAction<any, any, any>> = (
  oldState: GameoneState,
  args: TArgs,
) => Partial<GameoneState>;
//#endregion reducer types

//#region ALL ACTIONS

//#region Setup
type SetupAction<Kind extends string, TAction = EmptyObject> = GameAction<
  "Setup",
  Kind,
  TAction
>;
export type SetPlayersAction = SetupAction<"SetPlayers", { players: number[] }>;
export type ShuffleTilesAction = SetupAction<"ShuffleTiles">;
export type PlaceFirstTileAction = SetupAction<"PlaceFirstTile">;
export type SetPlayngOrderAction = SetupAction<"SetPlayngOrder">;
export type CharacterSelectionAction = SetupAction<
  "CharacterSelection",
  {
    selectedCharacters: {
      playerId: number;
      characterId: number;
      characterName: string;
    }[];
  }
>;
export type DrawBossAction = SetupAction<"DrawBoss">;
export type GoToPlayerTurnAction = SetupAction<"GoToPlayerTurn">;
//#endregion Setup

//#region PlayerTurn
type PlayerTurnAction<Kind extends string, TAction> = GameAction<
  "PlayerTurn",
  Kind,
  TAction & { playerId: number }
>;
export type AwakeAction = PlayerTurnAction<"Awake", EmptyObject>;
export type PickATileAction = PlayerTurnAction<
  "PickATile",
  { position: Connections }
>;
export type PlaceTileAction = PlayerTurnAction<
  "PlaceTile",
  { rotation: TileAngles }
>;
export type MoveAction = PlayerTurnAction<"Move", { direction: Connections }>;
export type FightAction = PlayerTurnAction<
  "Fight",
  { tile: { x: number; y: number }; attack: { type: "" } }
>;
export type PassAction = PlayerTurnAction<"Pass", { direction: Connections }>;
//#endregion PlayerTurn

//#region PhaseFeed
type PhaseFeedAction<Kind extends string, TAction = EmptyObject> = GameAction<
  "PhaseFeed",
  Kind,
  TAction
>;
export type CheckEndGameAction = PhaseFeedAction<"CheckEndGame">;
export type MoveNextEnemyAction = PhaseFeedAction<"MoveNextEnemy">;
//#endregion PhaseFeed

//#region EndGame
type EndGameAction<Kind extends string, TAction = EmptyObject> = GameAction<
  "EndGame",
  Kind,
  TAction
>;
export type AssignRatingAction = EndGameAction<"AssignRating">;
//#endregion EndGame

//#endregion ALL ACTIONS

export type AllPossibleAction =
  // Setup
  | SetPlayersAction
  | DrawBossAction
  | ShuffleTilesAction
  | PlaceFirstTileAction
  | SetPlayngOrderAction
  | CharacterSelectionAction
  | GoToPlayerTurnAction
  // PlayerTurn
  | MoveAction
  | PickATileAction
  | PlaceTileAction
  | AwakeAction
  | FightAction
  | PassAction
  // PhaseFeed
  | CheckEndGameAction
  | MoveNextEnemyAction
  // EndGame
  | AssignRatingAction;
export type AllPossibleActionKind = AllPossibleAction["kind"];
