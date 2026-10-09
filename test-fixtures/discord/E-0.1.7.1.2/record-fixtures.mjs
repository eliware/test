import { supportedDiscordLocales } from "../../../src/checks/discord/E-0.1.7.1.2/supported-discord-locales.mjs";

export function createDiscordRecordFixture(options = {}) {
  const commands = options.commands ?? ["help"];
  const events = options.events ?? ["clientReady", "interactionCreate"];
  const locales = options.locales ?? supportedDiscordLocales;
  const files = [];
  const contents = new Map();
  for (const name of commands) {
    files.push(`commands/${name}.json`, `commands/${name}.mjs`, `src/commands/${name}.mjs`);
    contents.set(`commands/${name}.json`, JSON.stringify(commandDefinition(name)));
    contents.set(`commands/${name}.mjs`, adapter("commands", name));
    contents.set(`src/commands/${name}.mjs`, "export default async function handler() {}\n");
  }
  for (const name of events) {
    files.push(`events/${name}.mjs`, `src/events/${name}.mjs`);
    contents.set(`events/${name}.mjs`, adapter("events", name));
    contents.set(`src/events/${name}.mjs`, "export default async function handler() {}\n");
  }
  for (const locale of locales) {
    files.push(`locales/${locale}.json`);
    contents.set(`locales/${locale}.json`, JSON.stringify({ help: "Help" }));
  }
  return {
    files: async () => files,
    readText: async (path) => {
      if (!contents.has(path)) throw new Error(`missing fixture: ${path}`);
      return contents.get(path);
    },
    contents,
    fileList: files,
  };
}

export function commandDefinition(name = "help") {
  return {
    type: 1,
    name,
    description: "Help",
    name_localizations: Object.fromEntries(supportedDiscordLocales.map((locale) => [locale, name])),
    description_localizations: Object.fromEntries(
      supportedDiscordLocales.map((locale) => [locale, "Help"]),
    ),
  };
}

function adapter(directory, name) {
  return `export { default } from "../src/${directory}/${name}.mjs";\n`;
}
