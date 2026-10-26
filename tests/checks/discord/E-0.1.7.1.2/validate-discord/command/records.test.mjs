import { expect, test } from "@jest/globals";
import { validateDiscordCommandRecords } from "../../../../../../src/checks/discord/E-0.1.7.1.2/validate-discord/command/records.mjs";
import {
  commandDefinition,
  createDiscordRecordFixture,
} from "../../../../../../test-fixtures/discord/E-0.1.7.1.2/record-fixtures.mjs";

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

test("rejects nested command paths", async () => {
  const inventory = createDiscordRecordFixture({ commands: [] });
  inventory.fileList.push("commands/nested/extra.json");
  await expect(validateDiscordCommandRecords(inventory.fileList, inventory)).resolves.toEqual(
    expect.arrayContaining([
      "commands/ must contain a command definition.",
      "commands/nested/extra.json must be a root-level commands record.",
    ]),
  );
});
