import { expect, test } from "@jest/globals";
import { ruleId, run } from "../../../src/checks/documentation/E-0.1.1.1.0.mjs";

test("requires documentation profile sections", async () => {
  const repositoryInventory = {
    readText: async (path) =>
      path === "AGENTS.md"
        ? "## Documentation"
        : "## Scope\n## Navigation\n## Contribution\n## Documentation validation",
  };
  await expect(run({ repositoryInventory })).resolves.toEqual({
    ruleId,
    status: "pass",
    message: "",
  });
});

test("reports missing documentation profile sections", async () => {
  const repositoryInventory = { readText: async () => "" };
  await expect(run({ repositoryInventory })).resolves.toMatchObject({
    ruleId,
    status: "fail",
    message: expect.stringContaining("AGENTS.md must include: ## Documentation"),
  });
});

test("uses default arguments and reports a missing inventory", async () => {
  await expect(run()).resolves.toMatchObject({ status: "fail" });
});
