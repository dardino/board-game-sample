export function shuffleArray<T> (arr: T[]): T[] {

  return arr.slice().sort(() => Math.random() - 0.5);

}
