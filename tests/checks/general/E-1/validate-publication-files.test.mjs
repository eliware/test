import { expect, test } from "@jest/globals";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { validatePublicationFiles } from "../../../../src/checks/general/E-1/validate-publication-files.mjs";

test("validates public package file allowlists", async () => {
  const packageJson = { eliware: { apply: ["npm-published"] }, files: ["README.md", "LICENSE", "RELEASE_NOTES.md", "docs/", "specs/"] };
  const root = await mkdtemp(join(tmpdir(), "eliware-test-publication-files-"));
  await Promise.all([writeFile(join(root, "README.md"), ""), writeFile(join(root, "LICENSE"), ""), writeFile(join(root, "RELEASE_NOTES.md"), ""), mkdir(join(root, "docs")), mkdir(join(root, "specs"))]);
  expect(validatePublicationFiles(packageJson, root)).toBeNull();
  expect(validatePublicationFiles({ eliware: { apply: ["npm-published"] } })).toContain("allowlist");
  expect(validatePublicationFiles({ private: true })).toBeNull();
  await rm(root, { recursive: true, force: true });
});

test("rejects malformed, broad, incomplete, and nonexistent public allowlists", async () => {
  const base = { publishConfig: { access: "public" } };
  expect(validatePublicationFiles({ ...base, files: [] }, ".")).toContain("nonempty files allowlist");
  expect(validatePublicationFiles({ ...base, files: ["**"] }, ".")).toContain("wildcard");
  expect(validatePublicationFiles({ ...base, files: ["README.md"] }, ".")).toContain("allowlist");
  expect(validatePublicationFiles({ ...base, files: ["README.md", "LICENSE", "RELEASE_NOTES.md", "docs", "specs", "missing"] }, ".")).toContain("allowlist target");
  expect(validatePublicationFiles({ ...base, files: ["README.md", "LICENSE", "RELEASE_NOTES.md", "docs", "specs"] }, undefined)).toContain("missing");
  const empty = await mkdtemp(join(tmpdir(), "eliware-test-publication-empty-"));
  expect(validatePublicationFiles({ ...base, files: ["README.md", "LICENSE", "RELEASE_NOTES.md", "docs", "specs"] }, empty)).toContain("missing: README.md");
  await rm(empty, { recursive: true, force: true });
});
