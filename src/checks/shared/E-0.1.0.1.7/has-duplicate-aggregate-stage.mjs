export function hasDuplicateAggregateStage(command) {
  if (typeof command !== "string") return false;
  return [
    /(?:^|[\s;&|])(?:npm|pnpm|yarn|bun)\s+(?:(?:--[^\s]+)\s+)*(?:run\s+)?(?:test|lint|audit|format(?::check)?|pack|outdated|typecheck|build)(?=$|\s)/iu,
    /(?:^|[\s;&|])(?:npm|pnpm)\s+(?:audit|outdated|pack)(?=$|\s)/iu,
    /(?:^|[\s;&|])(?:(?:node|npx)\s+)?(?:\.\/)?(?:bin[\\/])?eliware-test(?:\.mjs|\.cmd)?\s+--(?:lint|format|format-check|audit|pack)(?=$|\s)/iu,
    /(?:^|[\s;&|])npm\s+exec\s+(?:--\s+)?(?:node\s+)?(?:\.\/)?(?:bin[\\/])?eliware-test(?:\.mjs|\.cmd)?\s+--(?:lint|format|format-check|audit|pack)(?=$|\s)/iu,
  ].some((pattern) => pattern.test(command));
}
