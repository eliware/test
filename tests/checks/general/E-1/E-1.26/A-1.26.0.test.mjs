import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import { run } from "../../../../../src/checks/general/E-1/E-1.26/A-1.26.0.mjs";

const validNotes = `# Release Notes

## 8.0.0 — 2026-09-24

### Added
- New capability.

## 6.0.1 — 2026-09-06

### Changed
- Updated validation.
`;

async function createFixture(notes = validNotes) {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-release-notes-"));
  await writeFile(join(root, "README.md"), "## Links\n\n[Release notes](RELEASE_NOTES.md)");
  await writeFile(join(root, "RELEASE_NOTES.md"), notes);
  return root;
}

test("accepts complete reverse-chronological release notes and README indexing", async () => {
  const root = await createFixture();
  await expect(run({ root, packageJson: { version: "8.0.0" } })).resolves.toEqual({
    ruleId: "A-1.26.0",
    status: "pass",
    message: "",
  });
  await rm(root, { recursive: true, force: true });
});

test.each([
  [
    "does not begin with the required title",
    validNotes.replace("# Release Notes", "# Release notes"),
    "8.0.0",
    "must begin with the exact heading",
  ],
  ["omits the current package version", validNotes, "9.0.0", "current package version"],
  [
    "orders versions incorrectly",
    validNotes.replace("## 6.0.1", "## 9.0.0"),
    "8.0.0",
    "strictly descending SemVer",
  ],
  [
    "orders dates incorrectly",
    validNotes.replace("6.0.1 — 2026-09-06", "6.0.1 — 2026-09-25"),
    "8.0.0",
    "reverse chronological order",
  ],
  [
    "contains an empty category",
    validNotes.replace("- New capability.", ""),
    "8.0.0",
    "must not leave the Added category empty",
  ],
])("rejects release notes that %s", async (_label, notes, version, expectedMessage) => {
  const root = await createFixture(notes);
  await expect(run({ root, packageJson: { version } })).resolves.toMatchObject({
    status: "fail",
    message: expect.stringContaining(expectedMessage),
  });
  await rm(root, { recursive: true, force: true });
});

test("rejects a missing README link and a non-canonical release category", async () => {
  const root = await createFixture(validNotes.replace("### Added", "### Features"));
  await expect(run({ root, packageJson: { version: "8.0.0" } })).resolves.toMatchObject({
    status: "fail",
    message: expect.stringContaining("unsupported category"),
  });
  await writeFile(join(root, "RELEASE_NOTES.md"), validNotes);
  await writeFile(join(root, "README.md"), "## Usage\n\n[Release notes](RELEASE_NOTES.md)");
  await expect(run({ root, packageJson: { version: "8.0.0" } })).resolves.toMatchObject({
    status: "fail",
    message: "README.md must link RELEASE_NOTES.md.",
  });
  await rm(root, { recursive: true, force: true });
});

test("requires release notes and README, and confines their link to the Links section", async () => {
  const root = await createFixture();
  await writeFile(join(root, "README.md"), "## Usage\n\n[Release notes](RELEASE_NOTES.md)");
  await expect(run({ root, packageJson: { version: "8.0.0" } })).resolves.toMatchObject({
    status: "fail",
    message: "README.md must link RELEASE_NOTES.md.",
  });
  await writeFile(
    join(root, "README.md"),
    "## Links\n\n[Release notes](RELEASE_NOTES.md)\n\n## License\n",
  );
  await expect(run({ root, packageJson: { version: "8.0.0" } })).resolves.toMatchObject({
    status: "pass",
  });
  await rm(join(root, "README.md"));
  await expect(run({ root, packageJson: { version: "8.0.0" } })).resolves.toMatchObject({
    status: "fail",
    message: expect.stringContaining("are required"),
  });
  await rm(root, { recursive: true, force: true });
});
