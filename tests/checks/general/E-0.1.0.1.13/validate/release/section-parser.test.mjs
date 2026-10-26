import { expect, test } from "@jest/globals";
import { parseReleaseNoteSections } from "../../../../../../src/checks/general/E-0.1.0.1.13/validate/release/section-parser.mjs";

test("parses entries, sections, and section content", () => {
  expect(
    parseReleaseNoteSections([
      "# Release Notes",
      "## 15.0.0",
      "### Added",
      "A new feature.",
      "### Fixed",
      "A correction.",
    ]),
  ).toEqual({
    entries: [
      {
        heading: "## 15.0.0",
        sections: [
          { heading: "### Added", name: "Added", content: ["A new feature."] },
          { heading: "### Fixed", name: "Fixed", content: ["A correction."] },
        ],
      },
    ],
    unscopedSections: [],
    errors: [],
  });
});

test("tracks unscoped sections, unsupported headings, and text outside sections", () => {
  expect(
    parseReleaseNoteSections(["# Release Notes", "### Added", "Before release", "#### Note"]),
  ).toEqual({
    entries: [],
    unscopedSections: [{ heading: "### Added", name: "Added", content: ["Before release"] }],
    errors: ["RELEASE_NOTES.md contains an unsupported heading: #### Note."],
  });
  expect(parseReleaseNoteSections(["# Release Notes", "Text outside"])).toMatchObject({
    errors: ["RELEASE_NOTES.md must not contain text outside a release subsection."],
  });
});
