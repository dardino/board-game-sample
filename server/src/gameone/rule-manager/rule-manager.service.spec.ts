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
    expect(transition.state.allowedNextActions).toEqual(["CharacterSelection"]);
    expect(transition.state.onboardTiles).toHaveLength(1);
    expect(transition.events).toEqual([]);
  });

  it("applies character selection and advances to the first player turn", () => {
    const initialized = service.initialize(context);
    const transition = service.applyAction(
      initialized.state,
      {
        phase: "Setup",
        kind: "CharacterSelection",
        selectedCharacters: [
          {
            playerId: 1,
            characterId: 1,
            characterName: "Chierico",
          },
          {
            playerId: 2,
            characterId: 2,
            characterName: "Barbaro",
          },
        ],
      },
      context,
    );

    expect(transition.state.phase).toBe("PlayerTurn");
    expect(transition.state.previousAction).toBe("Awake");
    expect(transition.state.allowedNextActions).toEqual(["Move", "Fight", "Pass"]);
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
    const snapshot = service.getSnapshot(initialized.state, context);

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
