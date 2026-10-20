export function collectNestedStringValues(value, values = []) {
  if (typeof value === "string") values.push(value);
  else if (Array.isArray(value)) value.forEach((entry) => collectNestedStringValues(entry, values));
  else if (value && typeof value === "object")
    Object.values(value).forEach((entry) => collectNestedStringValues(entry, values));
  return values;
}
