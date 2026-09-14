import { expect, test } from "@jest/globals";
import { executePackValidation } from "../../../../src/checks/npm-published/E-1.140/execute-pack-validation.mjs";

test("skips pack execution outside the pack stage", async () => {
  await expect(
    executePackValidation({
      root: "C:\\repo",
      executePack: true,
      mode: "other",
      packageJson: { files: ["README.md", "LICENSE", "RELEASE_NOTES.md"] },
      runPack: async () => ({ code: 0, stdout: JSON.stringify([{ files: ["package.json", "README.md", "LICENSE", "RELEASE_NOTES.md"].map((path) => ({ path })) }]) }),
    }),
  ).resolves.toBeNull();
});

test("reports pack diagnostics and startup failures", async () => {
  await expect(
    executePackValidation({
      root: "C:\\repo",
      executePack: true,
      mode: "pack",
      runPack: async () => ({ code: 1, stdout: "pack findings", stderr: "" }),
    }),
  ).resolves.toBe("npm pack failed: pack findings");
  await expect(
    executePackValidation({
      root: "C:\\repo",
      executePack: true,
      mode: "pack",
      runPack: async () => ({ code: 1, stdout: "", stderr: "" }),
    }),
  ).resolves.toBe("npm pack failed without diagnostics.");
  await expect(
    executePackValidation({
      root: "C:\\repo",
      executePack: true,
      mode: "pack",
      runPack: async () => {
        throw new Error("spawn failed");
      },
    }),
  ).resolves.toBe("npm pack could not be started: spawn failed");
});

test("reports successful pack execution", async () => {
  await expect(
    executePackValidation({
      root: "C:\\repo",
      executePack: true,
      mode: "pack",
      packageJson: { files: ["README.md", "LICENSE", "RELEASE_NOTES.md"] },
      runPack: async () => ({ code: 0, stdout: JSON.stringify([{ files: ["package.json", "README.md", "LICENSE", "RELEASE_NOTES.md"].map((path) => ({ path })) }]) }),
    }),
  ).resolves.toBeNull();
});

test("rejects a successful pack without usable manifest output", async () => {
  await expect(executePackValidation({
    root: "C:\\repo",
    packageJson: { files: ["README.md", "LICENSE", "RELEASE_NOTES.md"] },
    executePack: true,
    mode: "pack",
    runPack: async () => ({ code: 0, stdout: null, stderr: null }),
  })).resolves.toContain("invalid JSON");
});
