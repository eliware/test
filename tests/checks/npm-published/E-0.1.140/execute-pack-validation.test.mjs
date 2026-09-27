import { beforeEach, expect, jest, test } from "@jest/globals";

const validatePackManifest = jest.fn();
jest.unstable_mockModule(
  "../../../../src/checks/npm-published/E-0.1.140/validate-pack-manifest.mjs",
  () => ({ validatePackManifest }),
);

const { executePackValidation } =
  await import("../../../../src/checks/npm-published/E-0.1.140/execute-pack-validation.mjs");

beforeEach(() => {
  jest.resetAllMocks();
  validatePackManifest.mockReturnValue(null);
});

test("skips execution outside pack mode", async () => {
  const runPack = jest.fn();
  await expect(
    executePackValidation({ root: "C:\\repo", executePack: true, mode: "other", runPack }),
  ).resolves.toBeNull();
  expect(runPack).not.toHaveBeenCalled();
});

test("runs the pack stage when explicitly selected and validates its manifest", async () => {
  const packageJson = { name: "@eliware/example", files: ["README.md", "LICENSE"] };
  const runPack = jest.fn(async () => ({ code: 0, stdout: "manifest" }));

  await expect(
    executePackValidation({
      root: "C:\\repo",
      packageJson,
      executePack: false,
      mode: "pack",
      toolArgs: ["--json"],
      runPack,
    }),
  ).resolves.toBeNull();
  expect(runPack).toHaveBeenCalledWith("C:\\repo", expect.any(Function), undefined, ["--json"]);
  expect(validatePackManifest).toHaveBeenCalledWith(
    "manifest",
    packageJson.files,
    packageJson.name,
  );
});

test("passes empty manifest output and optional package metadata to validation", async () => {
  await expect(
    executePackValidation({
      root: "C:\\repo",
      executePack: true,
      mode: "pack",
      runPack: async () => ({ code: 0 }),
    }),
  ).resolves.toBeNull();
  expect(validatePackManifest).toHaveBeenCalledWith("", undefined, undefined);
});

test("formats failed child-process diagnostics", async () => {
  await expect(
    executePackValidation({
      root: "C:\\repo",
      executePack: true,
      mode: "pack",
      runPack: async () => ({ code: 1, stdout: "pack findings", stderr: "details" }),
    }),
  ).resolves.toBe("npm pack failed: pack findings\ndetails");
  await expect(
    executePackValidation({
      root: "C:\\repo",
      executePack: true,
      mode: "pack",
      runPack: async () => ({ code: 1, stdout: "", stderr: "" }),
    }),
  ).resolves.toBe("npm pack failed without diagnostics.");
});

test("maps manifest errors and process startup failures", async () => {
  validatePackManifest.mockReturnValueOnce("manifest invalid");
  await expect(
    executePackValidation({
      root: "C:\\repo",
      executePack: true,
      mode: "pack",
      runPack: async () => ({ code: 0, stdout: "manifest" }),
    }),
  ).resolves.toBe("manifest invalid");
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
