import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import { run } from "../../../../../src/checks/general/E-1/E-1.20/E-1.20.6.mjs";

test("requires a matching npm v3 lockfile", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-lockfile-"));
  await writeFile(
    join(root, "package-lock.json"),
    JSON.stringify({
      name: "fixture",
      version: "1.0.0",
      lockfileVersion: 3,
      packages: { "": { name: "fixture", version: "1.0.0" } },
    }),
  );
  await expect(run({ root, packageJson: { name: "fixture", version: "1.0.0" } })).resolves.toEqual({
    ruleId: "E-1.20.6",
    status: "pass",
    message: "",
  });
  await rm(root, { recursive: true, force: true });
});

test("rejects stale root dependency metadata", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-lockfile-"));
  await writeFile(
    join(root, "package-lock.json"),
    JSON.stringify({
      name: "fixture",
      version: "1.0.0",
      lockfileVersion: 3,
      packages: { "": { name: "fixture", version: "1.0.0", dependencies: { alpha: "1.0.0" } } },
    }),
  );
  await expect(
    run({
      root,
      packageJson: { name: "fixture", version: "1.0.0", dependencies: { beta: "1.0.0" } },
    }),
  ).resolves.toEqual(expect.objectContaining({ status: "fail" }));
  await rm(root, { recursive: true, force: true });
});

test("rejects a lockfile missing a direct dependency package entry", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-lockfile-"));
  await writeFile(
    join(root, "package-lock.json"),
    JSON.stringify({
      name: "fixture",
      version: "1.0.0",
      lockfileVersion: 3,
      packages: {
        "": { name: "fixture", version: "1.0.0", dependencies: { alpha: "1.0.0" } },
      },
    }),
  );
  await expect(
    run({ root, packageJson: { name: "fixture", version: "1.0.0", dependencies: { alpha: "1.0.0" } } }),
  ).resolves.toEqual(expect.objectContaining({ status: "fail" }));
  await rm(root, { recursive: true, force: true });
});

test("rejects missing, invalid, mismatched, and incomplete lockfiles", async () => {
  const packageJson = { name: "fixture", version: "1.0.0" };
  const cases = [
    { lockfile: null, message: "package-lock.json is required" },
    { lockfile: { name: "other", version: "1.0.0", lockfileVersion: 3, packages: { "": packageJson } }, message: "name and version" },
    { lockfile: { name: "fixture", version: "1.0.0", lockfileVersion: 2, packages: { "": packageJson } }, message: "lockfileVersion 3" },
    { lockfile: { name: "fixture", version: "1.0.0", lockfileVersion: 3, packages: { "": { name: "other", version: "1.0.0" } } }, message: "root package metadata" },
  ];
  for (const { lockfile, message } of cases) {
    const root = await mkdtemp(join(tmpdir(), "eliware-test-lockfile-"));
    if (lockfile === null) await writeFile(join(root, "package-lock.json"), "not json");
    else await writeFile(join(root, "package-lock.json"), JSON.stringify(lockfile));
    await expect(run({ root, packageJson })).resolves.toEqual(
      expect.objectContaining({ status: "fail", message: expect.stringContaining(message) }),
    );
    await rm(root, { recursive: true, force: true });
  }
});

test("reports regenerated lockfile mismatches and errors", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-lockfile-"));
  const packageJson = { name: "fixture", version: "1.0.0" };
  await writeFile(join(root, "package-lock.json"), JSON.stringify({
    name: "fixture", version: "1.0.0", lockfileVersion: 3,
    packages: { "": { name: "fixture", version: "1.0.0" } },
  }));
  await expect(run({ root, packageJson, regeneratedMatches: async () => false })).resolves.toEqual(
    expect.objectContaining({ status: "fail", message: expect.stringContaining("does not match") }),
  );
  await expect(run({ root, packageJson, regeneratedMatches: async () => { throw new Error("npm failed"); } })).resolves.toEqual({
    ruleId: "E-1.20.6", status: "fail", message: "npm failed",
  });
  await expect(run({ root, packageJson, regeneratedMatches: async () => true })).resolves.toEqual({
    ruleId: "E-1.20.6", status: "pass", message: "",
  });
  await rm(root, { recursive: true, force: true });
});
