import { validateDiscordHandlerFiles } from "./validate-discord-handler-files.mjs";
import { supportedDiscordLocales } from "./supported-discord-locales.mjs";

const commandDirectory = "commands";
const commandName = /^[-_'\p{L}\p{N}\p{sc=Deva}\p{sc=Thai}]{1,32}$/u;

export async function validateDiscordCommandRecords(files, inventory) {
  const jsonNames = names(files, ".json");
  const moduleNames = names(files, ".mjs");
  const errors = [];
  if (!jsonNames.length) errors.push("commands/ must contain a command definition.");
  errors.push(...mismatchedNames(jsonNames, moduleNames));
  errors.push(...(await validateDiscordHandlerFiles(inventory, commandDirectory, moduleNames)));
  for (const name of jsonNames) errors.push(...(await validateDefinition(inventory, name)));
  return errors;
}

function names(files, extension) {
  return files
    .filter((path) => path.startsWith(`${commandDirectory}/`) && path.endsWith(extension))
    .map((path) => path.slice(commandDirectory.length + 1, -extension.length))
    .filter((name) => !name.includes("/"));
}

function mismatchedNames(jsonNames, moduleNames) {
  return [
    ...jsonNames
      .filter((name) => !moduleNames.includes(name))
      .map((name) => `commands/${name}.mjs is required.`),
    ...moduleNames
      .filter((name) => !jsonNames.includes(name))
      .map((name) => `commands/${name}.json is required.`),
  ];
}

async function validateDefinition(inventory, name) {
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
