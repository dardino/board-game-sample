/**
 * Generates an HTML string by interpolating values into a template string.
 *
 * @param template - The template string containing HTML markup and placeholders.
 * @param args - The values to be interpolated into the template.
 * @returns The generated HTML string.
 */
export function html (template: TemplateStringsArray, ...args: unknown[]): string {

  return template.map((value, index) => value + (args[index] ?? "")).join("");

}
