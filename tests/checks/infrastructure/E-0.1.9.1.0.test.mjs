import { expect, test } from "@jest/globals";
import { ruleId, run } from "../../../src/checks/infrastructure/E-0.1.9.1.0.mjs";

test("requires infrastructure profile sections", async () => {
  const headings = {
    "AGENTS.md": "## Infrastructure",
    "README.md":
      "## Managed targets\n## Configuration\n## Desired state\n## Validation\n## Change boundaries",
  };
  const repositoryInventory = { readText: async (path) => headings[path] };
  await expect(run({ repositoryInventory })).resolves.toEqual({
    ruleId,
    status: "pass",
    message: "",
  });
});

test("reports missing infrastructure profile sections", async () => {
  const repositoryInventory = { readText: async () => "" };
  await expect(run({ repositoryInventory })).resolves.toMatchObject({ ruleId, status: "fail" });
});

test("uses default arguments and reports a missing inventory", async () => {
  await expect(run()).resolves.toMatchObject({ status: "fail" });
});
