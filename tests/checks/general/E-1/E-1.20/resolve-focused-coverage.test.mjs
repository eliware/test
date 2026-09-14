import { expect, test } from "@jest/globals";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { resolveFocusedCoverage } from "../../../../../src/checks/general/E-1/E-1.20/resolve-focused-coverage.mjs";

test("maps an existing mirrored test to its source coverage", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-focused-test-"));
  await mkdir(join(root, "src"));
  await mkdir(join(root, "tests"));
  await writeFile(join(root, "src", "sample.mjs"), "export {};" );
  await writeFile(join(root, "tests", "sample.test.mjs"), "test(\"sample\", () => {});");
  await expect(resolveFocusedCoverage(root, "tests/sample.test.mjs")).resolves.toEqual([
    "--collectCoverageFrom", "src/sample.mjs",
  ]);
  await rm(root, { recursive: true, force: true });
});
