
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

export class NavigateEvent extends CustomEvent<{
  to: string;
  params?: Record<string, string>;
}> {

  constructor (to: string, params?: Record<string, string>) {
    super("navigate", { detail: { to, params }});
  }

}

export function navigate<T extends string> (to: T, params?: ExtractParams<T>) {
  const event = new NavigateEvent(
    to,
    params,
  );
  document.dispatchEvent(event);
  if (!event.defaultPrevented) {
    history.pushState({}, "", replaceParams(to, params));
  }
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

declare global {

  interface DocumentEventMap {
    navigate: NavigateEvent;
  }

  interface EventTarget {
    addEventListener<K extends "navigate">(type: K, listener: (ev: NavigateEvent) => boolean, options?: boolean | AddEventListenerOptions): void;
    addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
    removeEventListener<K extends "navigate">(type: K, listener: (ev: NavigateEvent) => boolean, options?: boolean | EventListenerOptions): void;
    removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
  }
}
