import {
  BOSS_ENEMIES,
  BOSS_TILES,
  CHARACTERS,
  OTHER_TILES,
  STARTING_TILES,
} from "./gameone-contents";
import { applyAction, GameOneMatchManager } from "./gameone-rules";
import { Flow } from "./rules/gameone.flow";
import { prepareTile } from "./rules/gameone.tile.helpers";
import {
  AllPossibleActionKind,
  GamePhases,
  getInitialState,
} from "./rules/state.types";

describe("GameOne - Rules", () => {

  describe("Setup Phase", () => {

    it("init", () => {

      const initialGameState = getInitialState();
      expect(initialGameState.allowedNextActions).toStrictEqual(["SetPlayers"]);

    });
    it("Action SetPlayers as first action", () => {

      const initialGameState = getInitialState();
      const newState = applyAction(
        initialGameState,
        {
          phase: "Setup",
          kind: "SetPlayers",
          players: [
            1,
            2,
            3,
            4,
          ],
        },
      );
      expect(newState.previousAction).toBe("SetPlayers");
      expect(newState.allowedNextActions).toStrictEqual(["DrawBoss"]);

    });
    it("Action DrawBoss", () => {

      const initialGameState = getInitialState();
      initialGameState.allowedNextActions = ["DrawBoss"];
      expect(initialGameState.boss).toBeNull();
      const newState = applyAction(
        initialGameState,
        {
          phase: "Setup",
          kind: "DrawBoss",
        },
      );
      expect(newState.previousAction).toBe("DrawBoss");
      expect(newState.boss).not.toBeNull();
      expect(newState.allowedNextActions).toStrictEqual(["ShuffleTiles"]);

    });
    it("Action ShuffleTiles", () => {

      const initialGameState = getInitialState();
      initialGameState.boss = BOSS_ENEMIES[0];
      initialGameState.allowedNextActions = ["ShuffleTiles"];
      const newState = applyAction(
        initialGameState,
        {
          phase: "Setup",
          kind: "ShuffleTiles",
        },
      );
      expect(newState.previousAction).toBe("ShuffleTiles");
      expect(newState.allowedNextActions).toStrictEqual(["PlaceFirstTile"]);

    });
    it("Action PlaceFirstTile", () => {

      const initialGameState = getInitialState();
      initialGameState.boss = BOSS_ENEMIES[0];
      initialGameState.players = [
        1,
        2,
        3,
        4,
      ];
      initialGameState.allowedNextActions = ["PlaceFirstTile"];
      const newState = applyAction(
        initialGameState,
        {
          phase: "Setup",
          kind: "PlaceFirstTile",
        },
      );
      expect(newState.onboardTiles.length).toBe(1);
      expect(newState.onboardTiles[0].playersIn).toStrictEqual([
        1,
        2,
        3,
        4,
      ]);
      expect(newState.previousAction).toBe("PlaceFirstTile");
      expect(newState.allowedNextActions).toStrictEqual(["SetPlayngOrder"]);

    });
    it("Action SetPlayngOrder", () => {

      const initialGameState = getInitialState();
      initialGameState.boss = BOSS_ENEMIES[0];
      initialGameState.players = [
        1,
        2,
        3,
        4,
      ];
      initialGameState.allowedNextActions = ["SetPlayngOrder"];
      const newState = applyAction(
        initialGameState,
        {
          phase: "Setup",
          kind: "SetPlayngOrder",
        },
      );
      expect(newState.previousAction).toBe("SetPlayngOrder");
      expect(newState.allowedNextActions).toStrictEqual(["CharacterSelection"]);

    });
    it("Action CharacterSelection", () => {

      const initialGameState = getInitialState();
      initialGameState.boss = BOSS_ENEMIES[0];
      initialGameState.allowedNextActions = ["CharacterSelection"];
      const newState = applyAction(
        initialGameState,
        {
          phase: "Setup",
          kind: "CharacterSelection",
          selectedCharacters: [
            { characterId: 1,
              characterName: "Giocatore 1",
              playerId: 1 },
            { characterId: 2,
              characterName: "Giocatore 2",
              playerId: 2 },
            { characterId: 3,
              characterName: "Giocatore 3",
              playerId: 3 },
            { characterId: 4,
              characterName: "Giocatore 4",
              playerId: 4 },
          ],
        },
      );
      expect(newState.previousAction).toBe("CharacterSelection");
      expect(newState.charactersByPlayers.length).toBe(4);
      expect(newState.allowedNextActions).toStrictEqual(["GoToPlayerTurn"]);

    });
    it("Action GoToPlayerTurn", () => {

      const initialGameState = getInitialState();
      initialGameState.boss = BOSS_ENEMIES[0];
      initialGameState.allowedNextActions = ["GoToPlayerTurn"];
      const newState = applyAction(
        initialGameState,
        {
          phase: "Setup",
          kind: "GoToPlayerTurn",
        },
      );
      expect(newState.previousAction).toBe("GoToPlayerTurn");
      expect(newState.allowedNextActions).toStrictEqual(["Awake"] as AllPossibleActionKind[]);
      expect(newState.currentPlayerIndex).toBe(0);

    });

  });
  describe("Player Turn", () => {

    const mockInitialGameState = () => {

      const initialGameState = getInitialState();
      initialGameState.allowedNextActions = ["Move"];
      initialGameState.boss = BOSS_ENEMIES[0];
      initialGameState.charactersByPlayers = [
        {
          character: {
            ...CHARACTERS[0],
            characterName: "Giocatore 1",
            life: CHARACTERS[0].startingLife,
            energy: CHARACTERS[0].startingEnergy,
          },
          playerId: 1,
        },
        {
          character: {
            ...CHARACTERS[1],
            characterName: "Giocatore 2",
            life: CHARACTERS[1].startingLife,
            energy: CHARACTERS[1].startingEnergy,
          },
          playerId: 2,
        },
        {
          character: {
            ...CHARACTERS[2],
            characterName: "Giocatore 3",
            life: CHARACTERS[2].startingLife,
            energy: CHARACTERS[2].startingEnergy,
          },
          playerId: 3,
        },
        {
          character: {
            ...CHARACTERS[3],
            characterName: "Giocatore 4",
            life: CHARACTERS[3].startingLife,
            energy: CHARACTERS[3].startingEnergy,
          },
          playerId: 4,
        },
      ];
      initialGameState.currentPlayerIndex = 0;
      initialGameState.currentPlayerPerformedActions = [];
      initialGameState.players = [
        1,
        2,
        3,
        4,
      ];
      initialGameState.onboardTiles = [
        prepareTile(
          STARTING_TILES[0],
          0,
          initialGameState.players.slice(),
        ),
      ];
      initialGameState.phase = "PlayerTurn";
      initialGameState.previousAction = "GoToPlayerTurn";
      initialGameState.tileToPlace = null;
      initialGameState.tilesDeck = {
        L1: OTHER_TILES.filter((tile) => tile.ring === 1),
        L2: OTHER_TILES.filter((tile) => tile.ring === 2),
        L3: OTHER_TILES.filter((tile) => tile.ring === 3).concat([BOSS_TILES[0]]),
      };
      return initialGameState;

    };
    it(
      "Move with explore",
      () => {

        const state = mockInitialGameState();
        // provo a muovere
        let newState = applyAction(
          state,
          {
            phase: "PlayerTurn",
            kind: "Move",
            direction: "R",
            playerId: 1,
          },
        );
        // ho bisogno di esplorare
        expect(newState.allowedNextActions).toStrictEqual(["PickATile"]);
        // decido in che direzione
        newState = applyAction(
          newState,
          {
            phase: "PlayerTurn",
            kind: "PickATile",
            position: "TL",
            playerId: 1,
          },
        );
        // mi arriva la tile da posizionare
        expect(newState.allowedNextActions).toStrictEqual(["PlaceTile"]);
        expect(newState.tileToPlace).not.toBeNull();
        // posiziono girandola di 1
        newState = applyAction(
          newState,
          {
            phase: "PlayerTurn",
            kind: "PlaceTile",
            rotation: 1,
            playerId: 1,
          },
        );

      },
    );

  });

  describe("GameOneMatchManager", () => {

    test("GameOneMatchManager - Setup with autoplay shold stop on CharacterSelection", () => {

      const initialGameState = getInitialState();
      const newState = GameOneMatchManager(
        initialGameState,
        {
          phase: "Setup",
          kind: "SetPlayers",
          players: [
            1,
            2,
            3,
            4,
          ],
        },
      );
      expect(newState.previousAction).toBe("SetPlayngOrder" satisfies AllPossibleActionKind);
      expect(newState.allowedNextActions[0]).toBe("CharacterSelection" satisfies AllPossibleActionKind);

    });
    test("GameOneMatchManager - after CharacterSelection should stop after Player Awake", () => {

      const initialGameState = getInitialState();
      let newState = GameOneMatchManager(
        initialGameState,
        {
          phase: "Setup",
          kind: "SetPlayers",
          players: [
            1,
            2,
            3,
            4,
          ],
        },
      );
      newState = GameOneMatchManager(
        newState,
        {
          phase: "Setup",
          kind: "CharacterSelection",
          selectedCharacters: [
            {
              characterId: 4,
              playerId: 1,
              characterName: "Tizio",
            },
            {
              characterId: 3,
              playerId: 2,
              characterName: "Caio",
            },
            {
              characterId: 2,
              playerId: 3,
              characterName: "Sempronio",
            },
            {
              characterId: 1,
              playerId: 4,
              characterName: "Riccardo",
            },
          ],
        },
      );
      expect(newState.phase).toBe("PlayerTurn" satisfies GamePhases);
      expect(newState.allowedNextActions).toStrictEqual(Flow.PlayerTurn.Awake);
      expect(newState.previousAction).toBe("Awake" satisfies AllPossibleActionKind);

    });

  });

});
