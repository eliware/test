import { expect, test } from "@jest/globals";
import { validateDiscordCommandRecords } from "../../../../src/checks/discord/E-0.1.7.1.2/validate-discord-command-records.mjs";
import {
  commandDefinition,
  createDiscordRecordFixture,
} from "../../../../test-fixtures/discord/E-0.1.7.1.2/record-fixtures.mjs";

test("accepts arbitrary command names with a definition, adapter, and handler", async () => {
  const inventory = createDiscordRecordFixture({ commands: ["status", "settings"] });
  await expect(validateDiscordCommandRecords(inventory.fileList, inventory)).resolves.toEqual([]);
});

test("requires matching JSON and module files for each command", async () => {
  const inventory = createDiscordRecordFixture({ commands: [] });
  inventory.fileList.push("commands/status.json", "commands/extra.mjs");
  inventory.contents.set("commands/status.json", JSON.stringify(commandDefinition("status")));
  await expect(validateDiscordCommandRecords(inventory.fileList, inventory)).resolves.toEqual([
    "commands/status.mjs is required.",
    "commands/extra.json is required.",
    "commands/extra.mjs could not be inspected: missing fixture: commands/extra.mjs",
    "src/commands/extra.mjs could not be inspected: missing fixture: src/commands/extra.mjs",
  ]);
});

test("rejects invalid command JSON", async () => {
  const inventory = createDiscordRecordFixture();
  inventory.contents.set("commands/help.json", "{");
  await expect(validateDiscordCommandRecords(inventory.fileList, inventory)).resolves.toContain(
    "commands/help.json must contain valid JSON.",
  );
});

test("rejects invalid command fields and localization", async () => {
  const inventory = createDiscordRecordFixture();
  const definition = commandDefinition();
  definition.type = 2;
  delete definition.name;
  definition.description = "";
  delete definition.name_localizations;
  definition.description_localizations.bg = "x".repeat(101);
  inventory.contents.set("commands/help.json", JSON.stringify(definition));
  const errors = await validateDiscordCommandRecords(inventory.fileList, inventory);
  expect(errors).toEqual(
    expect.arrayContaining([
      "commands/help.json type must be 1.",
      "commands/help.json name is invalid.",
      "commands/help.json description is invalid.",
      "commands/help.json localized name is missing or invalid: bg.",
      "commands/help.json localized description is missing or invalid: bg.",
    ]),
  );
});

test("ignores nested command paths and allows an absent source inventory", async () => {
  const inventory = createDiscordRecordFixture({ commands: [] });
  inventory.fileList.push("commands/nested/extra.json");
  await expect(validateDiscordCommandRecords(inventory.fileList, inventory)).resolves.toEqual([
    "commands/ must contain a command definition.",
  ]);
});
