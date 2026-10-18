import { isValidBinTarget } from "./target.mjs";

const validCommandName = /^[A-Za-z0-9_.-]+$/u;

export function validateBinEntries(bin) {
  if (!bin || typeof bin !== "object" || Array.isArray(bin)) return [];
  const errors = [];
  for (const name of Object.keys(bin)) {
    if (!validCommandName.test(name))
      errors.push(`package.json bin command name is invalid: ${name}.`);
  }
  for (const [name, target] of Object.entries(bin)) {
    if (!isValidBinTarget(target)) {
      errors.push(`package.json bin target for ${name} must be a nonempty path string.`);
    }
  }
  return errors;
}
