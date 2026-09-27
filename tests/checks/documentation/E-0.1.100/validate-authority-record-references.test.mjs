import { expect, test } from "@jest/globals";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { validateAuthorityRecordReferences } from "../../../../src/checks/documentation/E-0.1.100/validate-authority-record-references.mjs";

test("rejects non-repository-relative authority references", async () => {
  const result = await validateAuthorityRecordReferences({
    root: "C:\\repo",
    file: "C:\\repo\\authority.json",
    document: { globalAuthorityMap: "https://example.test", subjects: [] },
  });
  expect(result).toContain("repository-relative");
  const subjectResult = await validateAuthorityRecordReferences({
    root: "C:\\repo",
    file: "C:\\repo\\authority.json",
    document: {
      globalAuthorityMap: "../global-map.json",
      subjects: [
        {
          id: "subject",
          authority: { path: "../authority.json" },
          implementation: [{ path: "https://example.test" }],
        },
      ],
    },
  });
  expect(subjectResult).toContain("outside every registered repository path");
  const authorityResult = await validateAuthorityRecordReferences({
    root: "C:\\repo",
    file: "C:\\repo\\authority.json",
    document: {
      globalAuthorityMap: "../global-map.json",
      subjects: [{ id: "subject", authority: { path: "https://example.test" } }],
    },
  });
  expect(authorityResult).toContain("outside every registered repository path");
});

test("validates local subject authority and path records while ignoring unrelated fields", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-authority-record-references-valid-"));
  const file = join(root, "authority.json");
  await writeFile(join(root, "global-map.json"), "{}");
  await writeFile(join(root, "subject-authority.json"), "{}");
  await writeFile(join(root, "directive.json"), "{}");
  await writeFile(join(root, "implementation.json"), "{}");
  await writeFile(join(root, "evidence.json"), "{}");
  await expect(
    validateAuthorityRecordReferences({
      root,
      file,
      document: {
        globalAuthorityMap: "./global-map.json",
        subjects: [
          {
            id: "subject",
            authority: { path: "./subject-authority.json" },
            directives: [{ path: "./directive.json" }],
            implementation: [{ path: "./implementation.json" }],
            evidence: [{ path: "./evidence.json" }],
            consumers: [{ path: "./ignored.json" }],
          },
        ],
      },
    }),
  ).resolves.toBeNull();
});

test("rejects invalid subject path-record collections", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-authority-record-references-invalid-"));
  const file = join(root, "authority.json");
  await writeFile(join(root, "global-map.json"), "{}");
  await writeFile(join(root, "subject-authority.json"), "{}");
  await expect(
    validateAuthorityRecordReferences({
      root,
      file,
      document: {
        globalAuthorityMap: "./global-map.json",
        subjects: [
          {
            id: "subject",
            authority: { path: "./subject-authority.json" },
            directives: "invalid",
          },
        ],
      },
    }),
  ).resolves.toContain("directives must be an array");
  await expect(
    validateAuthorityRecordReferences({
      root,
      file,
      document: {
        globalAuthorityMap: "./global-map.json",
        subjects: [{ id: "subject", authority: { path: "./missing.json" } }],
      },
    }),
  ).resolves.toContain("does not resolve");
});
