import { Body, Controller, Delete, Get, Post, Res } from "@nestjs/common";
import { FastifyReply } from "fastify";
import { PlayerDto } from "src/entities/player.dto/player.dto";
import { MeService } from "../me/me.service";

@Controller("me")
export class MeController {

  constructor (private readonly meService: MeService) {}

  @Get()

  /**
   * Recupera informazioni sul giocatore con il nickname specificato.
   * @param myNickName - Il nickname del giocatore.
   * @returns Una Promise che si risolve in un oggetto PlayerDto che rappresenta il giocatore, o null se il giocatore non viene trovato.
   */
  async getMe () {

    return await this.meService.getMe();

  }

  @Delete()

  /**
   * Cancella l'utente corrente.
   * @returns Una promise che si risolve quando l'utente viene cancellato.
   */
  async deleteMe () {

    return await this.meService.deleteMe();

  }

  @Post()

  /**
   * Registra un nuovo utente con il nickname specificato.
   *
   * @param nickName Il nickname dell'utente da registrare.
   * @param response L'oggetto di risposta FastifyReply.
   * @returns Una Promise che restituisce l'oggetto di successo contenente il nickname registrato.
   */
  async registerMe (
    @Body() newPlayer: Pick<PlayerDto, "nickname">,
    @Res({ passthrough: true }) response: FastifyReply,
  ) {

    const success = await this.meService.registerMe(newPlayer.nickname);
    response.setCookie(
      MeService.COOKIE_NICK,
      success.nickname,
    );
    return success;

  }

}
