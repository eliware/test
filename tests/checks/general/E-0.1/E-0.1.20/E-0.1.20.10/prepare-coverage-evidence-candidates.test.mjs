import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, jest, test } from "@jest/globals";
import { createRepositoryInventory } from "../../../../../../src/checks/create-repository-inventory.mjs";
import { prepareCoverageEvidenceCandidates } from "../../../../../../src/checks/general/E-0.1/E-0.1.20/E-0.1.20.10/prepare-coverage-evidence-candidates.mjs";

test("uses the shared coverage inventory and cached source reads", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-coverage-inventory-"));
  await mkdir(join(root, "src"));
  await writeFile(join(root, "src", "expected.mjs"), "export const value = 1;\n");
  const inventory = createRepositoryInventory(root);
  try {
    const context = await prepareCoverageEvidenceCandidates(root, { inventory });
    expect(context.expectedFiles).toEqual(["src/expected.mjs"]);
    expect(Object.keys(context.expectedShapes)).toEqual(["src/expected.mjs"]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("discovers in-scope source files and preserves repository-relative report candidates", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-coverage-source-discovery-"));
  await mkdir(join(root, "src"));
  await mkdir(join(root, "tests"));
  await writeFile(join(root, "src", "expected.mjs"), "export const value = 1;\n");
  await writeFile(join(root, "tests", "example.test.mjs"), "test('excluded', () => {});\n");
  try {
    const context = await prepareCoverageEvidenceCandidates(root);
    expect(context.expectedFiles).toEqual(["src/expected.mjs"]);
    expect(context.candidates).toContain("coverage/coverage-final.json");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("maps isolated run candidates to basenames and uses the injected inventory reader", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-isolated-coverage-"));
  const coverageDirectory = join(root, "isolated");
  await mkdir(join(root, "src"));
  await writeFile(join(root, "src", "expected.mjs"), "export const value = 1;\n");
  const read = jest.fn(async (path) => path.endsWith("expected.mjs")
    ? "export const value = 1;\n"
    : "coverage report");
  const inventory = createRepositoryInventory(root, { read });
  try {
    const context = await prepareCoverageEvidenceCandidates(root, {
      inventory,
      coverageDirectory,
      expectedFiles: ["src/expected.mjs"],
    });
    expect(context.candidates[0]).toBe("coverage-final.json");
    await context.readCoverage(join(coverageDirectory, context.candidates[0]));
    expect(read).toHaveBeenCalledWith(join(coverageDirectory, "coverage-final.json"));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
