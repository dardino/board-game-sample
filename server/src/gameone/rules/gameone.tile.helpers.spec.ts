import { getAngle } from "./gameone.tile.helpers";

interface GetAngleTable1 {
  from: Parameters<typeof getAngle>[0];
  offset: number;
}
interface GetAngleTable2 {
  to: Parameters<typeof getAngle>[1];
  expected: number;
}

describe("[GAMEONE] - Tile Helpers", () => {

  describe.each([
    { from: "TL", offset: 0 },
    { from: "TR", offset: -1 },
    { from: "R", offset: -2 },
    { from: "BR", offset: -3 },
    { from: "BL", offset: -4 },
    { from: "L", offset: -5 },
  ] satisfies GetAngleTable1[])(
    "getAngle from ($from, $offset)",
    ({ from, offset }) => {

      test.each([
        { to: "TL", expected: 0 + offset },
        { to: "TR", expected: 1 + offset },
        { to: "R", expected: 2 + offset },
        { to: "BR", expected: 3 + offset },
        { to: "BL", expected: 4 + offset },
        { to: "L", expected: 5 + offset },
      ] satisfies GetAngleTable2[])(
        `from ${from} to $to shold be $expected`,
        ({ to, expected }) => {

          const rotation = getAngle(
            from,
            to,
          );
          expect(rotation).toBe((expected + 6) % 6);

        },
      );

    },
  );

});
