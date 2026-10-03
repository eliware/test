import { afterEach, expect, jest, test } from "@jest/globals";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  runSmokeCli,
  runSmokeCliEntrypoint,
} from "../../../../src/checks/npm-published/E-0.1.140/smoke-cli.mjs";

let root;
afterEach(async () => {
  if (root) await rm(root, { recursive: true, force: true });
  root = undefined;
});

test("validates the target argument and calls smoke with source package metadata", async () => {
  root = await mkdtemp(join(tmpdir(), "eliware-smoke-cli-"));
  await writeFile(join(root, "package.json"), JSON.stringify({ name: "@eliware/test" }));
  const write = jest.fn();
  const smoke = jest.fn(async () => "Smoke passed: @eliware/test@11.0.0");
  await expect(runSmokeCli({ args: ["--target", "consumer"], root, write, smoke })).resolves.toBe(
    0,
  );
  expect(smoke).toHaveBeenCalledWith({
    root,
    packageJson: { name: "@eliware/test" },
    target: "consumer",
    write,
  });
  await expect(runSmokeCli({ args: ["consumer"], root, write })).resolves.toBe(18);
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
  root = await mkdtemp(join(tmpdir(), "eliware-smoke-cli-error-"));
  await writeFile(join(root, "package.json"), JSON.stringify({ name: "@eliware/test" }));
  const write = jest.fn();
  await expect(
    runSmokeCli({ args: ["--target", "consumer"], root, write, smoke: async () => "failed" }),
  ).resolves.toBe(17);
  await expect(
    runSmokeCli({ args: ["--target", "consumer"], root: "missing", write }),
  ).resolves.toBe(17);
  expect(write).toHaveBeenCalledWith(expect.stringContaining("Tarball consumer smoke failed"));
});

test("executes only when the entrypoint path matches", async () => {
  const prior = process.exitCode;
  const cliUrl = pathToFileURL(
    join(process.cwd(), "src/checks/npm-published/E-0.1.140/smoke-cli.mjs"),
  );
  const run = jest.fn(async () => 18);
  try {
    await runSmokeCliEntrypoint({
      moduleUrl: cliUrl.href,
      argvPath: fileURLToPath(cliUrl),
      args: [],
      run,
    });
    expect(process.exitCode).toBe(18);
    expect(run).toHaveBeenCalledWith({ args: [] });
    await runSmokeCliEntrypoint({ moduleUrl: cliUrl.href, argvPath: "other.mjs", args: [], run });
    await runSmokeCliEntrypoint({ moduleUrl: cliUrl.href, args: [], run });
    expect(run).toHaveBeenCalledTimes(1);
  } finally {
    process.exitCode = prior;
  }
});
