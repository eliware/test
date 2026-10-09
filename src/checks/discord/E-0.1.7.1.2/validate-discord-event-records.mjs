import { validateDiscordHandlerFiles } from "./validate-discord-handler-files.mjs";

const eventDirectory = "events";
const requiredEvents = ["clientReady", "interactionCreate"];

export async function validateDiscordEventRecords(files, inventory) {
  const names = files
    .filter((path) => path.startsWith(`${eventDirectory}/`) && path.endsWith(".mjs"))
    .map((path) => path.slice(eventDirectory.length + 1, -4))
    .filter((name) => !name.includes("/"));
  const errors = requiredEvents
    .filter((name) => !names.includes(name))
    .map((name) => `events/${name}.mjs is required.`);
  errors.push(...(await validateDiscordHandlerFiles(inventory, eventDirectory, names)));
  return errors;
}
