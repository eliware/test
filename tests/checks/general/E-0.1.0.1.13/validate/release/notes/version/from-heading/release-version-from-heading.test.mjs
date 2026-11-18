import { expect, test } from "@jest/globals";
import releaseVersionFromHeading from "../../../../../../../../../src/checks/general/E-0.1.0.1.13/validate/release/notes/version/from-heading/release-version-from-heading.mjs";
test("extracts a version and rejects malformed headings", () => {
  expect(releaseVersionFromHeading("## 1.2.3 — 2026-01-01")).toBe("1.2.3");
  expect(releaseVersionFromHeading("## 01.2.3 — 2026-01-01")).toBeNull();
});
