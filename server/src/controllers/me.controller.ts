import { PlayerDto } from "@/entities/player.dto/player.dto";
import { Body, Controller, Delete, Get, Inject, Post, Res } from "@nestjs/common";
import { FastifyReply } from "fastify";
import { MeService } from "../me/me.service";

@Controller("me")
export class MeController {

  constructor (@Inject(MeService) private readonly meService: MeService) {}

  @Get()

  /**
   * Recupera informazioni sul giocatore con il nickname specificato.
   * @param myNickName - Il nickname del giocatore.
   * @returns Una Promise che si risolve in un oggetto PlayerDto che rappresenta il giocatore, o null se il giocatore non viene trovato.
   */
  async getMe () {

    const player = await this.meService.getMe();
    return {
      id: player.id,
      isPlaying: player.isPlaying,
      nickname: player.nickname,
    };

  }

  @Delete()

  /**
   * Cancella l'utente corrente.
   * @returns Una promise che si risolve quando l'utente viene cancellato.
   */
  async deleteMe (@Res({ passthrough: true }) response: FastifyReply) {

    try {
      return await this.meService.deleteMe();
    } finally {
      response.clearCookie(MeService.COOKIE_NICK, { path: "/" });
      response.clearCookie(MeService.COOKIE_CLIENT_ID, { path: "/" });
    }

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

    const success = await this.meService.registerMe(newPlayer?.nickname ?? "");
    const cookieOptions = {
      path: "/",
      httpOnly: true,
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
    };
    response.setCookie(
      MeService.COOKIE_NICK,
      success.nickname,
      cookieOptions,
    );
    response.setCookie(
      MeService.COOKIE_CLIENT_ID,
      this.meService.myClientId,
      cookieOptions,
    );
    return {
      id: success.id,
      isPlaying: success.isPlaying,
      nickname: success.nickname,
    };

  }

}
