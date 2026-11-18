import { expect, test } from "@jest/globals";
import { ruleId } from "../../../src/checks/general/E-0.1.0.1.14.mjs";
import run from "../../../src/checks/general/E-0.1.0.1.14.mjs";

test("reports package lock errors under its own rule", async () => {
  await expect(run({ root: "missing", packageJson: {} })).resolves.toMatchObject({
    ruleId,
    status: "fail",
  });
});

test("accepts matching lock metadata", async () => {
  const packageJson = { name: "@eliware/example", version: "1.0.0" };
  const lockfile = {
    name: packageJson.name,
    version: packageJson.version,
    lockfileVersion: 3,
    packages: { "": { name: packageJson.name, version: packageJson.version } },
  };
  await expect(
    run({ root: "/repo", packageJson }, { read: async () => JSON.stringify(lockfile) }),
  ).resolves.toEqual({ ruleId, status: "pass", message: "" });
});

test("uses the default context and dependency reader", async () => {
  await expect(run()).resolves.toMatchObject({ ruleId, status: "fail" });
});
