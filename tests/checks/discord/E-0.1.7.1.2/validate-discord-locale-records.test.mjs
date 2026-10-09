import { expect, test } from "@jest/globals";
import { validateDiscordLocaleRecords } from "../../../../src/checks/discord/E-0.1.7.1.2/validate-discord-locale-records.mjs";
import { supportedDiscordLocales } from "../../../../src/checks/discord/E-0.1.7.1.2/supported-discord-locales.mjs";
import { createDiscordRecordFixture } from "../../../../test-fixtures/discord/E-0.1.7.1.2/record-fixtures.mjs";

test("requires every supported locale with the base locale keys", async () => {
  const inventory = createDiscordRecordFixture();
  await expect(validateDiscordLocaleRecords(inventory.fileList, inventory)).resolves.toEqual([]);
});

test("rejects missing and unsupported locale records", async () => {
  const locales = supportedDiscordLocales.filter((locale) => locale !== "fr");
  const inventory = createDiscordRecordFixture({ locales });
  inventory.fileList.push("locales/xx.json");
  inventory.contents.set("locales/xx.json", JSON.stringify({ help: "Help" }));
  const errors = await validateDiscordLocaleRecords(inventory.fileList, inventory);
  expect(errors).toEqual(
    expect.arrayContaining([
      "locales/fr.json is required.",
      "locales/xx.json uses an unsupported locale.",
    ]),
  );
});

test("rejects invalid JSON, non-object records, and different locale keys", async () => {
  const inventory = createDiscordRecordFixture();
  inventory.contents.set("locales/en-US.json", "[]");
  inventory.contents.set("locales/fr.json", "{");
  const errors = await validateDiscordLocaleRecords(inventory.fileList, inventory);
  expect(errors).toEqual(
    expect.arrayContaining([
      "locales/en-US.json must contain a JSON object.",
      "locales/fr.json must contain a JSON object.",
    ]),
  );
});

test("rejects locale keys that differ from en-US", async () => {
  const inventory = createDiscordRecordFixture();
  inventory.contents.set("locales/fr.json", JSON.stringify({ extra: "Aide" }));
  await expect(validateDiscordLocaleRecords(inventory.fileList, inventory)).resolves.toContain(
    "locales/fr.json keys must match locales/en-US.json.",
  );
});

test("reports a missing base locale and compares other keys with an empty base", async () => {
  const locales = supportedDiscordLocales.filter((locale) => locale !== "en-US");
  const inventory = createDiscordRecordFixture({ locales });
  const errors = await validateDiscordLocaleRecords(inventory.fileList, inventory);
  expect(errors).toContain("locales/en-US.json must contain a JSON object.");
  expect(errors).toContain("locales/fr.json keys must match locales/en-US.json.");
});
