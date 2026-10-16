import { expect, test } from "@jest/globals";
import { toSemverRange } from "../../../../../src/checks/general/E-0.1.0.1.1/validate/to-semver-range.mjs";

test.each(["^1.2.3", "npm:alias@^1.2.3", "npm:@scope/package@~2.0.0"])(
  "accepts supported range %s",
  (value) => expect(toSemverRange(value)).not.toBeNull(),
);

test.each([undefined, "", "not-a-range", "npm:alias@bad"])(
  "rejects unsupported range %s",
  (value) => expect(toSemverRange(value)).toBeNull(),
);
