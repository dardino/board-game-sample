export interface GameStateEvent {
  type: "game-state";
  gameId: number;
  gameType: string;
  phase: string | null;
  currentPlayer: string | null;
  turnPhase: string | null;
  allowedActions: string[];
  chat: GameChatState;
  characterSelection: GameCharacterSelectionStatus;
  reconnection: GameReconnectionStatus;
  state: unknown;
}

export interface GameReconnectionStatus {
  paused: boolean;
  resumesAt: number | null;
  disconnectedPlayerIds: number[];
}

export interface GameChatMessage {
  playerId: number;
  nickname: string;
  text: string;
  sentAt: string;
}

export interface GameChatState {
  messages: GameChatMessage[];
}

export const MAX_GAME_CHAT_MESSAGE_LENGTH = 500;

export interface GameCharacterSelectionStatus {
  stage: "choosing" | "revealing" | null;
  endsAt: number | null;
  readyPlayerIds: number[];
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
  code?: "GAME_NOT_FOUND" | "NOT_A_PLAYER";
  message: string;
}

export interface GameStateSubscription {
  type: "subscribe";
  gameId: number;
  playerId: number;
}

export interface GameChatMessageRequest {
  type: "chat-message";
  requestId: string;
  gameId: number;
  message: string;
}

export interface GameChatMessageResultEvent {
  type: "chat-message-result";
  requestId: string;
  gameId: number;
  status: "accepted" | "rejected";
  error?: {
    code: string;
    message: string;
  };
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
