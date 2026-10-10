import { expect, test } from "@jest/globals";
import { validateReleaseNoteSections } from "../../../../src/checks/application/E-0.1.4.1.4/validate-release-note-sections.mjs";

test("requires release entries to contain categories and user-visible text", () => {
  expect(validateReleaseNoteSections(["# Release Notes", "## 1.0.0", "### Added", "TBD"])).toEqual([
    "## 1.0.0 subsection Added must contain user-visible change text.",
  ]);
  expect(validateReleaseNoteSections(["# Release Notes", "## 1.0.0"])).toContain(
    "## 1.0.0 must contain a release subsection.",
  );
  for (const text of ["TBD", "TODO", "N/A", "None", "No change", "---"]) {
    expect(
      validateReleaseNoteSections(["# Release Notes", "## 1.0.0", "### Added", text]).join("\n"),
    ).toContain("must contain user-visible change text");
  }
});

test("rejects repeated or misplaced categories and text outside categories", () => {
  const errors = validateReleaseNoteSections([
    "# Release Notes",
    "Text outside a release.",
    "### Unknown",
    "## 1.0.0",
    "Text outside a category.",
    "### Added",
    "Feature.",
    "### Added",
    "Second feature.",
  ]);
  expect(errors.join("\n")).toContain("must appear inside a release entry");
  expect(errors.join("\n")).toContain("RELEASE_NOTES.md has an unsupported subsection: Unknown");
  expect(errors.join("\n")).toContain("text outside a release subsection");
  expect(errors.join("\n")).toContain("must not repeat the Added subsection");
});

test("rejects unsupported headings and unsupported categories", () => {
  const errors = validateReleaseNoteSections([
    "# Release Notes",
    "## 1.0.0",
    "#### Detail",
    "### Unknown",
  ]);
  expect(errors.join("\n")).toContain("unsupported heading: #### Detail");
  expect(errors.join("\n")).toContain("unsupported subsection: Unknown");
});

test("accepts each supported category with meaningful text", () => {
  const names = ["Added", "Changed", "Fixed", "Breaking changes", "Migration", "Security"];
  const lines = ["# Release Notes", "## 1.0.0"];
  for (const name of names) lines.push(`### ${name}`, "Useful change.");
  expect(validateReleaseNoteSections(lines)).toEqual([]);
});
