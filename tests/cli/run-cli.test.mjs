import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, jest, test } from "@jest/globals";
import { runCli } from "../../src/cli/run-cli.mjs";

test("reports the package version", async () => {
  const output = [];
  await expect(runCli(["--version"], (value) => output.push(value))).resolves.toBe(0);
  expect(output).toEqual(["8.0.0"]);
});

test("reports the convention-only help contract", async () => {
  const output = [];
  await expect(runCli(["--help"], (value) => output.push(value))).resolves.toBe(0);
  expect(output[0]).toContain("Usage: eliware-test");
  expect(output[0]).toContain("--debug-timing");
  expect(output[0]).toContain("--audit");
  expect(output[0]).toContain("--pack");
});

test("rejects conflicting informational and validation arguments before dispatch", async () => {
  const output = [];
  await expect(runCli(["--help", "--lint"], (value) => output.push(value))).resolves.toBe(18);
  expect(output).toEqual(["Informational commands cannot be combined with validation arguments."]);
});

test("runs convention validation and reports debug timing when requested", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-cli-"));
  await writeFile(join(root, "README.md"), "# fixture\n");
  await writeFile(join(root, "AGENTS.md"), "eliware/docs eliware/conventions eliware/operations\n");
  await mkdir(join(root, "specs"));
  await writeFile(
    join(root, "specs", "README.md"),
    "# specs\n- [contracts.json](contracts.json)\n",
  );
  await writeFile(
    join(root, "specs", "contracts.json"),
    JSON.stringify({
      schemaVersion: "1.0",
      contractVersion: "8.0",
      kind: "contract-reference",
      description: "fixture",
      authority: {},
      format: {},
      contracts: [
        {
          id: "C-1.1",
          title: "fixture",
          scope: "test",
          directiveIds: ["E-1.25"],
          dos: [],
          donts: [],
          contract: {
            purpose: "",
            inputs: [],
            outputs: [],
            errors: [],
            ordering: [],
            invariants: [],
            boundaries: {},
          },
          implementation: {},
          verification: {},
        },
      ],
    }),
  );
  await writeFile(join(root, "package.json"), JSON.stringify({ eliware: { apply: ["fork"] } }));
  const output = [];
  await expect(
    runCli(["--debug-timing"], (value) => output.push(value), root, { executeJest: false }),
  ).resolves.toBe(0);
  expect(output.at(-1)).toMatch(/^Validation time: \d+ms$/);
  expect(output.some((line) => /completed, starting/.test(line))).toBe(false);
});

test("fails when package metadata cannot be read", async () => {
  const output = [];
  await expect(
    runCli([], (value) => output.push(value), "C:/path-that-does-not-exist", {
      executeJest: false,
    }),
  ).resolves.toBe(18);
  expect(output).toHaveLength(1);
  expect(output[0]).toMatch(/package\.json|ENOENT/i);
});

test("fails fast when package.json.eliware is absent", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-no-meta-"));
  await writeFile(join(root, "package.json"), JSON.stringify({ name: "fixture" }));
  const output = [];
  await expect(
    runCli([], (value) => output.push(value), root, { executeJest: false }),
  ).resolves.toBe(18);
  expect(output).toEqual(["package.json.eliware is required for Eliware validation."]);
});

test("runs a configured convention validation target without starting Jest", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-cli-configured-"));
  await writeFile(
    join(root, "package.json"),
    JSON.stringify({ name: "fixture", version: "1.0.0", type: "module", eliware: { apply: ["fork"] } }),
  );
  await writeFile(join(root, "README.md"), "# fixture\n");
  await writeFile(join(root, "AGENTS.md"), "eliware/docs eliware/conventions eliware/operations\n");
  await mkdir(join(root, "specs"));
  await writeFile(join(root, "specs", "README.md"), "# specs\n");
  const output = [];
  await expect(runCli([], (value) => output.push(value), root, { executeJest: false })).resolves.toBe(0);
  expect(output).toEqual(["All tests passed | 100x4 coverage | 0 lint warnings"]);
});

test("passes explicit stage controls to injected validation", async () => {
  let received;
  const output = [];
  await expect(
    runCli([], (value) => output.push(value), process.cwd(), {
      executeJest: true,
      executeLint: false,
      executeAudit: false,
      executePack: false,
      executePackageChecks: false,
      executeFormat: false,
      runValidation: async (...args) => {
        received = args;
        return [];
      },
      runConventionStage: async (runChecks) => {
        await runChecks();
        return { code: 0, category: "conventions", diagnostics: [] };
      },
    }),
  ).resolves.toBe(0);
  expect(received[2]).toEqual({
    executeJest: true,
    executeLint: false,
    executeAudit: false,
    executePack: false,
    executePackageChecks: false,
    executeFormat: false,
    mode: null,
    jestArgs: [],
    timing: expect.any(Object),
  });
  expect(output).toEqual(["All tests passed | 100x4 coverage | 0 lint warnings"]);
});

test("normalizes unexpected validation errors", async () => {
  const output = [];
  await expect(
    runCli([], (value) => output.push(value), process.cwd(), {
      runConventionStage: async () => {
        throw new Error("validation exploded");
      },
    }),
  ).resolves.toBe(18);
  expect(output).toEqual(["validation exploded"]);
});

test("uses CLI defaults when optional arguments are omitted", async () => {
  const log = jest.spyOn(console, "log").mockImplementation(() => {});
  try {
    await expect(runCli(["--version"])).resolves.toBe(0);
  } finally {
    log.mockRestore();
  }

  let received;
  await expect(
    runCli([], () => {}, process.cwd(), {
      runValidation: async (...args) => {
        received = args;
        return [];
      },
      runConventionStage: async (runChecks) => {
        await runChecks();
        return { code: 0, category: "conventions", diagnostics: [] };
      },
    }),
  ).resolves.toBe(0);
  expect(received[2]).toMatchObject({
    executeJest: true,
    executeLint: true,
    executeAudit: true,
    executePack: true,
    executePackageChecks: true,
    executeFormat: true,
  });
});
