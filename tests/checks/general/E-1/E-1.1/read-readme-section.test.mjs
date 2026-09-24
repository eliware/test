import { expect, test } from "@jest/globals";
import { readSection } from "../../../../../src/checks/general/E-1/E-1.1/read-readme-section.mjs";

test("reads one case-insensitive section up to the next heading", () => {
  expect(readSection("## Usage\nRun command\n## Development\nNotes", "Usage")).toBe("run command");
  expect(readSection("## Links\nrepository", "Links")).toBe("repository");
});

test("returns an empty string for a missing section and supports punctuation in headings", () => {
  expect(readSection("## Usage\nrun command", "Missing")).toBe("");
  expect(readSection("## Exit codes\n0 means success", "Exit codes")).toBe("0 means success");
});
