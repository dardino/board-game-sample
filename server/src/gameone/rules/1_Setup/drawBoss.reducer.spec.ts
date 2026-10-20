import { BOSS_ENEMIES } from "@/gameone/gameone-contents";
import { getInitialState } from "../state.types";
import { DrawBossReducer } from "./drawBoss.reducer";

describe("DrawBossReducer", () => {
  it("draws one of at least ten uniquely named bosses", () => {
    expect(BOSS_ENEMIES.length).toBeGreaterThanOrEqual(10);
    expect(new Set(BOSS_ENEMIES.map((boss) => boss.name)).size).toBe(BOSS_ENEMIES.length);

    const result = DrawBossReducer(getInitialState(), {
      phase: "Setup",
      kind: "DrawBoss",
    });

    expect(BOSS_ENEMIES).toContain(result.boss);
  });
});
