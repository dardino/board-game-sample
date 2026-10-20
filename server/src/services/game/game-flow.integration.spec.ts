import { GameOneRuleService } from "@/gameone/rule-manager/rule-manager.service";
import { CHARACTERS } from "@/gameone/gameone-contents";
import { GameoneState } from "@/gameone/rules/state.types";
import { LobbyEventsService } from "@/services/game/lobby-events.service";
import { PlayersService } from "@/services/players/players.service";
import { GamesServices } from "./games.service";
import { describe, expect, it } from "vitest";

function isGameoneState (state: unknown): state is GameoneState {
  return typeof state === "object" &&
    state !== null &&
    "allowedNextActions" in state &&
    Array.isArray(state.allowedNextActions);
}

describe("Complete game flow", () => {
  it("registers four players, starts their game, and assigns each a character", async () => {
    const playersService = new PlayersService();
    const ruleService = new GameOneRuleService();
    const gamesService = new GamesServices(
      playersService,
      ruleService,
      new LobbyEventsService(),
    );
    const nicknames = ["owner", "player-two", "player-three", "player-four"];

    for (const [index, nickname] of nicknames.entries()) {
      await playersService.addPlayer(nickname, `client-${index}`);
    }

    const game = await gamesService.createNewGame(nicknames[0], "Integration game");
    for (const nickname of nicknames.slice(1)) {
      await gamesService.joinToGame(nickname, game.gameId);
    }

    expect(game.connectedPlayers.map((player) => player.nickname)).toEqual(nicknames);

    await gamesService.startGame(nicknames[0], game.gameId);
    expect(game.startedAt).toBeInstanceOf(Date);
    expect(isGameoneState(game.ruleState)).toBe(true);
    if (!isGameoneState(game.ruleState)) {
      throw new Error("The started game does not contain a valid Eldorasia state.");
    }
    expect(game.ruleState.allowedNextActions).toEqual(["CharacterSelection"]);

    const context = {
      gameId: game.gameId,
      players: game.connectedPlayers,
    };
    const selection = ruleService.applyAction(
      game.ruleState,
      {
        phase: "Setup",
        kind: "CharacterSelection",
        selectedCharacters: game.connectedPlayers.map((player, index) => ({
          playerId: player.id,
          characterId: CHARACTERS[index].characterId,
          characterName: CHARACTERS[index].characterClass,
        })),
      },
      context,
    );

    expect(selection.state.phase).toBe("PlayerTurn");
    expect(selection.state.charactersByPlayers).toHaveLength(4);
    expect(selection.state.charactersByPlayers.map(({ playerId, character }) => ({
      playerId,
      characterName: character.characterName,
    }))).toEqual(game.connectedPlayers.map((player, index) => ({
      playerId: player.id,
      characterName: CHARACTERS[index].characterClass,
    })));
  });
});
