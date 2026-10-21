import { describe, expect, it } from "vitest";
import { GameOneRuleContext, GameOneRuleService } from "./rule-manager.service";

describe("GameOneRuleService", () => {
  const service = new GameOneRuleService();
  const context: GameOneRuleContext = {
    gameId: 42,
    players: [
      { id: 1 },
      { id: 2 },
    ],
  };

  it("initializes the game and stops for character selection", () => {
    const transition = service.initialize(context);

    expect(service.gameType).toBe("eldorasia");
    expect(transition.state.previousAction).toBe("SetPlayngOrder");
    expect(transition.state.allowedNextActions).toEqual([
      "CharacterSelection",
      "CharacterSelectionReady",
      "ResolveCharacterSelection",
    ]);
    expect(transition.state.onboardTiles).toHaveLength(0);
    expect(transition.events).toEqual([]);
  });

  it("collects preferences, resolves assignments, and advances after the reveal", () => {
    const initialized = service.initialize(context);
    const firstSelection = service.applyAction(
      initialized.state,
      {
        phase: "Setup",
        kind: "CharacterSelection",
        playerId: 1,
        characterId: 1,
        characterName: "Chierico",
      },
      context,
    );
    expect(firstSelection.state.allowedNextActions).toContain("CharacterSelectionReady");
    expect(firstSelection.state.characterPreferences).toHaveLength(1);
    expect(firstSelection.state.charactersByPlayers).toHaveLength(0);

    const transition = service.applyAction(
      firstSelection.state,
      {
        phase: "Setup",
        kind: "CharacterSelection",
        playerId: 2,
        characterId: 1,
        characterName: "Chierico",
      },
      context,
    );
    expect(transition.state.phase).toBe("Setup");
    expect(transition.state.characterPreferences).toHaveLength(2);
    expect(transition.state.characterPreferences.map(({ characterId }) => characterId)).toEqual([1, 1]);
    const readyOne = service.applyAction(transition.state, {
      phase: "Setup",
      kind: "CharacterSelectionReady",
      playerId: 1,
    }, context);
    expect(() => service.applyAction(readyOne.state, {
      phase: "Setup",
      kind: "CharacterSelection",
      playerId: 1,
      characterId: 3,
      characterName: "Mago",
    }, context)).toThrow("Non puoi modificare la scelta dopo aver premuto ready.");
    const readyTwo = service.applyAction(readyOne.state, {
      phase: "Setup",
      kind: "CharacterSelectionReady",
      playerId: 2,
    }, context);
    const resolved = service.applyAction(readyTwo.state, {
      phase: "Setup",
      kind: "ResolveCharacterSelection",
    }, context);
    expect(resolved.state.phase).toBe("CharacterReveal");
    expect(resolved.state.charactersByPlayers).toHaveLength(2);
    expect(new Set(resolved.state.charactersByPlayers.map(({ character }) => character.characterId)).size).toBe(2);
    const started = service.applyAction(resolved.state, {
      phase: "CharacterReveal",
      kind: "FinishCharacterReveal",
    }, context);
    expect(started.state.phase).toBe("PlayerTurn");
    expect(started.state.previousAction).toBe("Awake");
    expect(started.state.allowedNextActions).toEqual(["Move", "Fight", "Pass"]);
    expect(started.state.onboardTiles).toHaveLength(1);
    expect(started.state.onboardTiles[0]?.type).toBe("Start");
  });

  it("rejects actions from players outside the game", () => {
    const initialized = service.initialize(context);

    expect(() => service.applyAction(
      initialized.state,
      {
        phase: "PlayerTurn",
        kind: "Move",
        playerId: 99,
        direction: "TL",
      },
      context,
    )).toThrow("Il giocatore non appartiene a questa partita.");
  });

  it("returns a snapshot without circular tile links", () => {
    const initialized = service.initialize(context);
    const beforePlacement = {
      ...initialized.state,
      allowedNextActions: ["PlaceFirstTile" as const],
    };
    const placed = service.applyAction(beforePlacement, {
      phase: "Setup",
      kind: "PlaceFirstTile",
    }, context);
    const snapshot = service.getSnapshot(placed.state, context);

    expect(() => JSON.stringify(snapshot)).not.toThrow();
    expect(snapshot.onboardTiles[0].nodes).toEqual({
      TL: null,
      TR: null,
      R: null,
      BR: null,
      BL: null,
      L: null,
    });
  });
});
