import { expect, jest, test } from "@jest/globals";
import { run } from "../../../../src/checks/npm-published/E-0.1.140/E-0.1.140.1.mjs";

const validPackage = {
  engines: { node: ">=26 <27" },
  publishConfig: { provenance: true },
  files: ["README.md", "LICENSE", "RELEASE_NOTES.md", "docs/", "specs/"],
  scripts: { pack: "eliware-test --pack" },
};

test("stops before pack execution when package metadata is invalid", async () => {
  const runPack = jest.fn();
  await expect(
    run({
      packageJson: { ...validPackage, scripts: {} },
      executePack: true,
      mode: "pack",
      runPack,
    }),
  ).resolves.toMatchObject({ status: "fail" });
  expect(runPack).not.toHaveBeenCalled();
});

test("uses default pack options for ordinary validation", async () => {
  await expect(run({ packageJson: validPackage })).resolves.toMatchObject({ status: "pass" });
});

test("delegates selected pack validation and returns its result", async () => {
  const manifest = JSON.stringify([
    {
      files: [
        "package.json",
        "README.md",
        "LICENSE",
        "RELEASE_NOTES.md",
        "docs/README.md",
        "specs/README.md",
      ].map((path) => ({ path })),
    },
  ]);
  const runPack = jest.fn(async () => ({ code: 0, stdout: manifest, stderr: "" }));
  await expect(
    run({ packageJson: validPackage, executePack: true, mode: "pack", runPack }),
  ).resolves.toMatchObject({ ruleId: "E-0.1.140.1", status: "pass" });
  expect(runPack).toHaveBeenCalledTimes(1);
});

test("returns pack-stage diagnostics as a rule failure", async () => {
  await expect(
    run({
      packageJson: validPackage,
      root: "C:\\repo",
      executePack: true,
      mode: "pack",
      runPack: async () => ({ code: 1, stdout: "pack findings", stderr: "" }),
    }),
  ).resolves.toEqual({
    ruleId: "E-0.1.140.1",
    status: "fail",
    message: "npm pack failed: pack findings",
  });
});

test("allows the self-hosted package pack command", async () => {
  const packageJson = {
    ...validPackage,
    name: "@eliware/test",
    scripts: { pack: "node bin/eliware-test.mjs --pack" },
  };
  const stdout = JSON.stringify([
    {
      name: "@eliware/test",
      files: [
        "package.json",
        "README.md",
        "LICENSE",
        "RELEASE_NOTES.md",
        "docs/README.md",
        "specs/README.md",
      ].map((path) => ({ path })),
    },
  ]);
  const runPack = jest.fn(async () => ({ code: 0, stdout, stderr: "" }));
  await expect(
    run({ packageJson, executePack: true, mode: "pack", runPack }),
  ).resolves.toMatchObject({ status: "pass" });
  expect(runPack).toHaveBeenCalledTimes(1);
});
