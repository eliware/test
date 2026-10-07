import { validatePackArguments } from "./validate-pack-arguments.mjs";

export function buildPackArguments(extraArgs = []) {
  const error = validatePackArguments(extraArgs);
  if (error) throw new Error(error);
  const safeArgs = extraArgs.filter((argument) => argument !== "--ignore-scripts");
  return ["pack", "--ignore-scripts", ...safeArgs, "--dry-run", "--json"];
}
