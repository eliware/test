export const uncacheableParserOptions = Symbol("uncacheable parser options");

export function canonicalizeParserOptions(value, seen = new Set()) {
  if (value === null) return ["null"];
  if (value === undefined) return ["undefined"];
  if (typeof value === "string" || typeof value === "boolean") return [typeof value, value];
  if (typeof value === "number")
    return Number.isFinite(value)
      ? ["number", Object.is(value, -0) ? "-0" : String(value)]
      : uncacheableParserOptions;
  if (typeof value !== "object" || seen.has(value)) return uncacheableParserOptions;
  seen.add(value);

  if (Array.isArray(value)) {
    const keys = Reflect.ownKeys(value);
    if (keys.length !== value.length + 1) return uncacheableParserOptions;
    const items = [];
    for (let index = 0; index < value.length; index += 1) {
      if (!Object.hasOwn(value, index)) return uncacheableParserOptions;
      const item = canonicalizeParserOptions(value[index], seen);
      if (item === uncacheableParserOptions) return item;
      items.push(item);
    }
    return ["array", items];
  }

  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return uncacheableParserOptions;
  const keys = Reflect.ownKeys(value);
  if (keys.some((key) => typeof key !== "string")) return uncacheableParserOptions;
  const properties = [];
  for (const key of keys.sort()) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor.enumerable || !Object.hasOwn(descriptor, "value"))
      return uncacheableParserOptions;
    const item = canonicalizeParserOptions(descriptor.value, seen);
    if (item === uncacheableParserOptions) return item;
    properties.push([key, item]);
  }
  return ["object", properties];
}
