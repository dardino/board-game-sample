import { describe, expect, it } from "vitest";
import { mapTemplateClasses } from "./css-module-template-runtime";

describe("mapTemplateClasses", () => {
  it("maps every class token to its CSS Module export", () => {
    const template = "<footer class=\"statusBar statusItem\"><span class='statusLabel'></span></footer>";

    expect(mapTemplateClasses(template, {
      statusBar: "_statusBar_abc",
      statusItem: "_statusItem_abc",
      statusLabel: "_statusLabel_abc",
    })).toBe("<footer class=\"_statusBar_abc _statusItem_abc\"><span class='_statusLabel_abc'></span></footer>");
  });

  it("fails when a template references a missing CSS Module class", () => {
    expect(() => mapTemplateClasses("<div class=\"missing\"></div>", {})).
      toThrow("CSS Module class \"missing\" is not defined.");
  });
});
