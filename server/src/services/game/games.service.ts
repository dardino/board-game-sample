import { GameJoinException } from "@/errors/gameJoin";
import { GameStartException } from "@/errors/gameStart";
import { GameOneRuleService } from "@/gameone/rule-manager/rule-manager.service";
import { AllPossibleAction, GameoneState } from "@/gameone/rules/state.types";
import { CHARACTERS } from "@/gameone/gameone-contents";
import {
  GameChatMessage,
  GameStateEvent,
  MAX_GAME_CHAT_MESSAGE_LENGTH,
} from "@dto/game-state.dto/game-state.dto";
import { GameDto } from "@dto/matchmaking/game.dto";
import { PlayersService } from "@/services/players/players.service";
import { LobbyEventsService } from "@/services/game/lobby-events.service";
import { replacePlaceholders } from "@/tools/replacePlaceholders";
import { hasNickname } from "@/utils/player.dto.utils";
import { OkResponse } from "@dto/okResponse";
import { GAME_MESSAGES } from "@models/game.model/game.messages";
import { GameModel } from "@models/game.model/game.model";
import { Inject, Injectable } from "@nestjs/common";

function isAvailableGame (game: GameModel): boolean {
  return game.startedAt == null && game.connectedPlayers.length < game.maxPlayers;
}

function isGameoneState (state: unknown): state is GameoneState {
  return typeof state === "object" &&
    state !== null &&
    "phase" in state &&
    "players" in state &&
    Array.isArray(state.players) &&
    "currentPlayerIndex" in state &&
    typeof state.currentPlayerIndex === "number" &&
    "allowedNextActions" in state &&
    Array.isArray(state.allowedNextActions);
}

export const GAME_RECONNECT_GRACE_PERIOD_MS = 15_000;

interface GameReconnectPause {
  disconnectedPlayerIds: Set<number>;
  resumesAt: number;
  remainingCharacterSelectionMs: number | null;
  timeout: ReturnType<typeof setTimeout> | null;
}

@Injectable()
export class GamesServices {

  #allGames: GameModel[] = [];

  #characterSelectionTimers = new Map<number, ReturnType<typeof setTimeout>>();

  #reconnectPauses = new Map<number, GameReconnectPause>();

  /**
   *
   */
  constructor (
    @Inject(PlayersService) private readonly playersService: PlayersService,
    @Inject(GameOneRuleService) private readonly ruleManagerService: GameOneRuleService,
    @Inject(LobbyEventsService) private readonly lobbyEvents: LobbyEventsService,
  ) {
    //
  }

  async getList (): Promise<GameModel[]> {

    return this.#allGames;

  }

  protected setGames (games: GameModel[]) {

    this.#allGames = games;

  }

  /**
   * Retrieves the list of free games.
   * A game is considered free if the number of connected players is less than the total number of players.
   * @returns An array of free games.
   */
  async getFreeGames () {

    return this.#allGames.filter(isAvailableGame);

  }

  /**
   * Retrieves the games in which the specified nickname is connected.
   *
   * @param nickname - The nickname of the player.
   * @returns An array of games in which the player is connected.
   */
  async getGamesIAmConnectedIn (nickname: string) {

    return this.#allGames.filter((game) => game.connectedPlayers.some(hasNickname(nickname)));

  }

  async gameById (gameId: GameModel["gameId"]) {

    const game = this.#allGames.find((game) => game.gameId === gameId);
    if (!game) {

      throw new GameJoinException({ message: replacePlaceholders(
        GAME_MESSAGES,
        "GAME_NOT_FOUND",
        { gameIdString: gameId.toString() },
      ),
      internalCode: 1001,
      gameId });

    } else {

      return game;

    }
  }

  getGameStatsById (gameId: GameModel["gameId"]): GameDto {
    const game = this.#allGames.find((currentGame) => currentGame.gameId === gameId);
    if (!game) {
      throw new GameJoinException({
        message: replacePlaceholders(
          GAME_MESSAGES,
          "GAME_NOT_FOUND",
          { gameIdString: gameId.toString() },
        ),
        internalCode: 1001,
        gameId,
      });
    }
    return this.getGameStats(game);
  }

  getAvailableGameStats (): GameDto[] {
    return this.#allGames.filter(isAvailableGame).map((game) => this.getGameStats(game));
  }

