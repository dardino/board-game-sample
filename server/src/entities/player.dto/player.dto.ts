/**
 * Rappresenta un oggetto di trasferimento dati (DTO) per un giocatore.
 */
export class PlayerDto {


  /**
   * Identificatore del giocatore.
   */
  public id: number;

  /**
   * Nickname del giocatore.
   */
  public nickname: string;

  /**
   * Indica se il giocatore sta giocando o meno.
   */
  public isPlaying: boolean;

  /**
   * Crea una nuova istanza di PlayerDto.
   * @param id - L'identificatore del giocatore.
   * @param nickname - Il nickname del giocatore.
   * @param isPlaying - Indica se il giocatore sta giocando o meno.
   */
  constructor (id: number, nickname: string, isPlaying: boolean) {

    this.id = id;
    this.nickname = nickname;
    this.isPlaying = isPlaying;

  }

}
