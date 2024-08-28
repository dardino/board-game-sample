import { GameOneMatchManager } from "src/gameone/gameone-rules";
import { getInitialState } from "../state.types";
import { MoveReducer } from "./move.reducer";
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
describe("[PlayerTurn] - Move", () => {

  const getStateForMove = () => {

    let state = getInitialState();
    state = GameOneMatchManager(
      state,
      {
        kind: "SetPlayers",
        phase: "Setup",
        players: [
          1,
          2,
          3,
          4,
        ],
      },
    );
    state = GameOneMatchManager(
      state,
      {
        kind: "CharacterSelection",
        phase: "Setup",
        selectedCharacters: characters,
      },
    );
    return state;

  };

  it("check move", () => {

    const state = getStateForMove();
    const changes = MoveReducer(
      state,
      {
        direction: "TL",
        kind: "Move",
        phase: "PlayerTurn",
        playerId: state.players[0],
      },
    );
    expect(changes).toStrictEqual({
      allowedNextActions: ["PickATile"],
      currentPlayerPerformedActions: [
        "Awake",
        "Move",
      ],
      placeTileAt: "TL",
      previousAction: "Move",
      tileToPlace: null,
    });

  });

});
