import { expect, test } from "@jest/globals";
import { ruleId, run } from "../../../src/checks/discord/E-0.1.7.1.2.mjs";
import { createDiscordRecordFixture } from "../../../test-fixtures/discord/E-0.1.7.1.2/record-fixtures.mjs";

test("accepts command, event, and locale records that follow the contract", async () => {
  await expect(run({ repositoryInventory: createDiscordRecordFixture() })).resolves.toEqual({
    ruleId,
    status: "pass",
    message: "",
  });
});

test("reports all invalid Discord record groups", async () => {
  const inventory = createDiscordRecordFixture({
    commands: [],
    events: ["customEvent"],
    locales: [],
  });
  const result = await run({ repositoryInventory: inventory });
  expect(result).toMatchObject({ ruleId, status: "fail" });
  expect(result.message).toContain("commands/ must contain a command definition.");
  expect(result.message).toContain("events/clientReady.mjs is required.");
  expect(result.message).toContain("locales/en-US.json is required.");
});

test("reports inventory failures", async () => {
  await expect(
    run({
      repositoryInventory: {
        files: async () => {
          throw new Error("scan failed");
        },
        readText: async () => "",
      },
    }),
  ).resolves.toEqual({
    ruleId,
    status: "fail",
    message: "Discord records could not be inspected: scan failed",
  });
});

test("requires repository inventory access", async () => {
  await expect(run()).resolves.toEqual({
    ruleId,
    status: "fail",
    message: "Discord records could not be inspected.",
  });
});
