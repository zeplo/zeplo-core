
export type Maybe<T> = T | null

export type JsonValue =  boolean | number | string | null | JsonArray | JsonMap
export interface JsonMap { [key: string]: JsonValue }
export interface JsonArray extends Array<JsonValue> {}

export type DeepPartial<T> = T extends Function ? T : (T extends object ? { [P in keyof T]?: DeepPartial<T[P]>; } : T);

/**
 * Get all of the keys to which U can be assigned.
 */
export type OnlyKeys<T, U> = {
  [K in keyof T]: U extends T[K] ? K : never
}[keyof T];

/**
 * Get the interface containing only properties to which U can be assigned.
 */
export type OnlyUndefined<T> = {
  [K in OnlyKeys<T, undefined>]: T[K]
}

/**
 * Get all of the keys except those to which U can be assigned.
 */
export type ExcludeKeys<T, U> = {
  [K in keyof T]: U extends T[K] ? never : K
}[keyof T];

/**
 * Get the interface containing no properties to which U can be assigned.
 */
export type ExcludeUndefined<T> = {
  [K in ExcludeKeys<T, undefined>]: T[K]
}

/**
 * Get the interface where all properties are optional.
 */
export type Optional<T> = {[K in keyof T]?: T[K]};

/**
 * Get the interface where properties that can be assigned undefined are
 * also optional.
 */
export type UndefinedOptional<T> = ExcludeUndefined<T> & Optional<OnlyUndefined<T>>

export type DeepUndefinedOptional<T> = T extends (...args: any[]) => any
  ? T
  : T extends any[]
  ? _DeepRequiredArray<T[number]>
  : T extends object
  ? _DeepRequiredObject<UndefinedOptional<T>>
  : T;

 export interface _DeepRequiredArray<T>
  extends Array<DeepUndefinedOptional<T>> {}

  export type _DeepRequiredObject<T> = {
  [P in keyof T]: DeepUndefinedOptional<T[P]>
}