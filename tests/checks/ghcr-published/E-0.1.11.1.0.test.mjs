import { expect, test } from "@jest/globals";
import {
  createGhcrInventory,
  createGhcrWorkflow,
  ghcrAgents,
  ghcrPackage,
} from "../../../test-fixtures/ghcr-workflow.mjs";
import { ruleId, run } from "../../../src/checks/ghcr-published/E-0.1.11.1.0.mjs";

test("accepts package-specific GHCR usage markers", async () => {
  await expect(
    run({ repositoryInventory: createGhcrInventory(), packageJson: ghcrPackage }),
  ).resolves.toEqual({ ruleId, status: "pass", message: "" });
});

test("requires latest markers only when the publication workflow uses latest", async () => {
  const workflow = createGhcrWorkflow();
  workflow.jobs.publish.steps[1].with.tags.push("ghcr.io/eliware/example:latest");
  const agents = ghcrAgents
    .replace("Supported tags: vMAJOR.MINOR.PATCH", "Supported tags: vMAJOR.MINOR.PATCH, latest")
    .concat(
      "\nlatest is a mutable convenience alias and is never the release or deployment identity.",
    );
  await expect(
    run({
      repositoryInventory: createGhcrInventory({ workflow, agents }),
      packageJson: ghcrPackage,
    }),
  ).resolves.toMatchObject({ status: "pass" });
});

test("reports missing GHCR usage markers", async () => {
  await expect(
    run({
      repositoryInventory: createGhcrInventory({ agents: "## GHCR publication" }),
      packageJson: ghcrPackage,
    }),
  ).resolves.toMatchObject({ status: "fail", message: expect.stringContaining("Pull command") });
});

test("reports workflow and AGENTS read failures", async () => {
  await expect(run()).resolves.toMatchObject({ status: "fail" });
  await expect(
    run({
      repositoryInventory: {
        files: async () => [".github/workflows/publish.yaml"],
        readText: async (path) => {
          if (path === "AGENTS.md") throw new Error("denied");
          return "jobs: {}";
        },
      },
    }),
  ).resolves.toMatchObject({
    message: expect.stringContaining("AGENTS.md could not be inspected: denied"),
  });
});
