import { GameDto } from "./game.dto";

export type GameEvent = {
  type: "lobbies-updated";
  games: GameDto[];
} | {
  type: "game-updated";
  game: GameDto;
} | {
  type: "game-removed";
  gameId: number;
};
