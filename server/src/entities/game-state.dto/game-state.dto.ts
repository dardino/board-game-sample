export interface GameStateEvent {
  type: "game-state";
  gameId: number;
  gameType: string;
  phase: string | null;
  currentPlayer: string | null;
  turnPhase: string | null;
  allowedActions: string[];
  state: unknown;
}

export interface GameStateErrorEvent {
  type: "game-error";
  gameId?: number;
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
