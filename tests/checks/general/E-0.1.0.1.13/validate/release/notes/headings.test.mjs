import { expect, test } from "@jest/globals";
import { releaseEntryHeadings } from "../../../../../../../src/checks/general/E-0.1.0.1.13/validate/release/notes/headings.mjs";

test("returns release headings and skips headings inside Markdown code", () => {
  const content = [
    "# Release Notes",
    "",
    "## 15.0.1 — 2026-10-25",
    "",
    "```md",
    "## 0.0.0 — example",
    "```",
    "### Added",
    "",
    "## 15.0.0 — 2026-10-20",
  ].join("\n");

  expect(releaseEntryHeadings(content)).toEqual([
    "## 15.0.1 — 2026-10-25",
    "## 15.0.0 — 2026-10-20",
  ]);
});

test("ignores a leading UTF-8 byte-order mark", () => {
  expect(releaseEntryHeadings("\uFEFF# Release Notes\n\n## 15.0.1 — 2026-10-25")).toEqual([
    "## 15.0.1 — 2026-10-25",
  ]);
});
