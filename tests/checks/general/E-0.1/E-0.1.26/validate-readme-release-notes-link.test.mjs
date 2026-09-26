import { expect, test } from "@jest/globals";
import { validateReadmeReleaseNotesLink } from "../../../../../src/checks/general/E-0.1/E-0.1.26/validate-readme-release-notes-link.mjs";

test("accepts a release-notes link within the Links section", () => {
  for (const readme of [
  "## Links\n\n[Release notes](RELEASE_NOTES.md)",
  "## Links\n\n[Release notes](./RELEASE_NOTES.md#8.0.0)",
  "## Links\n\n[Release notes](RELEASE_NOTES.md)\n\n## License\n",
  ]) {
    expect(validateReadmeReleaseNotesLink(readme)).toBeNull();
  }
});

test("requires a Markdown release-notes link in the Links section", () => {
  for (const readme of [
  "## Usage\n\n[Release notes](RELEASE_NOTES.md)",
  "## Links\n\n[Release notes](other.md)",
  "## Links\n\nRelease notes are available at RELEASE_NOTES.md",
  ]) {
    expect(validateReadmeReleaseNotesLink(readme)).toBe("README.md must link RELEASE_NOTES.md.");
  }
});
