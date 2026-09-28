import { expect, test } from "@jest/globals";
import { validateRunbookRecords } from "../../../../src/checks/workspace/E-0.1.110/validate-runbook-records.mjs";

const record = (id = "one") => ({
  file: `C:\\repo\\runbooks\\${id}.json`,
  record: {
    id,
    purpose: "purpose",
    owner: "owner",
    boundaries: { owns: ["one"], excludes: ["two"] },
    steps: ["step"],
  },
});

test("rejects invalid and duplicate records", () => {
  expect(validateRunbookRecords([{ file: "C:\\repo\\bad.json", record: {} }]).error).toContain(
    "generic",
  );
  expect(validateRunbookRecords([record(), record()]).error).toContain("unique");
});

test("returns a path-indexed record collection", () => {
  const result = validateRunbookRecords([record()]);
  expect(result.error).toBeNull();
  expect(result.filesByPath.get(record().file)).toEqual(record().record);
});

test("collects errors from records that could not be parsed", () => {
  const result = validateRunbookRecords([
    { file: "C:\\repo\\bad.json", error: new Error("invalid JSON") },
    record(),
  ]);
  expect(result.error).toContain("invalid JSON");
  expect(result.filesByPath.get(record().file)).toEqual(record().record);
});
