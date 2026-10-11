import { expect, test } from "@jest/globals";
import { validateDiscordHandlerFiles } from "../../../../src/checks/discord/E-0.1.7.1.2/validate-discord-handler-files.mjs";
import { createDiscordRecordFixture } from "../../../../test-fixtures/discord/E-0.1.7.1.2/record-fixtures.mjs";

test("maps selected Discord handler names to adapter and source paths", async () => {
  const inventory = createDiscordRecordFixture();
  await expect(validateDiscordHandlerFiles(inventory, "events", ["clientReady"])).resolves.toEqual(
    [],
  );
});
