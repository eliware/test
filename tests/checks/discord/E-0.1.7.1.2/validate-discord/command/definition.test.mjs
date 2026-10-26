import { expect, test } from "@jest/globals";
import { validateDiscordCommandDefinition } from "../../../../../../src/checks/discord/E-0.1.7.1.2/validate-discord/command/definition.mjs";
import {
  commandDefinition,
  createDiscordRecordFixture,
} from "../../../../../../test-fixtures/discord/E-0.1.7.1.2/record-fixtures.mjs";

test("rejects invalid command JSON", async () => {
  const inventory = createDiscordRecordFixture();
  inventory.contents.set("commands/help.json", "{");
  await expect(validateDiscordCommandDefinition(inventory, "help")).resolves.toContain(
    "commands/help.json must contain valid JSON.",
  );
});

test("validates command fields and locale values", async () => {
  const inventory = createDiscordRecordFixture();
  const definition = commandDefinition();
  definition.type = 2;
  delete definition.name;
  definition.description = "";
  delete definition.name_localizations;
  definition.description_localizations.bg = "x".repeat(101);
  inventory.contents.set("commands/help.json", JSON.stringify(definition));
  const errors = await validateDiscordCommandDefinition(inventory, "help");
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

test("requires the command name to match the definition file name", async () => {
  const inventory = createDiscordRecordFixture();
  inventory.contents.set("commands/help.json", JSON.stringify(commandDefinition("other")));
  await expect(validateDiscordCommandDefinition(inventory, "help")).resolves.toContain(
    "commands/help.json name must match its file name.",
  );
});
