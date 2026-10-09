import { expect, test } from "@jest/globals";
import {
  createGhcrInventory,
  createGhcrWorkflow,
  ghcrAgents,
  ghcrPackage,
} from "../../../../test-fixtures/ghcr-workflow.mjs";
import { validateGhcrAgentsSection } from "../../../../src/checks/ghcr-published/E-0.1.11.1.0/validate-ghcr-agents-section.mjs";

test("accepts the GHCR section without a latest image tag", async () => {
  await expect(validateGhcrAgentsSection(createGhcrInventory(), ghcrPackage)).resolves.toEqual([]);
});

test("does not accept matching markers outside the GHCR section", async () => {
  const agents = `${ghcrAgents.replace("Image: ghcr.io/eliware/example\n", "")}\n\n## Other\nImage: ghcr.io/eliware/example`;
  await expect(
    validateGhcrAgentsSection(createGhcrInventory({ agents }), ghcrPackage),
  ).resolves.toContain("AGENTS.md must include: Image: ghcr.io/eliware/example");
});

test("requires the GHCR publication heading", async () => {
  await expect(
    validateGhcrAgentsSection(
      createGhcrInventory({ agents: ghcrAgents.replace("## GHCR publication", "## Image") }),
      ghcrPackage,
    ),
  ).resolves.toContain("AGENTS.md must include: ## GHCR publication");
});

test("requires latest markers when a published image uses latest", async () => {
  const workflow = createGhcrWorkflow();
  workflow.jobs.publish.steps[1].with.tags.push("ghcr.io/eliware/example:latest");
  await expect(
    validateGhcrAgentsSection(createGhcrInventory({ workflow, agents: ghcrAgents }), ghcrPackage),
  ).resolves.toEqual(
    expect.arrayContaining([
      "AGENTS.md must include: Supported tags: vMAJOR.MINOR.PATCH, latest",
      "AGENTS.md must include: latest is a mutable convenience alias and is never the release or deployment identity.",
    ]),
  );
});

test("uses the base tags when the workflow has no publish steps", async () => {
  const workflow = createGhcrWorkflow();
  delete workflow.jobs.publish.steps;
  await expect(
    validateGhcrAgentsSection(createGhcrInventory({ workflow }), ghcrPackage),
  ).resolves.toEqual([]);
});

test("reports an unreadable AGENTS file and invalid workflow", async () => {
  await expect(validateGhcrAgentsSection()).resolves.toContain("AGENTS.md could not be inspected.");
  await expect(
    validateGhcrAgentsSection({ readText: async () => "" }, ghcrPackage),
  ).resolves.toContain("publish.yaml could not be inspected.");
  const inventory = createGhcrInventory();
  await expect(
    validateGhcrAgentsSection(
      {
        ...inventory,
        readText: async (path) => {
          if (path === "AGENTS.md") throw new Error("denied");
          return inventory.readText(path);
        },
      },
      ghcrPackage,
    ),
  ).resolves.toContain("AGENTS.md could not be inspected: denied");
  await expect(validateGhcrAgentsSection(createGhcrInventory())).resolves.toContain(
    "AGENTS.md must include: Pull command: docker pull ghcr.io/eliware/:vundefined",
  );
});
