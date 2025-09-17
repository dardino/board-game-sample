export const PLAYERS_MESSAGES = {
  PLAYER_ALREADY_EXISTS: "Esiste già un giocatore con il nickname ${nickname}",
  PLAYER_NOT_FOUND: "Non esiste un giocatore con il nickname ${nickname}",
  PLAYER_ADDED: "Giocatore ${nickname} aggiunto con successo",
  PLAYER_REMOVED: "Giocatore ${nickname} rimosso con successo",
  CLIENT_ID_REQUIRED: "Impossibile registrare il giocatore senza clientId",
} as const;
