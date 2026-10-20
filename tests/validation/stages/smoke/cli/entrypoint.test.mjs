import { expect, jest, test } from "@jest/globals";
import { fileURLToPath, pathToFileURL } from "node:url";

const { runSmokeCliEntrypoint } =
  await import("../../../../../src/validation/stages/smoke/cli/entrypoint.mjs");

test("runs only when the entrypoint path matches", async () => {
  const prior = process.exitCode;
  const entryUrl = pathToFileURL("C:/checkout/src/validation/stages/smoke/cli/entrypoint.mjs");
  const run = jest.fn(async () => 18);
  try {
    await runSmokeCliEntrypoint({
      moduleUrl: entryUrl.href,
      argvPath: fileURLToPath(entryUrl),
      args: [],
      run,
    });
    expect(process.exitCode).toBe(18);
    expect(run).toHaveBeenCalledWith({ args: [] });
    await runSmokeCliEntrypoint({ moduleUrl: entryUrl.href, argvPath: "other.mjs", args: [], run });
    await runSmokeCliEntrypoint({ moduleUrl: entryUrl.href, args: [], run });
    expect(run).toHaveBeenCalledTimes(1);

    const path = "C:/checkout with spaces/entrypoint.mjs";
    await runSmokeCliEntrypoint({
      moduleUrl: pathToFileURL(path).href,
      argvPath: path,
      args: [],
      run,
    });
    expect(process.exitCode).toBe(18);
    expect(run).toHaveBeenCalledTimes(2);
    expect(run).toHaveBeenLastCalledWith({ args: [] });
  } finally {
    process.exitCode = prior;
  }
});
