export function toMilliseconds(
  type: "h",
  hours: number,
  minutes?: number,
  seconds?: number,
  millisec?: number,
): number;
export function toMilliseconds(
  type: "m",
  minutes: number,
  seconds?: number,
  millisec?: number,
): number;
export function toMilliseconds(
  type: "s",
  seconds: number,
  millisec?: number,
): number;
export function toMilliseconds(
  type: "s" | "h" | "m",
  ...args: (number | undefined)[]
): number {
  const hours = type === "h" ? args[0] : 0;
  const minutes = type === "h" ? args[1] : type === "m" ? args[0] : 0;
  const seconds =
    type === "h"
      ? args[2]
      : type === "m"
        ? args[1]
        : type === "s"
          ? args[0]
          : 0;
  const millisec =
    type === "h"
      ? args[3]
      : type === "m"
        ? args[2]
        : type === "s"
          ? args[1]
          : 0;

  return (
    (millisec ?? 0) +
    (seconds ?? 0) * 1000 +
    (minutes ?? 0) * 60 * 1000 +
    (hours ?? 0) * 60 * 60 * 1000
  );
}

/**
 * calcola un timestamp a partire da ora tra n millisecondi
 * @param milliseconds millisecondi a partire da ora
 * @returns stringa ISO del timestamp
 */
export function getTimeStampFromNow(milliseconds: number) {
  return new Date(new Date().valueOf() + milliseconds).toISOString();
}
