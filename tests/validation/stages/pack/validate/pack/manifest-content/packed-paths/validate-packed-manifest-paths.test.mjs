import { expect, test } from "@jest/globals";
import method from "../../../../../../../../src/validation/stages/pack/validate/pack/manifest-content/packed-paths/validate-packed-manifest-paths.mjs";

test("exports one default method", () => {
  expect(typeof method).toBe("function");
});
