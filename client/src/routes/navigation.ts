import { RouteConfig } from "./config";

export function replaceParams (to: string, params?: Record<string, string>): string {

  return Object.entries(params ?? {}).reduce(
    (actual, [
      key,
      value,
    ]) => {

      return actual.replace(
        ":" + key,
        value,
      );

    },
    to,
  );

}

export function navigate (to: keyof RouteConfig, params?: Record<string, string>) {

  history.pushState(
    {},
    "",
    replaceParams(
      to,
      params,
    ),
  );

}

/**
 * Trasforma un pattern di URL in una regular expression
 * Supporta minipath
 *  * `/path/name/:param` diventa `^/path/name/(?<param>[\w]+)$`
 * @param pattern stringa da trattare come pattern
 * @returns Regualr Expression per eseguire un match su un pathname
 */
export function patternToRegexp (pattern: string): RegExp {

  const source = pattern.replace(
    /:(\w+)/g,
    "(?<$1>[\\w]+)",
  ).
    replace(
      /\*\*\//g,
      "(?:[\\w/]*\\/)?",
    ).
    replace(
      /\/\*/g,
      ".*",
    );
  console.log(source);
  return new RegExp(
    `^${source}$`,
    "i",
  );

}

type ExtractKeys<T extends string> =
  T extends `${string}:${infer P1}/${infer M}` ? P1 | ExtractKeys<M>
    : T extends `${string}:${infer P1}` ? P1
      : never;
type ExtractParams<T extends string> = { [key in ExtractKeys<T>]: string };

export interface Matches<T extends string> {
  params: ExtractParams<T>;
}
export function matchPath<T extends string> (pattern: T, pathname: string): Matches<T> | null {

  const matches = patternToRegexp(pattern).exec(pathname);
  if (!matches) return null;
  return {
    params: matches.groups! as ExtractParams<T>,
  };

}
