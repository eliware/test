import { expect, test } from "@jest/globals";
import { validateModePlacement } from "../../../../src/cli/read/validate/mode-placement.mjs";

const modeFlags = ["--lint", "--audit"];

test("allows a single mode with delegated options", () => {
  expect(validateModePlacement(["--lint"], [], ["--lint"], modeFlags, [])).toBeUndefined();
});

test("rejects repeated timing flags and mutually exclusive modes", () => {
  expect(() => validateModePlacement(["--lint", "--audit"], [], modeFlags, modeFlags, [])).toThrow(
    "mutually exclusive",
  );
  expect(() => validateModePlacement([], ["--debug-timing"], [], modeFlags, [])).toThrow(
    "may be supplied once",
  );
});

test("requires diagnostic flags and modes in canonical positions", () => {
  expect(() =>
    validateModePlacement(["--lint", "--debug-timing"], [], ["--lint"], modeFlags, [1]),
  ).toThrow("must come before a tool mode");
  expect(() =>
    validateModePlacement(["--runInBand", "--lint"], [], ["--lint"], modeFlags, []),
  ).toThrow("must follow --lint");
});
