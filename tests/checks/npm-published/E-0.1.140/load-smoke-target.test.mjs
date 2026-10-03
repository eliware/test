import { afterEach, expect, test } from "@jest/globals";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { loadSmokeTarget } from "../../../../src/checks/npm-published/E-0.1.140/load-smoke-target.mjs";
import {
  createSmokeTarget,
  removeRoots,
} from "../../../../test-fixtures/npm-consumers/smoke-test-support.mjs";

let roots = [];

afterEach(async () => {
  await removeRoots(roots);
  roots = [];
});

test("loads an existing consumer with a test script and package dependency", async () => {
  const fixture = await createSmokeTarget(roots);
  const result = await loadSmokeTarget(fixture.target, "@eliware/test");
  expect(result.error).toBeNull();
  expect(result.targetPackage.scripts.test).toBe("eliware-test");
});

test.each([
  [{ scripts: {} }, "Smoke target must define an npm test script."],
  [{ scripts: { test: "test" } }, "Smoke target must declare @eliware/test as a dependency."],
])("rejects a consumer missing required metadata %#", async (packageJson, error) => {
  const fixture = await createSmokeTarget(roots);
  await writeFile(join(fixture.target, "package.json"), JSON.stringify(packageJson));
  await expect(loadSmokeTarget(fixture.target, "@eliware/test")).resolves.toHaveProperty(
    "error",
    error,
  );
});

test("rejects a nonexistent or uninstalled consumer", async () => {
  const fixture = await createSmokeTarget(roots);
  await expect(
    loadSmokeTarget(join(fixture.root, "missing"), "@eliware/test"),
  ).resolves.toHaveProperty(
    "error",
    "Smoke target must be an existing npm repository with installed dependencies.",
  );
});
