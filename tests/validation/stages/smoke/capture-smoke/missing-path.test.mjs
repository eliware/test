import { expect, test } from "@jest/globals";
import preserveMissingSmokePath from "../../../../../src/validation/stages/smoke/capture-smoke/missing-path.mjs";

test("preserves non-missing filesystem errors", () => {
  const error = new Error("denied");
  expect(() => preserveMissingSmokePath(error, "file")).toThrow(error);
});
