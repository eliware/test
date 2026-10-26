import { expect, test } from "@jest/globals";
import { findRepositoryRecord } from "../../../../../src/checks/general/E-0.1.0.1.0/load-repo-map/find-repository-record.mjs";

const records = [
  { repositories: [{ repository: "eliware/example", id: "E-1" }] },
  { repositories: [{ repository: "eliware/other", id: "E-2" }] },
];

test("finds the repository that matches the package name", () => {
  expect(findRepositoryRecord(records, { name: "@eliware/example" })).toEqual({
    record: { repository: "eliware/example", id: "E-1" },
    error: null,
  });
});

test("reports invalid package names and missing records", () => {
  expect(findRepositoryRecord(records, { name: "example" })).toEqual({
    record: null,
    error: "The package name cannot identify a repo-map entry.",
  });
  expect(findRepositoryRecord(records, { name: "@eliware/missing" })).toEqual({
    record: null,
    error: null,
  });
});

test("reports duplicate records across YAML documents", () => {
  expect(
    findRepositoryRecord(
      [...records, { repositories: [{ repository: "eliware/example", id: "E-3" }] }],
      { name: "@eliware/example" },
    ),
  ).toEqual({
    record: null,
    error: "repo-map.yaml has duplicate entries for eliware/example.",
  });
});
