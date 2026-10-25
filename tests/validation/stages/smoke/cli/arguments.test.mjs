import { expect, test } from "@jest/globals";
import { validateSmokeCliArguments } from "../../../../../src/validation/stages/smoke/cli/arguments.mjs";

test("accepts one nonempty target argument", () => {
  expect(validateSmokeCliArguments(["--target", "consumer"])).toEqual({ target: "consumer" });
});

test.each([undefined, "--target", [], ["consumer"], ["--target", ""], ["--target", "a", "b"]])(
  "reports usage for invalid arguments %p",
  (args) => {
    expect(validateSmokeCliArguments(args)).toEqual({
      error: "Usage: npm run smoke -- --target <existing-consumer-path>",
    });
  },
);
