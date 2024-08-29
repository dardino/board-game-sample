export const GAME_MESSAGES = {
  GAME_NOT_FOUND: "Partita non trovata! (${gameIdString})",
  GAME_STARTED: "Partita iniziata!",
  PLAYER_ALREDY_IN_GAME: "Il giocatore ${playername} è già in partita",
  GAME_IS_FULL: "La partita è già completa",
  GAME_ALREDY_STARTED: "La partita è già iniziata",
  PLAYER_JOINED: "Il giocatore ${playername} correattmente unito alla partita",
  GAME_IS_NOT_FULL:
    "La partita non ha ancora un numero sufficiente di giocatori",
  YOU_ARE_NOT_THE_GAME_OWNER:
    "Tu non sei il creatore del game e quindi non puoi farlo partire",
  ERROR_STARTING_GAME:
    "Si è verificata una condizione imprevista, pertanto non è stato possibile avviare la partita",
} as const;
