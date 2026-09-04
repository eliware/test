export function assertExitCode(result, operation) {
  if (!Number.isInteger(result)) throw new TypeError(`${operation} must return an integer exit code`);
  return result;
}
