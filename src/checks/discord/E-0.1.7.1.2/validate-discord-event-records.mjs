import { validateDiscordHandlerFiles } from "./validate-discord-handler-files.mjs";

const eventDirectory = "events";
const requiredEvents = ["clientReady", "interactionCreate"];

export async function validateDiscordEventRecords(files, inventory) {
  const errors = files
    .filter((path) => path.startsWith(`${eventDirectory}/`) && path.endsWith(".mjs"))
    .filter((path) => path.slice(eventDirectory.length + 1).includes("/"))
    .map((path) => `${path} must be a root-level events record.`);
  const names = files
    .filter((path) => path.startsWith(`${eventDirectory}/`) && path.endsWith(".mjs"))
    .map((path) => path.slice(eventDirectory.length + 1, -4))
    .filter((name) => !name.includes("/"));
  errors.push(
    ...requiredEvents
      .filter((name) => !names.includes(name))
      .map((name) => `events/${name}.mjs is required.`),
  );
  errors.push(...(await validateDiscordHandlerFiles(inventory, eventDirectory, names)));
  return errors;
}
