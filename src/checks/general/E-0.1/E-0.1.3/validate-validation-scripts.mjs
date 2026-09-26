export function findInvalidValidationScripts(scripts = {}) {
  return Object.entries(scripts)
    .filter(
      ([, command]) =>
        typeof command === "string" &&
        /(?:^|[\s"'`=(:,/])(?:(?:npx|npm\s+(?:exec|run))\s+(?:[^\s;&|]+\s+)*)?(?:jest|oxlint|prettier)(?=$|[\s"'`=:;,)&|])/i.test(command),
    )
    .map(([name]) => name);
}
