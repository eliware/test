import { supportedDiscordLocales } from "../../supported-discord-locales.mjs";

const commandName = /^[-_'\p{L}\p{N}\p{sc=Deva}\p{sc=Thai}]{1,32}$/u;

export async function validateDiscordCommandDefinition(inventory, name) {
  const path = `commands/${name}.json`;
  let definition;
  try {
    definition = JSON.parse(await inventory.readText(path));
  } catch {
    return [`${path} must contain valid JSON.`];
  }
  const errors = [];
  if (definition?.type !== 1) errors.push(`${path} type must be 1.`);
  if (!commandName.test(definition?.name ?? "")) errors.push(`${path} name is invalid.`);
  else if (definition.name !== name) errors.push(`${path} name must match its file name.`);
  if (!validDescription(definition?.description)) errors.push(`${path} description is invalid.`);
  for (const locale of supportedDiscordLocales) {
    if (!commandName.test(definition?.name_localizations?.[locale] ?? ""))
      errors.push(`${path} localized name is missing or invalid: ${locale}.`);
    if (!validDescription(definition?.description_localizations?.[locale]))
      errors.push(`${path} localized description is missing or invalid: ${locale}.`);
  }
  return errors;
}

function validDescription(value) {
  return typeof value === "string" && value.length >= 1 && value.length <= 100;
}
