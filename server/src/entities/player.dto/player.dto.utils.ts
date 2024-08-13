import { PlayerDto } from "./player.dto";

/**
 * Verifica se un giocatore ha un nickname specifico.
 * @param nickname - Il nickname da verificare.
 * @returns Una funzione (predicate) che prende un oggetto `PlayerDto` e restituisce
 *          - `true` se il giocatore ha il nickname specificato,
 *          - `false` altrimenti.
 */
export function hasNickname (nickname: string): Predicate<PlayerDto> {

  return (player) => player.nickname === nickname;

}
