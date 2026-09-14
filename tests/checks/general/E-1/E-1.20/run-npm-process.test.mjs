import { expect, test } from "@jest/globals";
import { runNpmProcess } from "../../../../../src/checks/general/E-1/E-1.20/run-npm-process.mjs";

test("captures bounded stderr and exit status", async () => {
  await expect(runNpmProcess(process.execPath, ["-e", "process.stderr.write('diagnostic')"], process.cwd())).resolves.toEqual(
    expect.objectContaining({ code: 0, stderr: "diagnostic" }),
  );
});

test("rejects an unavailable executable", async () => {
  await expect(runNpmProcess("C:\\missing-executable", [], process.cwd())).rejects.toBeTruthy();
});
