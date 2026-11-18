import { expect, test } from "@jest/globals";
import method from "../../../../../../../../src/validation/stages/pack/validate/pack/manifest-content/allowlist-coverage/validate-pack-manifest-unused-allowlist-entries.mjs";

test("exports one default method", () => {
  expect(typeof method).toBe("function");
});
