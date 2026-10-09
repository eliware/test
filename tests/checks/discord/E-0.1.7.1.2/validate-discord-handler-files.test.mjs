import { expect, test } from "@jest/globals";
import { validateDiscordHandlerFiles } from "../../../../src/checks/discord/E-0.1.7.1.2/validate-discord-handler-files.mjs";
import { createDiscordRecordFixture } from "../../../../test-fixtures/discord/E-0.1.7.1.2/record-fixtures.mjs";

test("accepts matching root adapters and default function handlers", async () => {
  const inventory = createDiscordRecordFixture();
  await expect(validateDiscordHandlerFiles(inventory, "events", ["clientReady"])).resolves.toEqual(
    [],
  );
});

test("rejects a wrong adapter and a non-function default export", async () => {
  const inventory = createDiscordRecordFixture();
  inventory.contents.set("events/clientReady.mjs", "export default function handler() {};");
  inventory.contents.set("src/events/clientReady.mjs", "export default null;\n");
  await expect(validateDiscordHandlerFiles(inventory, "events", ["clientReady"])).resolves.toEqual([
    "events/clientReady.mjs must re-export its matching source handler.",
    "src/events/clientReady.mjs must default-export a function.",
  ]);
});

test("rejects an adapter without re-export specifiers", async () => {
  const inventory = createDiscordRecordFixture();
  inventory.contents.set("events/clientReady.mjs", "export {};\n");
  await expect(
    validateDiscordHandlerFiles(inventory, "events", ["clientReady"]),
  ).resolves.toContain("events/clientReady.mjs must re-export its matching source handler.");
});

test("reports source and adapter parse errors", async () => {
  const inventory = createDiscordRecordFixture();
  inventory.contents.set("events/clientReady.mjs", "export {");
  inventory.contents.set("src/events/clientReady.mjs", "export {");
  const errors = await validateDiscordHandlerFiles(inventory, "events", ["clientReady"]);
  expect(errors).toHaveLength(2);
  expect(errors[0]).toMatch(/^events\/clientReady\.mjs could not be inspected:/u);
  expect(errors[1]).toMatch(/^src\/events\/clientReady\.mjs could not be inspected:/u);
});
