import { Body, Controller, Get, Post } from "@nestjs/common";
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
