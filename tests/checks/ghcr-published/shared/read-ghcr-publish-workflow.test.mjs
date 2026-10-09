import { expect, test } from "@jest/globals";
import {
  createGhcrInventory,
  createGhcrWorkflow,
} from "../../../../test-fixtures/ghcr-workflow.mjs";
import { readGhcrPublishWorkflow } from "../../../../src/checks/ghcr-published/shared/read-ghcr-publish-workflow.mjs";

test("reads one valid publisher workflow", async () => {
  await expect(readGhcrPublishWorkflow(createGhcrInventory())).resolves.toMatchObject({
    workflow: createGhcrWorkflow(),
  });
});

test("rejects missing inventories, files, YAML, and read errors", async () => {
  await expect(readGhcrPublishWorkflow()).resolves.toEqual({
    error: "publish.yaml could not be inspected.",
  });
  await expect(readGhcrPublishWorkflow(createGhcrInventory({ files: [] }))).resolves.toEqual({
    error: ".github/workflows/publish.yaml is required.",
  });
  await expect(
    readGhcrPublishWorkflow({
      files: async () => [".github/workflows/publish.yaml"],
      readText: async () => "bad: [",
    }),
  ).resolves.toEqual({
    error: ".github/workflows/publish.yaml must contain one valid YAML document.",
  });
  await expect(
    readGhcrPublishWorkflow({
      files: async () => [".github/workflows/publish.yaml"],
      readText: async () => {
        throw new Error("denied");
      },
    }),
  ).resolves.toEqual({ error: ".github/workflows/publish.yaml could not be inspected: denied" });
});
