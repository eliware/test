export function assertFiniteTreeNumber(value, operation) {
  if (!Number.isFinite(value))
    throw new TypeError(`Balanced numeric tree ${operation} values must be finite numbers.`);
}
