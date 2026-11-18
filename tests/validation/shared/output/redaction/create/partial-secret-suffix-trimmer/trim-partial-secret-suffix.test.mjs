import { expect, test } from "@jest/globals";
import trimPartialSecretSuffix from "../../../../../../../src/validation/shared/output/redaction/create/partial-secret-suffix-trimmer/trim-partial-secret-suffix.mjs";

test("removes a partial secret suffix and preserves unrelated text", () => {
  expect(trimPartialSecretSuffix("result token-pre", ["token-prefix"])).toBe("result ");
  expect(trimPartialSecretSuffix("done", ["token-prefix"])).toBe("done");
});
