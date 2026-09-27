import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import { run } from "../../../../../src/checks/general/E-0.1/E-0.1.20/E-0.1.20.6.mjs";

test("maps valid lockfile shape and dependencies through the check", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-lockfile-"));
  await writeFile(join(root, "package-lock.json"), JSON.stringify({
    name: "fixture",
    version: "1.0.0",
    lockfileVersion: 3,
    packages: { "": { name: "fixture", version: "1.0.0" } },
  }));
  await expect(run({ root, packageJson: { name: "fixture", version: "1.0.0" } })).resolves.toEqual({
    ruleId: "E-0.1.20.6", status: "pass", message: "",
  });
  await rm(root, { recursive: true, force: true });
});

test("maps missing and malformed lockfile reads to a rule failure", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-lockfile-"));
  await expect(run({ root, packageJson: {} })).resolves.toMatchObject({ status: "fail" });
  await writeFile(join(root, "package-lock.json"), "not json");
  await expect(run({ root, packageJson: {} })).resolves.toMatchObject({ status: "fail" });
  await rm(root, { recursive: true, force: true });
});

test("maps lockfile shape and dependency findings to rule failures", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-lockfile-invalid-"));
  const packageJson = { name: "fixture", version: "1.0.0", dependencies: { alpha: "1.0.0" } };
  try {
    await writeFile(join(root, "package-lock.json"), JSON.stringify({
      name: "other",
      version: "1.0.0",
      lockfileVersion: 3,
      packages: { "": { name: "fixture", version: "1.0.0" } },
    }));
    await expect(run({ root, packageJson })).resolves.toMatchObject({
      status: "fail",
      message: expect.stringContaining("name and version"),
    });

    await writeFile(join(root, "package-lock.json"), JSON.stringify({
      name: "fixture",
      version: "1.0.0",
      lockfileVersion: 3,
      packages: { "": { name: "fixture", version: "1.0.0" } },
    }));
    await expect(run({ root, packageJson })).resolves.toMatchObject({
      status: "fail",
      message: expect.stringContaining("root dependencies"),
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
