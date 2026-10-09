import { expect, test } from "@jest/globals";
import { supportedDiscordLocales } from "../../../../src/checks/discord/E-0.1.7.1.2/supported-discord-locales.mjs";

test("lists 32 unique locale identifiers and includes en-US", () => {
  expect(supportedDiscordLocales).toHaveLength(32);
  expect(new Set(supportedDiscordLocales).size).toBe(32);
  expect(supportedDiscordLocales).toContain("en-US");
});