  getGameState (gameId: number): GameStateEvent {
    const { game, state } = this.#getStartedGame(gameId);
    const currentPlayerId = state.players[state.currentPlayerIndex];
    const currentPlayer = game.connectedPlayers.find((player) => player.id === currentPlayerId);

    return {
      type: "game-state",
      gameId: game.gameId,
      gameType: game.gameType,
      phase: state.phase,
      currentPlayer: currentPlayer?.nickname ?? null,
      turnPhase: state.phase === "PlayerTurn"
        ? state.previousAction
        : state.phase === "CharacterReveal"
          ? "CharacterReveal"
          : state.allowedNextActions[0] ?? state.previousAction,
      allowedActions: state.allowedNextActions,
      chat: {
        messages: game.chat.messages.map((message) => ({ ...message })),
      },
      characterSelection: {
        stage: game.characterSelectionStage,
        endsAt: game.characterSelectionEndsAt,
        readyPlayerIds: game.characterSelectionStage === "choosing"
          ? state.characterSelectionReadyPlayers
          : state.characterRevealReadyPlayers,
        players: game.connectedPlayers.map((player) => ({
          playerId: player.id,
          nickname: player.nickname,
        })),
        availableCharacters: CHARACTERS.map((character) => ({
          characterId: character.characterId,
          characterClass: character.characterClass,
          startingLife: character.startingLife,
          startingEnergy: character.startingEnergy,
          movementSpeed: character.movementSpeed,
          defence: character.defence,
        })),
        selectedCharacters: game.characterSelectionStage === "choosing"
          ? state.characterPreferences.map(({ playerId, characterId, characterName }) => ({
            playerId,
            nickname: game.connectedPlayers.find((player) => player.id === playerId)?.nickname ?? "",
            characterId,
            characterName,
          }))
          : state.charactersByPlayers.map(({ playerId, character }) => ({
            playerId,
            nickname: game.connectedPlayers.find((player) => player.id === playerId)?.nickname ?? "",
            characterId: character.characterId,
            characterName: character.characterName,
          })),
      },
      reconnection: this.#getReconnectionStatus(game.gameId),
      state: this.ruleManagerService.getSnapshot(state),
    };
  }

  pauseForReconnect (gameId: number, playerId: number) {
    const game = this.#allGames.find((candidate) => candidate.gameId === gameId);
    if (!game?.startedAt || !game.connectedPlayers.some((player) => player.id === playerId)) return;

    let pause = this.#reconnectPauses.get(gameId);
    if (pause) {
      if (pause.disconnectedPlayerIds.has(playerId)) return;
      pause.disconnectedPlayerIds.add(playerId);
    } else {
      const now = Date.now();
      const remainingCharacterSelectionMs = game.characterSelectionEndsAt === null
        ? null
        : Math.max(0, game.characterSelectionEndsAt - now);
      const selectionTimer = this.#characterSelectionTimers.get(gameId);
      if (selectionTimer) clearTimeout(selectionTimer);
      this.#characterSelectionTimers.delete(gameId);

      pause = {
        disconnectedPlayerIds: new Set([playerId]),
        resumesAt: now + GAME_RECONNECT_GRACE_PERIOD_MS,
        remainingCharacterSelectionMs,
        timeout: null,
      };
      this.#reconnectPauses.set(gameId, pause);
    }

    this.#scheduleReconnectTimeout(gameId, pause);
    this.#publishGameStateUpdate(gameId);
  }

  resumeAfterReconnect (gameId: number, playerId: number) {
    const pause = this.#reconnectPauses.get(gameId);
    if (!pause || !pause.disconnectedPlayerIds.delete(playerId)) return;

    if (pause.disconnectedPlayerIds.size === 0) {
      this.#resumeGame(gameId);
      return;
    }
    this.#publishGameStateUpdate(gameId);
  }

  getGameStateForPlayer (gameId: number, playerId: number): GameStateEvent {
    const { game } = this.#getStartedGame(gameId);
    if (!game.connectedPlayers.some((player) => player.id === playerId)) {
      throw this.#playerNotInGame(gameId, playerId);
    }
    return this.getGameState(gameId);
  }

  addChatMessage (gameId: number, playerId: number, message: string): GameStateEvent {
    const { game } = this.#getStartedGame(gameId);
    const player = game.connectedPlayers.find((candidate) => candidate.id === playerId);
    if (!player) throw this.#playerNotInGame(gameId, playerId);
    const text = message.trim();
    if (text.length === 0 || text.length > MAX_GAME_CHAT_MESSAGE_LENGTH) {
      throw new Error(`Chat messages must contain between 1 and ${MAX_GAME_CHAT_MESSAGE_LENGTH} characters.`);
    }

    const chatMessage: GameChatMessage = {
      playerId,
      nickname: player.nickname,
      text,
      sentAt: new Date().toISOString(),
    };
    game.chat.messages.push(chatMessage);
    this.lobbyEvents.publishGameStateUpdate(game.gameId);
    return this.getGameState(gameId);
  }

