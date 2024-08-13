/**
 * Represents a type that extracts the arguments enclosed in `${}` placeholders from a string.
 * @template TS - The input string.
 * @returns The extracted arguments as a union of string literals.
 */
type _stringArgs<TS extends string> =
  TS extends `${string}$\{${infer TArgument}}${infer R}`
    ? TArgument | _stringArgs<R>
    : never;

/**
 * Rappresenta un oggetto le cui property sono i parametri di un determinato template di stringa.
 * @template TS - Il template di stringa.
 */
export type TemplateParams<TS extends string> = Record<_stringArgs<TS>, string>;

const escapeRegExp = (str: string) => str.replace(
  /[.*+?^${}()|[\]\\]/g,
  "\\$&",
);

/**
 * Sostituisce i segnaposto all'interno di una stringa con i valori corrispondenti forniti come argomenti.
 *
 * @template TObj - Il tipo dell'oggetto contenente i segnaposto.
 * @param {TObj} obj - L'oggetto contenente i segnaposto.
 * @param {keyof TObj} key - La chiave dell'oggetto contenente il segnaposto da sostituire.
 * @param {TemplateParams<TObj[typeof key]>} args - I valori da utilizzare per sostituire i segnaposto.
 * @returns {string} La stringa con i segnaposto sostituiti.
 */
export function replacePlaceholders<
  TObj extends Readonly<Record<string, string>>,
  TKey extends keyof TObj,
> (obj: TObj, key: TKey, args: TemplateParams<TObj[TKey]>): string {

  let retString: string = obj[key];
  (Object.entries(args ?? {}) as [string, string][]).forEach(([
    key,
    value,
  ]) => {

    const rx = escapeRegExp(`\${${key}}`);
    retString = retString.replace(
      new RegExp(
        rx,
        "g",
      ),
      value,
    );

  });
  return retString;

}
export type TemplateReplacer = typeof replacePlaceholders;
