import { expect, test } from "@jest/globals";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { inspectNoCoverageIgnoreSourceFiles } from "../../../../src/checks/general/E-0.1/inspect-no-coverage-ignore-source-files.mjs";

test("reports unreadable sources, forbidden ignores, and changed barrel classifications", async () => {
  const root = join("C:", "repo");
  const repositoryInventory = {
    readText: async (file) => {
      if (file.endsWith("unreadable.mjs")) throw new Error("read failed");
      return "// istanbul ignore next\nexport const value = 1;\n";
    },
  };
  const failures = await inspectNoCoverageIgnoreSourceFiles({
    root,
    files: [
      join(root, "src", "unreadable.mjs"),
      join(root, "src", "blocked.mjs"),
      join(root, "src", "barrel.mjs"),
    ],
    barrels: new Set(["src/barrel.mjs"]),
    allowedBarrels: new Set(["src/barrel.mjs"]),
    repositoryInventory,
    isPureBarrel: () => false,
  });

  expect(failures).toEqual([
    "src/unreadable.mjs could not be inspected: read failed",
    "Coverage-ignore directives are not allowed: src/blocked.mjs.",
    "Pure-barrel classification changed while scanning: src/barrel.mjs.",
  ]);
});

test("reads sources directly when no inventory is supplied", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-coverage-inspect-"));
  const file = join(root, "src", "clean.mjs");
  await mkdir(join(root, "src"));
  await writeFile(file, "export const clean = true;\n");
  try {
    await expect(
      inspectNoCoverageIgnoreSourceFiles({
        root,
        files: [file],
        barrels: new Set(),
        allowedBarrels: new Set(),
      }),
    ).resolves.toEqual([]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
