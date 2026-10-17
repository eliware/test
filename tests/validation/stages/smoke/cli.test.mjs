import { afterEach, expect, jest, test } from "@jest/globals";

const readFile = jest.fn();
const runNpmConsumerSmoke = jest.fn();
jest.unstable_mockModule("node:fs/promises", () => ({ readFile }));
jest.unstable_mockModule(
  "../../../../src/validation/stages/smoke/run/npm-consumer-smoke.mjs",
  () => ({ runNpmConsumerSmoke }),
);

const { runSmokeCli } = await import("../../../../src/validation/stages/smoke/cli.mjs");

afterEach(() => readFile.mockReset());

test("validates the target argument and calls smoke with package metadata", async () => {
  readFile.mockResolvedValue(JSON.stringify({ name: "@eliware/test" }));
  const write = jest.fn();
  const smoke = jest.fn(async () => "Smoke passed: @eliware/test@13.0.0");
  await expect(
    runSmokeCli({ args: ["--target", "consumer"], root: "repo", write, smoke }),
  ).resolves.toBe(0);
  expect(readFile).toHaveBeenCalledWith(expect.stringMatching(/repo[\\/]package\.json$/), "utf8");
  expect(smoke).toHaveBeenCalledWith({
    root: "repo",
    packageJson: { name: "@eliware/test" },
    target: "consumer",
    write,
  });
  await expect(runSmokeCli({ args: ["consumer"], root: "repo", write })).resolves.toBe(18);
  const defaultWrite = jest.spyOn(console, "log").mockImplementation(() => {});
  try {
    await expect(runSmokeCli({ args: [] })).resolves.toBe(18);
    expect(defaultWrite).toHaveBeenCalledWith(
      "Usage: npm run smoke -- --target <existing-consumer-path>",
    );
  } finally {
    defaultWrite.mockRestore();
  }
});

test("reports smoke failures and package read errors", async () => {
  readFile.mockResolvedValue(JSON.stringify({ name: "@eliware/test" }));
  const write = jest.fn();
  await expect(
    runSmokeCli({
      args: ["--target", "consumer"],
      root: "repo",
      write,
      smoke: async () => "failed",
    }),
  ).resolves.toBe(17);
  readFile.mockRejectedValueOnce(new Error("missing package"));
  await expect(
    runSmokeCli({ args: ["--target", "consumer"], root: "missing", write }),
  ).resolves.toBe(17);
  expect(write).toHaveBeenCalledWith(expect.stringContaining("Tarball consumer smoke failed"));
});
