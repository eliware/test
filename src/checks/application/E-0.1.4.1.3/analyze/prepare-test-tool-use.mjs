import collectLauncherAliases from "./collect/launcher-aliases.mjs";
import collectStaticStrings from "./collect/static-strings.mjs";
export default function prepareTestToolUse(program) {
  return {
    strings: collectStaticStrings(program),
    launchNames: collectLauncherAliases(program),
  };
}
