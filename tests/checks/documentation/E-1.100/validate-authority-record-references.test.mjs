import { expect, test } from "@jest/globals";
import { validateAuthorityRecordReferences } from "../../../../src/checks/documentation/E-1.100/validate-authority-record-references.mjs";

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
      subjects: [{ id: "subject", authority: { path: "../authority.json" }, implementation: [{ path: "https://example.test" }] }],
    },
  });
  expect(subjectResult).toContain("repository-relative");
  const authorityResult = await validateAuthorityRecordReferences({
    root: "C:\\repo",
    file: "C:\\repo\\authority.json",
    document: {
      globalAuthorityMap: "../global-map.json",
      subjects: [{ id: "subject", authority: { path: "https://example.test" } }],
    },
  });
  expect(authorityResult).toContain("repository-relative");
});
