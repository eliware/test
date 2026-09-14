import { expect, test } from "@jest/globals";
import { executeFormatterValidation } from "../../../../../src/checks/general/E-1/E-1.20/execute-formatter-validation.mjs";

test("runs format and format-check modes with the correct write setting", async () => {
  const calls = [];
  const runFormatter = async (root, options) => { calls.push({ root, options }); return { code: 0, stdout: "", stderr: "" }; };
  await expect(executeFormatterValidation({ root: "/repo", executeFormat: true, mode: "format-check", runFormatter })).resolves.toBe("");
  await expect(executeFormatterValidation({ root: "/repo", executeFormat: true, mode: "format", runFormatter })).resolves.toBe("");
  expect(calls).toEqual([
    { root: "/repo", options: { write: false } },
    { root: "/repo", options: { write: true } },
  ]);
});

test("returns formatter diagnostics and startup failures", async () => {
  await expect(executeFormatterValidation({ executeFormat: true, mode: "format-check", runFormatter: async () => ({ code: 1, stdout: "bad.js", stderr: "" }) })).resolves.toBe("Prettier failed: bad.js");
  await expect(executeFormatterValidation({ executeFormat: true, mode: "format-check", runFormatter: async () => ({ code: 1, stdout: "", stderr: "" }) })).resolves.toBe("Prettier failed without diagnostics.");
  await expect(executeFormatterValidation({ executeFormat: true, mode: "format", runFormatter: async () => { throw new Error("spawn failed"); } })).resolves.toBe("Prettier could not be started: spawn failed");
});
