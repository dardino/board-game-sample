import { GamesServices } from "@/services/game/games.service";
import { LobbyEventsService } from "@/services/game/lobby-events.service";
import { GameEvent } from "@dto/matchmaking/game-event.dto";
import { BadRequestException, Body, Controller, Get, Inject, MessageEvent, Param, Post, Query, Sse } from "@nestjs/common";
import { concat, filter, interval, map, merge, Observable, of } from "rxjs";

function isGameEventForId (event: GameEvent, gameId: number): boolean {
  if (event.type === "game-updated") return event.game.gameId === gameId;
  return event.type === "game-removed" && event.gameId === gameId;
}

@Controller("mm")
export class MatchMakingController {

  constructor (
    @Inject(GamesServices) private readonly gameService: GamesServices,
    @Inject(LobbyEventsService) private readonly lobbyEvents: LobbyEventsService,
  ) {}

  @Get("games")
  async getGames () {

    return this.gameService.getAvailableGameStats();

  }


  @Get("game/:id")
  async getGame (@Param() params: { id: string }) {

    return this.gameService.getGameStatsById(+params.id);

  }

  @Sse("events")
  getEvents (@Query("gameId") gameId?: string): Observable<MessageEvent> {
    const keepalive = interval(15000).pipe(
      map((): MessageEvent => ({ comment: "keepalive" })),
    );

    if (gameId === undefined) {
      const updates = this.lobbyEvents.events$.pipe(
        filter((event) => event.type === "lobbies-updated"),
        map((event): MessageEvent => ({ data: event })),
      );
      const initialState: GameEvent = {
        type: "lobbies-updated",
        games: this.gameService.getAvailableGameStats(),
      };
      return concat(
        of<MessageEvent>({ data: initialState }),
        merge(updates, keepalive),
      );
    }

    const id = Number(gameId);
    if (!Number.isSafeInteger(id) || id < 0) {
      throw new BadRequestException("Invalid game ID");
    }
    const initialState: GameEvent = {
      type: "game-updated",
      game: this.gameService.getGameStatsById(id),
    };
    const updates = this.lobbyEvents.events$.pipe(
      filter((event) => isGameEventForId(event, id)),
      map((event): MessageEvent => ({ data: event })),
    );
    return concat(
      of<MessageEvent>({ data: initialState }),
      merge(updates, keepalive),
    );

  }

  @Post("game")
  async createGame (
    @Body() dto: { nickName: string; gameTitle: string },
  ) {

    const createdGame = await this.gameService.createNewGame(
      dto.nickName,
      dto.gameTitle,
    );
    return createdGame.gameId;

  }

  @Post("join")
  async joinGame (
    @Body() dto: { nickName: string; gameId: number },
  ) {

    return await this.gameService.joinToGame(
      dto.nickName,
      dto.gameId,
    );

  }

  @Post("leave")
  async leaveGame (
    @Body() dto: { nickName: string; gameId: number },
  ) {
    return await this.gameService.leaveGame(
      dto.nickName,
      dto.gameId,
    );

  }

  @Post("start")
  async startGame (@Body() dto: { nickName: string;
    gameId: number; }) {

    return await this.gameService.startGame(
      dto.nickName,
      dto.gameId,
    );

  }

}
