import { Injectable, NotFoundException } from '@nestjs/common';
import { PlayerDto } from '../entities/player.dto/player.dto';
import { hasNickname } from '../entities/player.dto/player.dto.utils';
import { ResourceAlredyExistsException } from '../errors/resourceAlredyExists';
import { replacePlaceholders } from '../tools/replacePlaceholders';
import { PLAYERS_MESSAGES } from './players.messages';

/**
 * Servizio per la gestione dei giocatori.
 */
@Injectable()
export class PlayersService {
  #counter = 0;
  #currentPlayers: PlayerDto[] = [];

  /**
   * Restituisce tutti i giocatori attualmente registrati.
   * @returns Un array di oggetti PlayerDto rappresentanti i giocatori.
   */
  getAllPlayers(): PlayerDto[] {
    return this.#currentPlayers;
  }

  /**
   * Aggiunge un nuovo giocatore alla lista dei giocatori registrati.
   * @param nickname Il nickname del giocatore da aggiungere.
   * @returns Un oggetto PlayerDto rappresentante il nuovo giocatore aggiunto.
   * @throws {Error} Se esiste già un giocatore con il nickname specificato.
   */
  async addPlayer(nickname: string): Promise<PlayerDto> {
    if (await this.playerExists(nickname)) {
      throw new ResourceAlredyExistsException(
        replacePlaceholders(PLAYERS_MESSAGES, 'PLAYER_ARLEDY_EXISTS', {
          nickname,
        }),
      );
    }
    const newPlayer = new PlayerDto(this.#counter++, nickname, false);
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
  async playerExists(nickname: string): Promise<boolean> {
    const cp = this.#currentPlayers;
    return cp.some(hasNickname(nickname));
  }
  /**
   * Metodo per ottenere il numero totale di giocatori
   * Questo metodo restituisce la lunghezza dell'array dei giocatori, che rappresenta il numero totale di giocatori.
   */
  async getTotalPlayers(): Promise<number> {
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
  async getPlayer(nickname: string): Promise<PlayerDto> {
    const cp = this.#currentPlayers;
    const player = cp.find(hasNickname(nickname));
    if (!player) {
      throw new NotFoundException(
        replacePlaceholders(PLAYERS_MESSAGES, 'PLAYER_NOT_FOUND', {
          nickname,
        }),
      );
    }
    return player;
  }

  /**
   * Cancella l'elenco dei giocatori attuali.
   * @returns Una Promise che si risolve quando l'elenco dei giocatori viene cancellato.
   */
  async clearPlayers(): Promise<void> {
    this.#currentPlayers = [];
  }

  /**
   * Rimuove un giocatore dalla lista dei giocatori attuali.
   * @param nickname - Il nickname del giocatore da rimuovere.
   * @returns Una Promise che si risolve in un booleano che indica se il giocatore è stato rimosso con successo.
   * @throws Un errore se non esiste un giocatore con il nickname fornito.
   */
  async removePlayer(nickname: string): Promise<boolean> {
    const index = this.#currentPlayers.findIndex(hasNickname(nickname));
    if (index === -1) {
      throw new NotFoundException(
        replacePlaceholders(PLAYERS_MESSAGES, 'PLAYER_NOT_FOUND', {
          nickname,
        }),
      );
    }
    this.#currentPlayers.splice(index, 1);
    return true;
  }
}
