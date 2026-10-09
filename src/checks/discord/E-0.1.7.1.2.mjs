import { fail, pass } from "../check-result.mjs";
import { validateDiscordCommandRecords } from "./E-0.1.7.1.2/validate-discord-command-records.mjs";
import { validateDiscordEventRecords } from "./E-0.1.7.1.2/validate-discord-event-records.mjs";
import { validateDiscordLocaleRecords } from "./E-0.1.7.1.2/validate-discord-locale-records.mjs";

export const ruleId = "E-0.1.7.1.2";

export async function run(context = {}) {
  const inventory = context.repositoryInventory;
  if (!inventory?.files || !inventory?.readText)
    return fail(ruleId, "Discord records could not be inspected.");
  try {
    const files = await inventory.files("all");
    const errors = [
      ...(await validateDiscordCommandRecords(files, inventory)),
      ...(await validateDiscordEventRecords(files, inventory)),
      ...(await validateDiscordLocaleRecords(files, inventory)),
    ];
    return errors.length ? fail(ruleId, errors.join("\n")) : pass(ruleId);
  } catch (error) {
    return fail(ruleId, `Discord records could not be inspected: ${error.message}`);
  }
}
