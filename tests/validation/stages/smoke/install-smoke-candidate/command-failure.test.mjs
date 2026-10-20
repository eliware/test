import { expect, test } from "@jest/globals";
import { smokeCommandFailure } from "../../../../../src/validation/stages/smoke/install-smoke-candidate/command-failure.mjs";

test.each([
  [{ stdout: "output", stderr: "error" }, "Install failed: output\nerror"],
  [{}, "Install failed."],
])("formats command details when they exist", (result, expected) => {
  expect(smokeCommandFailure(result, "Install failed")).toBe(expected);
});
