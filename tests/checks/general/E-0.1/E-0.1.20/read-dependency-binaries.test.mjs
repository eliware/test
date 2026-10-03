import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import { readDependencyBinaries } from "../../../../../src/checks/general/E-0.1/E-0.1.20/read-dependency-binaries.mjs";

test("maps unique binary names from string and object lockfile entries", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-dependency-bins-"));
  const packages = {
    "node_modules/@scope/tool": { bin: "bin/tool" },
    "node_modules/another-tool": { bin: { another: "cli.js" } },
    "node_modules/first-owner": { bin: { shared: "first.js" } },
    "node_modules/second-owner": { bin: { shared: "second.js" } },
    "node_modules/no-bin": {},
  };
  await writeFile(join(root, "package-lock.json"), JSON.stringify({ packages }));
  try {
    await expect(
      readDependencyBinaries(root, [
        "@scope/tool",
        "another-tool",
        "first-owner",
        "second-owner",
        "no-bin",
      ]),
    ).resolves.toEqual(
      new Map([
        ["tool", "@scope/tool"],
        ["another", "another-tool"],
      ]),
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("returns no binary mappings when a lockfile cannot be read or parsed", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-missing-lock-"));
  try {
    await expect(readDependencyBinaries(root, ["tool"])).resolves.toEqual(new Map());
    await writeFile(join(root, "package-lock.json"), "invalid json");
    await expect(readDependencyBinaries(root, ["tool"])).resolves.toEqual(new Map());
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
