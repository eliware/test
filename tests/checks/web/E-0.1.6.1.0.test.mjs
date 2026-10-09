import { expect, test } from "@jest/globals";
import { ruleId, run } from "../../../src/checks/web/E-0.1.6.1.0.mjs";

test("requires the Web headings in AGENTS and README", async () => {
  const repositoryInventory = {
    readText: async (path) =>
      path === "AGENTS.md"
        ? "## Web"
        : "## Routes\n## Assets\n## Development server\n## Build\n## Deployment",
  };
  await expect(run({ repositoryInventory })).resolves.toEqual({
    ruleId,
    status: "pass",
    message: "",
  });
});

test("reports missing Web headings under the documentation rule", async () => {
  const repositoryInventory = {
    readText: async (path) => (path === "AGENTS.md" ? "## Other" : "## Routes\n## Build"),
  };
  await expect(run({ repositoryInventory })).resolves.toEqual({
    ruleId,
    status: "fail",
    message:
      "AGENTS.md must include: ## Web\n" +
      "README.md must include: ## Assets\n" +
      "README.md must include: ## Development server\n" +
      "README.md must include: ## Deployment",
  });
});

test("fails when repository documents are unavailable", async () => {
  await expect(run()).resolves.toEqual({
    ruleId,
    status: "fail",
    message: "Repository documents could not be inspected.",
  });
});
