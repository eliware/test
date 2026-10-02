import { expect, test } from "@jest/globals";
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { parse } from "yaml";
import {
  resolveCanonicalJestConfiguration,
  run,
} from "../../../../../src/checks/general/E-0.1/E-0.1.20/E-0.1.20.7.mjs";
import { createRepositoryInventory } from "../../../../../src/checks/create-repository-inventory.mjs";

const conventionPath = join(process.cwd(), "specs", "conventions", "general.yaml");
const canonical = resolveCanonicalJestConfiguration(parse(await readFile(conventionPath, "utf8")));

async function createRoot() {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-jest-"));
  const target = join(root, "specs", "conventions", "general.yaml");
  await mkdir(dirname(target), { recursive: true });
  await copyFile(conventionPath, target);
  return root;
}

test("resolves the canonical Jest object from general conventions", () => {
  expect(canonical).toEqual({
    testEnvironment: "node",
    testMatch: ["**/tests/**/*.test.mjs"],
    collectCoverageFrom: ["src/**/*.mjs"],
    coverageReporters: ["text", "json-summary"],
    coverageThreshold: {
      global: { branches: 100, functions: 100, lines: 100, statements: 100 },
    },
  });
  expect(() => resolveCanonicalJestConfiguration({ directives: [] })).toThrow(
    "general.yaml must define the canonical Jest JSON configuration.",
  );
});

test("requires every repository to use exact canonical Jest settings", async () => {
  const root = await createRoot();
  try {
    await expect(run({ root, packageJson: { jest: canonical } })).resolves.toEqual({
      ruleId: "E-0.1.20.7",
      status: "pass",
      message: "",
    });
    for (const jest of [
      undefined,
      {},
      { ...canonical, testEnvironment: "jsdom" },
      { ...canonical, extraOption: true },
      Object.fromEntries(Object.entries(canonical).filter(([key]) => key !== "coverageThreshold")),
    ]) {
      await expect(run({ root, packageJson: { jest } })).resolves.toEqual(
        expect.objectContaining({ status: "fail" }),
      );
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("rejects separate Jest configuration files", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-jest-config-"));
  const target = join(root, "specs", "conventions", "general.yaml");
  await mkdir(dirname(target), { recursive: true });
  await copyFile(conventionPath, target);
  await writeFile(join(root, "jest.config.mjs"), "export default {};\n");
  await expect(
    run({
      root,
      packageJson: { jest: canonical },
      repositoryInventory: createRepositoryInventory(root, { includeTestResults: true }),
    }),
  ).resolves.toEqual(expect.objectContaining({ status: "fail" }));
  await rm(root, { recursive: true, force: true });
});

test("reports configuration inspection failures", async () => {
  await expect(
    run({ root: "C:\\missing-repository", packageJson: { jest: canonical } }),
  ).resolves.toEqual(
    expect.objectContaining({
      ruleId: "E-0.1.20.7",
      status: "fail",
      message: expect.stringContaining("Jest configuration files could not be inspected"),
    }),
  );
});

test("reports failures when the repository root cannot be enumerated", async () => {
  const root = join(await mkdtemp(join(tmpdir(), "eliware-test-jest-root-")), "not-a-directory");
  await writeFile(root, "not a directory");
  await expect(run({ root, packageJson: { jest: canonical } })).resolves.toEqual(
    expect.objectContaining({
      status: "fail",
      message: expect.stringContaining("could not be inspected"),
    }),
  );
  await rm(root, { force: true });
});
