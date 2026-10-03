import { mkdtemp, mkdir, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import { validateFocusedSourceTestPair } from "../../../../src/checks/general/E-0.1/validate-focused-source-test-pair.mjs";

test("accepts a valid focused source/test pair", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-focused-pair-"));
  await mkdir(join(root, "src"));
  await mkdir(join(root, "tests"));
  await writeFile(join(root, "src", "module.mjs"), "export {};\n");
  await writeFile(
    join(root, "tests", "module.test.mjs"),
    'import "../src/module.mjs"; test("ok", () => {});\n',
  );
  await expect(
    validateFocusedSourceTestPair(root, {
      sourcePath: "src/module.mjs",
      testPath: "tests/module.test.mjs",
    }),
  ).resolves.toEqual([]);
  await expect(
    validateFocusedSourceTestPair(root, {
      sourcePath: "src/module.mjs",
      testPath: "specs/module.test.mjs",
    }),
  ).resolves.toEqual([
    "Focused source/test paths must be repository-relative mirrored module paths.",
  ]);
  await rm(root, { recursive: true, force: true });
});

test("resolves a singular test/ root to its actual focused test file", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-focused-singular-pair-"));
  await mkdir(join(root, "src"));
  await mkdir(join(root, "test"));
  await writeFile(join(root, "src", "module.mjs"), "export {};\n");
  await writeFile(
    join(root, "test", "module.test.mjs"),
    'import "../src/module.mjs"; test("ok", () => {});\n',
  );
  await expect(
    validateFocusedSourceTestPair(root, {
      sourcePath: "src/module.mjs",
      testPath: "test/module.test.mjs",
    }),
  ).resolves.toEqual([]);
  await rm(root, { recursive: true, force: true });
});

test("reports missing, mismatched, and malformed focused pairs", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-focused-pair-"));
  await mkdir(join(root, "tests"));
  await writeFile(join(root, "tests", "other.test.mjs"), "const x = 1;\n");
  await expect(
    validateFocusedSourceTestPair(root, {
      sourcePath: "src/other.mjs",
      testPath: "tests/other.test.mjs",
    }),
  ).resolves.toEqual(
    expect.arrayContaining([
      "missing mirrored source: other.mjs",
      "tests/other.test.mjs does not declare an executable Jest test",
      "tests/other.test.mjs does not import its matching source module (src/other.mjs)",
    ]),
  );
  await expect(
    validateFocusedSourceTestPair(root, {
      sourcePath: "src/missing.mjs",
      testPath: "tests/missing.test.mjs",
    }),
  ).resolves.toEqual(["Focused test file is missing: missing.test.mjs"]);
  await expect(
    validateFocusedSourceTestPair(
      root,
      {
        sourcePath: "src/other.mjs",
        testPath: "tests/other.test.mjs",
      },
      async () => {
        throw new Error("read failed");
      },
    ),
  ).resolves.toEqual(["Focused test file is missing: other.test.mjs"]);
  await expect(
    validateFocusedSourceTestPair(join(root, "missing-root"), {
      sourcePath: "src/other.mjs",
      testPath: "tests/other.test.mjs",
    }),
  ).resolves.toEqual(["Focused test file is missing: other.test.mjs"]);
  await expect(
    validateFocusedSourceTestPair(root, {
      sourcePath: "src/other.mjs",
      testPath: "tests/different.test.mjs",
    }),
  ).resolves.toEqual(["focused source/test paths do not mirror: other.mjs and different.test.mjs"]);
  await rm(root, { recursive: true, force: true });
});

test("rejects traversal, absolute, and symlink-escaping focused pairs before reading", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-focused-boundary-"));
  const outside = await mkdtemp(join(tmpdir(), "eliware-focused-outside-"));
  await mkdir(join(root, "src"));
  await mkdir(join(root, "tests"));
  await writeFile(
    join(root, "tests", "module.test.mjs"),
    'import "../src/module.mjs"; test("x", () => {});\n',
  );
  await writeFile(join(outside, "module.mjs"), "export {};\n");
  try {
    await rm(join(root, "src"), { recursive: true, force: true });
    await symlink(outside, join(root, "src"), "junction");
  } catch (error) {
    await rm(root, { recursive: true, force: true });
    await rm(outside, { recursive: true, force: true });
    if (error.code === "EPERM") return;
    throw error;
  }
  try {
    await expect(
      validateFocusedSourceTestPair(root, {
        sourcePath: "src/../outside.mjs",
        testPath: "tests/outside.test.mjs",
      }),
    ).resolves.toEqual([
      "Focused source/test paths must be repository-relative mirrored module paths.",
    ]);
    await expect(
      validateFocusedSourceTestPair(root, {
        sourcePath: join(outside, "module.mjs"),
        testPath: "tests/module.test.mjs",
      }),
    ).resolves.toEqual([
      "Focused source/test paths must be repository-relative mirrored module paths.",
    ]);
    await expect(
      validateFocusedSourceTestPair(root, {
        sourcePath: "src/module.mjs",
        testPath: "tests/module.test.mjs",
      }),
    ).resolves.toEqual(["Focused source/test paths must resolve inside the repository."]);
  } finally {
    await rm(root, { recursive: true, force: true });
    await rm(outside, { recursive: true, force: true });
  }
});
