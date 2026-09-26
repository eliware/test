import { validatePackArguments } from "./validate-pack-arguments.mjs";

export function buildPackArguments(extraArgs = []) {
  const error = validatePackArguments(extraArgs);
  if (error) throw new Error(error);
  return ["pack", ...extraArgs, "--dry-run", "--json"];
}
