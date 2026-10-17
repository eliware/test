import { expect, test } from "@jest/globals";
import { isHumanReadableProse } from "../../../../../../src/checks/general/E-0.1.0.1.11/extract/is/human-readable-prose.mjs";

test.each([
  "LEFT JOIN FIX_BASE ON FIX_BASE.BASE_ID = procedure.id",
  "SELECT alignment, base, facility, fix, join, portion, real, transition, trim FROM nasr",
  "node --port PORT",
])("rejects code and command text: %s", (text) => {
  expect(isHumanReadableProse(text)).toBe(false);
});

test.each(["Join the team and fix the real base.", "Rotate the compass to show direction."])(
  "accepts ordinary prose: %s",
  (text) => {
    expect(isHumanReadableProse(text)).toBe(true);
  },
);
