import { Connections, Tile } from "../gameone-contents";
import { ConnectedTile, TileAngles } from "./state.types";

export function prepareTile(
  tile: Tile,
  rotation: TileAngles,
  withPlayers: number[],
): ConnectedTile {
  return rotateTile(
    {
      ...tile,
      x: 0,
      y: 0,
      orientation: rotation,
      playersIn: withPlayers,
      enemiesIn: [],
      nodes: {
        BL: null,
        BR: null,
        L: null,
        R: null,
        TL: null,
        TR: null,
      },
    },
    rotation,
  );
}
function rotateTile(tile: ConnectedTile, rotation: TileAngles): ConnectedTile {
  if (Object.values(tile.nodes).some((val) => val != null)) {
    throw Error(
      "La rotazione deve avvenire solo per tile preparate ma non ancora collegate!",
    );
  }
  // metto i nodi in un array
  const nodes: Array<{ pos: Connections; node: Tile | null | undefined }> = [
    { pos: "TL", node: tile.nodes.TL },
    { pos: "TR", node: tile.nodes.TR },
    { pos: "R", node: tile.nodes.R },
    { pos: "BR", node: tile.nodes.BR },
    { pos: "BL", node: tile.nodes.BL },
    { pos: "L", node: tile.nodes.L },
    { pos: "TL", node: tile.nodes.TL },
    { pos: "TR", node: tile.nodes.TR },
    { pos: "R", node: tile.nodes.R },
    { pos: "BR", node: tile.nodes.BR },
    { pos: "BL", node: tile.nodes.BL },
    { pos: "L", node: tile.nodes.L },
  ];
  const rotatedNodes = nodes.slice(rotation, rotation + 6);
  tile.nodes = {};
  rotatedNodes.forEach(({ pos, node }) => {
    // aggiungo solo le posizioni "null", le altre no
    if (node === null) {
      tile.nodes[pos] = node;
    }
  });
  tile.orientation = rotation;
  return tile;
}

export function getNeighborhoodCoord(
  tile: ConnectedTile,
  direction: Connections,
): {
  x: number;
  y: number;
} {
  const delta = neighborhood[direction];
  return {
    x: delta[0] + tile.x,
    y: delta[1] + tile.y,
  };
}
export function getRingNumber(tile: {
  x: number;
  y: number;
}): "L1" | "L2" | "L3" {
  const X = Math.abs(tile.x);
  const Y = Math.abs(tile.y);
  const dist = Math.max(Math.floor((X + Y) / 2), Y);
  return `L${Math.min(dist, 3)}` as "L1" | "L2" | "L3";
}
const neighborhood: Record<Connections, [number, number]> = {
  //   X, Y
  TL: [-1, -1],
  TR: [+1, -1],
  L: [-2, 0],
  R: [+2, 0],
  BL: [-1, +1],
  BR: [+1, +1],
};

export function getOppositeConnection(conn: Connections): Connections {
  return Connections[(Connections.indexOf(conn) + 3) % 6];
}
