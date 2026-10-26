import { validateDiscordHandlerFiles } from "../handler-files.mjs";
import { validateDiscordCommandDefinition } from "./definition.mjs";

const commandDirectory = "commands";

export async function validateDiscordCommandRecords(files, inventory) {
  const jsonNames = names(files, ".json");
  const moduleNames = names(files, ".mjs");
  const errors = files
    .filter((path) => path.startsWith(`${commandDirectory}/`))
    .filter((path) => path.slice(commandDirectory.length + 1).includes("/"))
    .map((path) => `${path} must be a root-level commands record.`);
  if (!jsonNames.length) errors.push("commands/ must contain a command definition.");
  errors.push(...mismatchedNames(jsonNames, moduleNames));
  errors.push(...(await validateDiscordHandlerFiles(inventory, commandDirectory, moduleNames)));
  for (const name of jsonNames)
    errors.push(...(await validateDiscordCommandDefinition(inventory, name)));
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
