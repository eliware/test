import { expect, test } from "@jest/globals";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadValidationTarget } from "../../src/orchestrators/load-validation-target.mjs";

test("loads the target package metadata", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-load-target-"));
  await writeFile(join(root, "package.json"), JSON.stringify({ name: "@eliware/fixture", eliware: { apply: ["general"] } }));
  const packageJson = await loadValidationTarget(root);
  expect(packageJson.name).toBe("@eliware/fixture");
  expect(packageJson.eliware.apply).toEqual(["general"]);
  await rm(root, { recursive: true, force: true });
});
