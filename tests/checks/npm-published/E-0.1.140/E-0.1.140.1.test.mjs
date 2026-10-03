import { expect, jest, test } from "@jest/globals";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { run } from "../../../../src/checks/npm-published/E-0.1.140/E-0.1.140.1.mjs";

const validPackage = {
  engines: { node: ">=26 <27" },
  publishConfig: { provenance: true },
  files: ["src/", "docs/", "README.md", "AGENTS.md", "LICENSE", "RELEASE_NOTES.md"],
  scripts: { pack: "eliware-test --pack" },
  eliware: { apply: ["application", "npm-published"] },
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
  expect(validPackage.files).not.toContain("specs/");
  const manifest = JSON.stringify([
    {
      files: [
        "package.json",
        "README.md",
        "AGENTS.md",
        "LICENSE",
        "RELEASE_NOTES.md",
        "src/index.mjs",
        "docs/README.md",
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
    files: [...validPackage.files, "bin/", "specs/"],
    eliware: { apply: ["cli", "npm-published"] },
    bin: "./bin/eliware-test.mjs",
    scripts: { pack: "node bin/eliware-test.mjs --pack" },
  };
  const stdout = JSON.stringify([
    {
      name: "@eliware/test",
      files: [
        "package.json",
        "README.md",
        "AGENTS.md",
        "LICENSE",
        "RELEASE_NOTES.md",
        "src/checks/index.mjs",
        "bin/eliware-test.mjs",
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

test("rejects standalone npm ignore files", async () => {
  await expect(
    run({
      packageJson: validPackage,
      repositoryInventory: { files: async () => ["src/index.mjs", ".npmignore"] },
    }),
  ).resolves.toMatchObject({
    status: "fail",
    message: "Public npm repositories must not contain .npmignore files: .npmignore.",
  });
});

test("validates included environment examples and reports invalid or missing files", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-pack-env-test-"));
  const packageJson = { ...validPackage, files: [...validPackage.files, ".env.example"] };
  try {
    await writeFile(join(root, ".env.example"), "API_KEY=${API_KEY}\n");
    const input = { packageJson, root, repositoryInventory: { files: async () => [] } };
    await expect(run(input)).resolves.toMatchObject({ status: "pass" });
    await writeFile(join(root, ".env.example"), "API_KEY=real-secret\n");
    await expect(run(input)).resolves.toMatchObject({ status: "fail" });
    await rm(join(root, ".env.example"));
    await expect(run(input)).resolves.toMatchObject({ status: "fail" });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
