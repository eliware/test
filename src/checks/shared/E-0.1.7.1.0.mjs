import { fail, pass } from "../check-result.mjs";
import { validateDiscordOrdering } from "./E-0.1.7.1.0/validate-discord-ordering.mjs";

export const ruleId = "E-0.1.7.1.0";
export const ownerProfile = "discord";
export const requiredProfiles = ["general", "application", "discord"];

export function run(_context = {}, dependencies = {}) {
  const errors = validateDiscordOrdering(dependencies.readCanonicalOrder);
  return errors.length ? fail(ruleId, errors.join("\n")) : pass(ruleId);
}
