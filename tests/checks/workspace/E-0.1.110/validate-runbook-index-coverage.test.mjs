import { expect, test } from "@jest/globals";
import { validateRunbookIndexCoverage } from "../../../../src/checks/workspace/E-0.1.110/validate-runbook-index-coverage.mjs";

test("accepts records indexed by either workspace documentation surface", () => {
  const files = ["C:/repo/runbooks/deploy.json", "C:/repo/runbooks/notify.json"];
  expect(validateRunbookIndexCoverage(files, new Set(files))).toBeNull();
});

test("reports each unindexed record by filename", () => {
  expect(
    validateRunbookIndexCoverage(
      ["C:/repo/runbooks/deploy.json", "C:/repo/runbooks/notify.json"],
      new Set(["C:/repo/runbooks/deploy.json"]),
    ),
  ).toBe("Runbook records must be indexed: notify.json.");
});