  applyGameAction (gameId: number, actorPlayerId: number, action: AllPossibleAction): GameStateEvent {
    const { game, state } = this.#getStartedGame(gameId);
    if (this.#reconnectPauses.has(gameId) &&
      Date.now() >= (this.#reconnectPauses.get(gameId)?.resumesAt ?? 0)) {
      this.#resumeGame(gameId);
    }
    if (this.#reconnectPauses.has(gameId)) {
      throw new Error("The game is paused while waiting for players to reconnect.");
    }
    if (game.characterSelectionEndsAt !== null && Date.now() >= game.characterSelectionEndsAt) {
      if (game.characterSelectionStage === "choosing") {
        this.#resolveCharacterSelection(game, state);
      } else if (game.characterSelectionStage === "revealing") {
        this.#finishCharacterReveal(game, state);
      }
      this.#publishGameUpdate(game);
      throw new Error("Il timer della fase è scaduto.");
    }
    if (!game.connectedPlayers.some((player) => player.id === actorPlayerId)) {
      throw new Error("Il giocatore non appartiene a questa partita.");
    }
    if ("playerId" in action && action.playerId !== actorPlayerId) {
      throw new Error("L'azione non corrisponde al giocatore mittente.");
    }
    const transition = this.ruleManagerService.applyAction(
      state,
      action,
      {
        gameId: game.gameId,
        players: game.connectedPlayers,
      },
    );
    game.ruleState = transition.state;
    if (action.kind === "CharacterSelectionReady" &&
      state.players.every((playerId) => transition.state.characterSelectionReadyPlayers.includes(playerId))) {
      this.#resolveCharacterSelection(game, transition.state);
    } else if (action.kind === "CharacterRevealReady" &&
      state.players.every((playerId) => transition.state.characterRevealReadyPlayers.includes(playerId))) {
      this.#finishCharacterReveal(game, transition.state);
    }
    this.#publishGameUpdate(game);
    return this.getGameState(gameId);
  }

  #getStartedGame (gameId: number): { game: GameModel;
    state: GameoneState; } {
    const game = this.#allGames.find((currentGame) => currentGame.gameId === gameId);
    if (!game) {
      throw new GameJoinException({
        message: replacePlaceholders(
          GAME_MESSAGES,
          "GAME_NOT_FOUND",
          { gameIdString: gameId.toString() },
        ),
        internalCode: 1001,
        gameId,
      });
    }
    if (game.startedAt === null || !isGameoneState(game.ruleState)) {
      throw new Error("The game state is not available.");
    }
    return { game,
      state: game.ruleState };
  }

