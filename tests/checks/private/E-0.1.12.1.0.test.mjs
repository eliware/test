import { expect, test } from "@jest/globals";
import { ruleId, run } from "../../../src/checks/private/E-0.1.12.1.0.mjs";

const repositoryInventory = { readText: async () => "## Private distribution" };

test("E-0.1.12.1.0 accepts Private with GHCR publication", async () => {
  await expect(
    run({
      packageJson: {
        private: true,
        eliware: { apply: ["general", "private", "ghcr-published"] },
      },
      repositoryInventory,
    }),
  ).resolves.toEqual({ ruleId, status: "pass", message: "" });
});

test.each([undefined, false, "true"])("rejects package.json.private value %s", async (value) => {
  await expect(run({ packageJson: { private: value }, repositoryInventory })).resolves.toEqual({
    ruleId,
    status: "fail",
    message: "Private repositories must set package.json.private to true.",
  });
});

test("rejects a missing package manifest", async () => {
  await expect(run({ repositoryInventory })).resolves.toEqual({
    ruleId,
    status: "fail",
    message: "Private repositories must set package.json.private to true.",
  });
});

test("uses its default context", async () => {
  await expect(run()).resolves.toMatchObject({ ruleId, status: "fail" });
});
