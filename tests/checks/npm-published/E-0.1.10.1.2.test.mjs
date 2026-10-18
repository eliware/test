import { expect, test } from "@jest/globals";
import { ruleId, run } from "../../../src/checks/npm-published/E-0.1.10.1.2.mjs";
import { npmPublishWorkflow } from "../../../test-fixtures/npm-publish-workflow.mjs";

const workflowPath = ".github/workflows/npm.yaml";

function inventory(text = npmPublishWorkflow, files = [workflowPath]) {
  return { files: async () => files, readText: async () => text };
}

test("accepts the canonical npm workflow byte for byte", async () => {
  await expect(run({ repositoryInventory: inventory() })).resolves.toEqual({
    ruleId,
    status: "pass",
    message: "",
  });
});

test.each([
  ["one changed byte", `${npmPublishWorkflow} `],
  ["different line endings", npmPublishWorkflow.replaceAll("\n", "\r\n")],
  ["a missing final newline", npmPublishWorkflow.trimEnd()],
])("rejects an npm workflow with %s", async (_name, text) => {
  await expect(run({ repositoryInventory: inventory(text) })).resolves.toMatchObject({
    status: "fail",
    message: expect.stringContaining(
      "must match the bundled Eliware Test file specs/workflows/npm.yaml byte for byte",
    ),
  });
});

test.each([
  ["missing npm workflow", []],
  ["legacy workflow name", [".github/workflows/publish.yaml"]],
])("requires the canonical npm workflow name: %s", async (_name, files) => {
  await expect(
    run({ repositoryInventory: inventory(npmPublishWorkflow, files) }),
  ).resolves.toMatchObject({
    ruleId,
    status: "fail",
    message: expect.stringContaining(`${workflowPath} is required`),
  });
});

test("reports an unavailable workflow inventory", async () => {
  await expect(run()).resolves.toMatchObject({
    ruleId,
    status: "fail",
    message: expect.stringContaining(`${workflowPath} could not be inspected`),
  });
});