  #playerNotInGame (gameId: number, playerId: number): GameJoinException {
    return new GameJoinException({
      message: replacePlaceholders(
        GAME_MESSAGES,
        "PLAYER_NOT_IN_GAME",
        { playername: playerId.toString() },
      ),
      internalCode: 1005,
      gameId,
    });
  }

  /**
   * Joins a player to a game.
   *
   * @param nickname - The nickname of the player.
   * @param gameId - The ID of the game.
   * @returns A string indicating the result of the operation.
   * @throws {GameJoinException} If the game is not found, player is not found, the game is full or already started.
   */
  async joinToGame (nickname: string, gameId: number) {

    const player = await this.playersService.getPlayer(nickname);
    const game = this.#allGames.find((game) => game.gameId === gameId);
    const gameIdString = gameId.toString();
    if (!game) {

      throw new GameJoinException({ message: replacePlaceholders(
        GAME_MESSAGES,
        "GAME_NOT_FOUND",
        { gameIdString },
      ),
      internalCode: 1001,
      gameId });

    }

    if (game.startedAt != null) {

      throw new GameJoinException({ message: replacePlaceholders(
        GAME_MESSAGES,
        "GAME_ALREDY_STARTED",
        { gameIdString },
      ),
      internalCode: 1002,
      gameId });

    }

    if (game.connectedPlayers.some(hasNickname(nickname))) {

      return new OkResponse(replacePlaceholders(
        GAME_MESSAGES,
        "PLAYER_JOINED",
        { playername: nickname },
      ));

    }

    if (game.connectedPlayers.length >= game.maxPlayers) {

      throw new GameJoinException({ message: replacePlaceholders(
        GAME_MESSAGES,
        "GAME_IS_FULL",
        {},
      ),
      internalCode: 1004,
      gameId });

    }

    game.connectedPlayers.push(player);
    player.isPlaying = true;
    this.#publishGameUpdate(game);

    return new OkResponse(replacePlaceholders(
      GAME_MESSAGES,
      "PLAYER_JOINED",
      { playername: player.nickname },
    ));

  }

  /**
   * Start a game if game is ready to go.
   *
   * @param nickname - The nickname of the player.
   * @param gameId - The ID of the game.
   * @returns A date indicating the starting time.
   * @throws {GameStartException} If the game is not found, player is not found, player is already connected to the game, the game is full or already started.
   */
  async startGame (nickname: string, gameId: number) {

    const game = this.#allGames.find((game) => game.gameId === gameId);
    const gameIdString = gameId.toString();
    if (!game) {

      throw new GameStartException(
        replacePlaceholders(
          GAME_MESSAGES,
          "GAME_NOT_FOUND",
          { gameIdString },
        ),
        2001,
      );

    }

    if (game.connectedPlayers.length < game.minPlayersToStart) {

      throw new GameStartException(
        replacePlaceholders(
          GAME_MESSAGES,
          "GAME_IS_NOT_FULL",
          { },
        ),
        2002,
      );

    }

    if (game.startedAt != null) {

      throw new GameStartException(
        replacePlaceholders(
          GAME_MESSAGES,
          "GAME_ALREDY_STARTED",
          { },
        ),
        2003,
      );

    }

    if (game.connectedPlayers[0].nickname !== nickname) {

      throw new GameStartException(
        replacePlaceholders(
          GAME_MESSAGES,
          "YOU_ARE_NOT_THE_GAME_OWNER",
          { },
        ),
        2004,
      );

    }

    const transition = this.ruleManagerService.initialize({
      gameId: game.gameId,
      players: game.connectedPlayers,
    });
    game.ruleState = transition.state;
    game.startedAt = new Date();
    game.characterSelectionStage = "choosing";
    game.characterSelectionEndsAt = Date.now() + 30_000;
    this.#scheduleCharacterSelectionTimer(game, 30_000);
    this.#publishGameUpdate(game);
    return new OkResponse(replacePlaceholders(
      GAME_MESSAGES,
      "GAME_STARTED",
      {},
    ));

  }

  /**
   * Removes a player from a game.
   * @param nickname the nickname of the player to be removed
   * @param gameId the ID of the game from which the player should be removed
   * @returns A string indicating the result of the operation.
   * @throws {GameJoinException} If the game is not found, player is not found, or player is not connected to the game.
   */
  async leaveGame (nickname: string, gameId: number) {
    const game = this.#allGames.find((game) => game.gameId === gameId);
    const gameIdString = gameId.toString();
    if (!game) {
      throw new GameJoinException({
        message: replacePlaceholders(GAME_MESSAGES, "GAME_NOT_FOUND", { gameIdString }),
        internalCode: 1001,
        gameId,
      });
    }

    if (!game.connectedPlayers.some(hasNickname(nickname))) {
      throw new GameJoinException({
        message: replacePlaceholders(GAME_MESSAGES, "PLAYER_NOT_IN_GAME", { playername: nickname }),
        internalCode: 1005,
        gameId,
      });
    }

    game.connectedPlayers = game.connectedPlayers.filter((p) => p.nickname !== nickname);

    if (game.createdBy === nickname) {
      if (game.connectedPlayers.length === 0) {
        this.#allGames = this.#allGames.filter((currentGame) => currentGame.gameId !== gameId);
        this.lobbyEvents.publish({
          type: "game-removed",
          gameId,
        });
      } else {
        game.createdBy = game.connectedPlayers[0].nickname;
      }
    }
    if (this.#allGames.includes(game)) {
      this.#publishGameUpdate(game);
    } else {
      this.#publishLobbyUpdate();
    }

    return new OkResponse(replacePlaceholders(
      GAME_MESSAGES,
      "PLAYER_LEFT",
      { playername: nickname },
    ));
  }

  /**
   * Crea una istanza di partita
   * @param nickname nikname del creatore della partita
   * @param gameTitle titolo della partita
   * @returns istanza del gioco creato
   */
  async createNewGame (nickname: string, gameTitle: string) {

    const player = await this.playersService.getPlayer(nickname);
    const newGame = await GameModel.createGame(
      gameTitle,
      player,
      this.ruleManagerService.gameType,
    );
    this.#allGames.push(newGame);
    this.#publishGameUpdate(newGame);
    return newGame;

  }

  /**
   * Restituisce un oggetto contenente le informazioni utili ad un giocatore per collegarsi ad una partita
   * @param gameId identificativo della partita
   * @returns un oggetto con le informazioni sulla partita
   */
  getGameStats (game: GameModel): GameDto {

    return {
      elapsed: game.startedAt
        ? Date.now() - game.startedAt.valueOf()
        : null,
      gameId: game.gameId,
      joinedPlayers: game.connectedPlayers.length,
      playersMax: game.maxPlayers,
      playersMin: game.minPlayersToStart,
      players: game.connectedPlayers.map((player) => player.nickname),
      createdBy: game.createdBy,
      title: game.gameTitle,
    };

  }

  #publishGameUpdate (game: GameModel) {
    this.lobbyEvents.publish({
      type: "game-updated",
      game: this.getGameStats(game),
    });
    this.#publishLobbyUpdate();
  }

  #scheduleCharacterSelectionTimer (game: GameModel, delay: number) {
    const existingTimer = this.#characterSelectionTimers.get(game.gameId);
    if (existingTimer) clearTimeout(existingTimer);

    const timer = setTimeout(() => {
      const state = game.ruleState;
      if (!isGameoneState(state)) throw new Error("The game state is not available.");
      if (game.characterSelectionStage === "choosing") {
        this.#resolveCharacterSelection(game, state);
      } else if (game.characterSelectionStage === "revealing") {
        this.#finishCharacterReveal(game, state);
      }
      this.#publishGameUpdate(game);
    }, delay);
    timer.unref?.();
    this.#characterSelectionTimers.set(game.gameId, timer);
  }

  #getReconnectionStatus (gameId: number) {
    const pause = this.#reconnectPauses.get(gameId);
    return {
      paused: pause !== undefined,
      resumesAt: pause?.resumesAt ?? null,
      disconnectedPlayerIds: pause
        ? [...pause.disconnectedPlayerIds]
        : [],
    };
  }

  #scheduleReconnectTimeout (gameId: number, pause: GameReconnectPause) {
    if (pause.timeout !== null) clearTimeout(pause.timeout);
    pause.resumesAt = Date.now() + GAME_RECONNECT_GRACE_PERIOD_MS;
    pause.timeout = setTimeout(
      () => this.#resumeAfterReconnectWindow(gameId),
      GAME_RECONNECT_GRACE_PERIOD_MS,
    );
    pause.timeout.unref?.();

    const game = this.#allGames.find((candidate) => candidate.gameId === gameId);
    if (game && pause.remainingCharacterSelectionMs !== null) {
      game.characterSelectionEndsAt = pause.resumesAt + pause.remainingCharacterSelectionMs;
    }
  }

  #resumeAfterReconnectWindow (gameId: number) {
    this.#resumeGame(gameId);
  }

  #resumeGame (gameId: number) {
    const pause = this.#reconnectPauses.get(gameId);
    if (!pause) return;
    if (pause.timeout !== null) clearTimeout(pause.timeout);
    this.#reconnectPauses.delete(gameId);
    const game = this.#allGames.find((candidate) => candidate.gameId === gameId);
    if (game && pause.remainingCharacterSelectionMs !== null) {
      game.characterSelectionEndsAt = Date.now() + pause.remainingCharacterSelectionMs;
      this.#scheduleCharacterSelectionTimer(game, pause.remainingCharacterSelectionMs);
    }
    this.#publishGameStateUpdate(gameId);
  }

  #publishGameStateUpdate (gameId: number) {
    this.lobbyEvents.publishGameStateUpdate(gameId);
  }

  #resolveCharacterSelection (game: GameModel, state: GameoneState) {
    const timer = this.#characterSelectionTimers.get(game.gameId);
    if (timer) clearTimeout(timer);
    const transition = this.ruleManagerService.applyAction(
      state,
      {
        phase: "Setup",
        kind: "ResolveCharacterSelection",
      },
      { gameId: game.gameId, players: game.connectedPlayers },
    );
    game.ruleState = transition.state;
    game.characterSelectionStage = "revealing";
    game.characterSelectionEndsAt = Date.now() + 10_000;
    this.#scheduleCharacterSelectionTimer(game, 10_000);
  }

  #finishCharacterReveal (game: GameModel, state: GameoneState) {
    const timer = this.#characterSelectionTimers.get(game.gameId);
    if (timer) clearTimeout(timer);
    const transition = this.ruleManagerService.applyAction(
      state,
      {
        phase: "CharacterReveal",
        kind: "FinishCharacterReveal",
      },
      { gameId: game.gameId, players: game.connectedPlayers },
    );
    game.ruleState = transition.state;
    game.characterSelectionStage = null;
    game.characterSelectionEndsAt = null;
    this.#characterSelectionTimers.delete(game.gameId);
  }

  #publishLobbyUpdate () {
    this.lobbyEvents.publish({
      type: "lobbies-updated",
      games: this.getAvailableGameStats(),
    });
  }

}
