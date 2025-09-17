import { Injectable, NotFoundException } from "@nestjs/common";
import { RegisterCodes, RegisterException } from "src/errors/register";
import { PlayerDto } from "../entities/player.dto/player.dto";
import { replacePlaceholders } from "../tools/replacePlaceholders";
import { hasNickname } from "../utils/player.dto.utils";
import { PLAYERS_MESSAGES } from "./players.messages";

class PlayerWithClientId extends PlayerDto {

  clientId: string;

  constructor (id: number, nickname: string, isPlaying: boolean, clientId: string) {

    super(id, nickname, isPlaying);
    this.clientId = clientId;

  }

}

/**
 * Servizio per la gestione dei giocatori.
 */
@Injectable()
export class PlayersService {

  #counter = 0;

  #currentPlayers: PlayerWithClientId[] = [];

  /**
   * Restituisce tutti i giocatori attualmente registrati.
   * @returns Un array di oggetti PlayerDto rappresentanti i giocatori.
   */
  getAllPlayers (): PlayerDto[] {

    return this.#currentPlayers;

  }

  /**
   * Aggiunge un nuovo giocatore alla lista dei giocatori registrati.
   * @param nickname Il nickname del giocatore da aggiungere.
   * @returns Un oggetto PlayerDto rappresentante il nuovo giocatore aggiunto.
   * @throws {Error} Se esiste già un giocatore con il nickname specificato.
   */
  async addPlayer (nickname: string, clientId: string): Promise<PlayerDto> {

    // se il clientId non è specificato lancio un errore
    if (!clientId) {
      throw new RegisterException(
        replacePlaceholders(PLAYERS_MESSAGES, "CLIENT_ID_REQUIRED", {}),
        RegisterCodes.INVALID_CLIENT_ID,
      );
    }

    // Controlla se esiste già un giocatore con lo stesso nickname e clientId
    if (await this.playerExistsWithClientId(nickname, clientId)) {
      // se esiste, restituisco quello perché significa che è lo stesso utente che si sta riconnettendo
      return this.#currentPlayers.find(hasNickname(nickname))!;
    }

    if (await this.playerExists(nickname)) {
      // se esiste un giocatore con lo stesso nickname ma clientId diverso, lancio l'eccezione
      throw new RegisterException(
        replacePlaceholders(PLAYERS_MESSAGES, "PLAYER_ALREADY_EXISTS", { nickname }),
        RegisterCodes.NICKNAME_ALREADY_EXISTS,
      );

    }

    // Crea un nuovo giocatore e aggiungilo alla lista
    const newPlayer = new PlayerWithClientId(
      this.#counter++,
      nickname,
      false,
      clientId,
    );
    this.#currentPlayers.push(newPlayer);
    return newPlayer;

  }


  /**
   * Metodo per verificare se esiste un giocatore con un dato nickname
   * Questo metodo cerca nell'array dei giocatori un giocatore con il nickname specificato.
   * Restituisce true se il giocatore esiste, altrimenti false.
   * @param nickname Il nickname del giocatore da verificare.
   * @returns Un booleano che indica se il giocatore esiste o no.
   */
  async playerExists (nickname: string): Promise<boolean> {

    const cp = this.#currentPlayers;
    return cp.some(hasNickname(nickname));

  }

  /**
   * Verifica se esiste un giocatore con un dato nickname e clientId
   * @param nickname Il nickname del giocatore da verificare.
   * @param clientId Il clientId del giocatore da verificare.
   * @returns Un booleano che indica se il giocatore esiste o no.
   */
  async playerExistsWithClientId (nickname: string, clientId: string): Promise<boolean> {
    const cp = this.#currentPlayers;
    return cp.some((p) => hasNickname(nickname)(p) && p.clientId === clientId);
  }

  /**
   * Metodo per ottenere il numero totale di giocatori
   * Questo metodo restituisce la lunghezza dell'array dei giocatori, che rappresenta il numero totale di giocatori.
   */
  async getTotalPlayers (): Promise<number> {

    return this.#currentPlayers.length;

  }

  /**
   * Metodo per ottenere un giocatore specifico in base al suo nickname
   * Questo metodo cerca nell'array dei giocatori un giocatore con il nickname specificato.
   * Se il giocatore esiste, viene restituito. Altrimenti, viene lanciata un'eccezione.
   * @param nickname Il nickname del giocatore da cercare.
   * @returns Un oggetto PlayerDto rappresentante il giocatore cercato.
   * @throws {Error} Se non esiste un giocatore con il nickname specificato.
   */
  async getPlayer (nickname: string): Promise<PlayerDto> {

    const cp = this.#currentPlayers;
    const player = cp.find(hasNickname(nickname));
    if (!player) {

      throw new NotFoundException(replacePlaceholders(
        PLAYERS_MESSAGES,
        "PLAYER_NOT_FOUND",
        {
          nickname,
        },
      ));

    }
    return player;

  }

  /**
   * Cancella l'elenco dei giocatori attuali.
   * @returns Una Promise che si risolve quando l'elenco dei giocatori viene cancellato.
   */
  async clearPlayers (): Promise<void> {

    this.#currentPlayers = [];

  }

  /**
   * Rimuove un giocatore dalla lista dei giocatori attuali.
   * @param nickname - Il nickname del giocatore da rimuovere.
   * @returns Una Promise che si risolve in un booleano che indica se il giocatore è stato rimosso con successo.
   * @throws Un errore se non esiste un giocatore con il nickname fornito.
   */
  async removePlayer (nickname: string): Promise<boolean> {

    const index = this.#currentPlayers.findIndex(hasNickname(nickname));
    if (index === -1) {

      throw new NotFoundException(replacePlaceholders(
        PLAYERS_MESSAGES,
        "PLAYER_NOT_FOUND",
        {
          nickname,
        },
      ));

    }
    this.#currentPlayers.splice(
      index,
      1,
    );
    return true;

  }

}
