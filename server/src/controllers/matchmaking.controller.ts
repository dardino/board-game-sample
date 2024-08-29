import { GameDto } from "@dto/matchmaking/game.dto";
import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { GamesServices } from "src/game/games.service";

@Controller("mm")
export class MatchMakingController {

  constructor (private readonly gameService: GamesServices) {}

  @Get("games")
  async getGames () {
    return (await this.gameService.getFreeGames()).map((game) => ({
      ...this.gameService.getGameStats(game),
      gameId: game.gameId,
    }));
  }


  @Get("game/:id")
  async getGame (@Param() params: { id: string }) {
    const gameModel = await this.gameService.gameById(+params.id);
    return {
      elapesd: gameModel.startedAt
        ? Date.now() - gameModel.startedAt.valueOf()
        : null,
      gameId: gameModel.gameId,
      joinedPlayers: gameModel.connectedPlayers.length,
      playersMax: gameModel.maxPlayers,
      playersMin: 2,
      title: gameModel.gameTitle,
    } satisfies GameDto;
  }

  @Post("game")
  async createGame (@Body() dto: { nickName: string;
    gameTitle: string; }) {
    const createdGame = await this.gameService.createNewGame(
      dto.nickName,
      dto.gameTitle,
    );
    return createdGame.gameId;
  }

  @Post("join")
  async joinGame (@Body() dto: { nickName: string;
    gameId: number; }) {
    return await this.gameService.joinToGame(
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
