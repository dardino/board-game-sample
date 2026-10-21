export interface GameStateEvent {
  type: "game-state";
  gameId: number;
  gameType: string;
  phase: string | null;
  currentPlayer: string | null;
  turnPhase: string | null;
  allowedActions: string[];
  characterSelection: GameCharacterSelectionStatus;
  state: unknown;
}

export interface GameCharacterSelectionStatus {
  players: {
    playerId: number;
    nickname: string;
  }[];
  availableCharacters: {
    characterId: number;
    characterClass: string;
    startingLife: number;
    startingEnergy: number;
    movementSpeed: number;
    defence: number;
  }[];
  selectedCharacters: {
    playerId: number;
    nickname: string;
    characterId: number;
    characterName: string;
  }[];
}

export interface GameStateErrorEvent {
  type: "game-error";
  gameId?: number;
  code?: "GAME_NOT_FOUND";
  message: string;
}

export interface GameStateSubscription {
  type: "subscribe";
  gameId: number;
}

export interface GameActionRequest {
  type: "game-action";
  requestId: string;
  gameId: number;
  actorPlayerId: number;
  action: unknown;
}

export interface GameActionResultEvent {
  type: "game-action-result";
  requestId: string;
  gameId: number;
  status: "accepted" | "rejected";
  error?: {
    code: string;
    message: string;
  };
}
