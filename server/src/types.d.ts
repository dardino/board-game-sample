/**
 * Represents a predicate function that takes an object of type T and returns a boolean value.
 * @template T The type of the object being evaluated.
 * @param obj The object to evaluate.
 * @returns A boolean value indicating whether the object satisfies the predicate.
 */
declare type Predicate<T> = (obj: T) => boolean;
