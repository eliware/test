import { expect, test } from "@jest/globals";
import { parseEnvironmentMetadata } from "../../../../../src/checks/general/E-1/E-1.20/parse-env-metadata.mjs";

test("parses default, allowed, and range metadata", () => {
  expect(parseEnvironmentMetadata("default: dev allowed: dev | prod range: 1..3")).toEqual({
    default: "dev",
    allowed: "dev | prod",
    range: "1..3",
  });
});
