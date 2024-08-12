import { GameOneMatchManager } from "../gameone-rules";
import { getAngle } from "./gameone.tile.helpers";
import { AllPossibleActionKind, getInitialState } from "./state.types";

describe("[GAME-ONE]", () => {
  test("Simulation of a full game", () => {
    let gameState = getInitialState();
    const players = [1, 2, 3, 4];
    const characters = [
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
    ];

    // inizio
    gameState = GameOneMatchManager(gameState, {
      phase: "Setup",
      kind: "SetPlayers",
      players,
    });
    expect(gameState.allowedNextActions).toStrictEqual(["CharacterSelection"]);

    // scelta dei personaggi
    gameState = GameOneMatchManager(gameState, {
      phase: "Setup",
      kind: "CharacterSelection",
      selectedCharacters: characters,
    });
    expect(gameState.allowedNextActions).toStrictEqual([
      "Move",
      "Fight",
      "Pass",
    ] satisfies AllPossibleActionKind[]);
    expect(gameState.currentPlayerIndex).toBe(0);
    const playerOrder = gameState.players.slice();
    let currentPlayerId = playerOrder[0];
    // giocatore 1 muove in alto a sinistra (TL)
    gameState = GameOneMatchManager(gameState, {
      phase: "PlayerTurn",
      kind: "Move",
      direction: "TL",
      playerId: currentPlayerId,
    });
    expect(gameState.allowedNextActions).toStrictEqual([
      "PlaceTile",
    ] satisfies AllPossibleActionKind[]);
    expect(gameState.tileToPlace).not.toBeNull();

    // oriento la tile in modo che ci sia una connessione valida
    const firstConn = gameState.tileToPlace!.conections.filter(
      (l) => l != null,
    )[0];
    const angle = getAngle(firstConn, "TL");
    gameState = GameOneMatchManager(gameState, {
      kind: "PlaceTile",
      phase: "PlayerTurn",
      playerId: currentPlayerId,
      rotation: angle,
    });
    expect(gameState.onboardTiles.length).toBe(2);
    // mi aspetto di aver mosso e quindi il giocatore deve trovarsi nella nuova tile
    expect(
      gameState.onboardTiles[gameState.onboardTiles.length - 1].playersIn,
    ).toStrictEqual([currentPlayerId]);

    // poi passo
    gameState = GameOneMatchManager(gameState, {
      kind: "Pass",
      phase: "PlayerTurn",
      playerId: currentPlayerId,
    });
    expect(gameState.currentPlayerIndex).toBe(1);
    currentPlayerId = playerOrder[1];
  });
});
