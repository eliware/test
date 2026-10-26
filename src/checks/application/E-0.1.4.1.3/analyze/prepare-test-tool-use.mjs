import { collectLauncherAliases } from "./collect/launcher-aliases.mjs";
import { collectStaticStrings } from "./collect/static-strings.mjs";

export function prepareTestToolUse(program) {
  return {
    strings: collectStaticStrings(program),
    launchNames: collectLauncherAliases(program),
  };
}
