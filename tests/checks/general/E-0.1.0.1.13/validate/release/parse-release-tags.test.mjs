import { expect, test } from "@jest/globals";
import parseReleaseTags from "../../../../../../src/checks/general/E-0.1.0.1.13/validate/release/parse-release-tags.mjs";
test("parses Git tag output into a set", () => {
  expect(parseReleaseTags("v1.0.0\nv2.0.0\n")).toEqual(new Set(["v1.0.0", "v2.0.0", ""]));
  expect(parseReleaseTags(undefined)).toEqual(new Set(["undefined"]));
});
