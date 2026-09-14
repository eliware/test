export function normalizeCliError(error, write) {
  write(error.message);
  return 18;
}
