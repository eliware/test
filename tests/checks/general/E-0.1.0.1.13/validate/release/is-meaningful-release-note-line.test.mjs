import { expect, test } from "@jest/globals";
import { isMeaningfulReleaseNoteLine } from "../../../../../../src/checks/general/E-0.1.0.1.13/validate/release/is-meaningful-release-note-line.mjs";

test.each(["TBD", "TODO", "N/A", "None", "No change", "---", "1", "### Detail"])(
  "rejects non-meaningful release text: %s",
  (line) => expect(isMeaningfulReleaseNoteLine(line)).toBe(false),
);

test.each(["Adds a new feature.", "Fixes issue 1.", "Updated API v2."])(
  "accepts meaningful release text: %s",
  (line) => expect(isMeaningfulReleaseNoteLine(line)).toBe(true),
);
