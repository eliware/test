import { expect, test } from "@jest/globals";
import { validateDiscordEventRecords } from "../../../../src/checks/discord/E-0.1.7.1.2/validate-discord-event-records.mjs";
import { createDiscordRecordFixture } from "../../../../test-fixtures/discord/E-0.1.7.1.2/record-fixtures.mjs";

test("requires ready and interaction handlers but permits other events", async () => {
  const inventory = createDiscordRecordFixture({
    events: ["clientReady", "interactionCreate", "messageCreate", "customEvent"],
  });
  await expect(validateDiscordEventRecords(inventory.fileList, inventory)).resolves.toEqual([]);
});

test("reports each missing required event", async () => {
  const inventory = createDiscordRecordFixture({ events: ["customEvent"] });
  await expect(validateDiscordEventRecords(inventory.fileList, inventory)).resolves.toEqual([
    "events/clientReady.mjs is required.",
    "events/interactionCreate.mjs is required.",
  ]);
});

test("ignores nested event modules", async () => {
  const inventory = createDiscordRecordFixture({ events: ["clientReady", "interactionCreate"] });
  inventory.fileList.push("events/nested/other.mjs");
  await expect(validateDiscordEventRecords(inventory.fileList, inventory)).resolves.toEqual([]);
});
