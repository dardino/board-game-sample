import { Inject, Injectable, Scope } from "@nestjs/common";
import { REQUEST } from "@nestjs/core";
import { FastifyRequest } from "fastify";
import { PlayerDto } from "../entities/player.dto/player.dto";
import { PlayersService } from "../players/players.service";

@Injectable({ scope: Scope.REQUEST })
export class MeService {

  public static COOKIE_NICK = "player.nickname" as const;

  #myNickName: string;

  /**
   * Costruisce una nuova istanza del servizio MeService.
   *
   * @param playersService Il servizio PlayersService utilizzato per gestire i giocatori.
   * @param request L'oggetto FastifyRequest utilizzato per ottenere informazioni sulla richiesta.
   */
  constructor (
    private readonly playersService: PlayersService,
    @Inject(REQUEST) request: FastifyRequest,
  ) {

    this.#myNickName = request.cookies[MeService.COOKIE_NICK] ?? "";

  }

  /**
   * Registra un nuovo utente con il nickname specificato.
   * @param nickName Il nickname dell'utente da registrare.
   * @returns Una Promise che restituisce il risultato dell'aggiunta del giocatore.
   */
  async registerMe (nickName: string) {

    return await this.playersService.addPlayer(nickName);

  }


  /**
   * Elimina il giocatore con il nickname specificato.
   * @returns Un booleano che indica se il giocatore è stato eliminato con successo.
   */
  async deleteMe () {

    return await this.playersService.removePlayer(this.#myNickName);

  }

  /**
   * Recupera le informazioni del giocatore per il nickname specificato.
   * @returns Una Promise che si risolve in un oggetto PlayerDto se il giocatore viene trovato.
   */
  async getMe (): Promise<PlayerDto> {

    const player = await this.playersService.getPlayer(this.#myNickName);
    return player;

  }

}
