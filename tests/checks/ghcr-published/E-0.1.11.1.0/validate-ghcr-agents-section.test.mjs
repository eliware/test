import { expect, test } from "@jest/globals";
import {
  createGhcrInventory,
  ghcrAgents,
  ghcrPackage,
} from "../../../../test-fixtures/ghcr-workflow.mjs";
import { validateGhcrAgentsSection } from "../../../../src/checks/ghcr-published/E-0.1.11.1.0/validate-ghcr-agents-section.mjs";

test("accepts the canonical GHCR usage markers", async () => {
  await expect(validateGhcrAgentsSection(createGhcrInventory(), ghcrPackage)).resolves.toEqual([]);
});

test("checks markers inside the GHCR section", async () => {
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

test.each([
  "Supported tags: vMAJOR.MINOR.PATCH, latest",
  "latest is a mutable convenience alias and is never the release or deployment identity.",
])("rejects stale latest-tag claims: %s", async (line) => {
  await expect(
    validateGhcrAgentsSection(
      createGhcrInventory({ agents: `${ghcrAgents}\n${line}` }),
      ghcrPackage,
    ),
  ).resolves.toEqual(expect.arrayContaining([expect.stringContaining("AGENTS.md must not")]));
});

test("reports unavailable and unreadable AGENTS files", async () => {
  await expect(validateGhcrAgentsSection()).resolves.toContain("AGENTS.md could not be inspected.");
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
