import { expect, test } from "@jest/globals";
import { compareRepoMapRecord } from "../../../../../src/checks/general/E-0.1.0.1.0/validate/compare-repo-map-record.mjs";

const packageJson = {
  description: "Example repository",
  keywords: ["example"],
  eliware: { id: "E-1", apply: ["general"] },
};
const record = {
  repository: "eliware/example",
  id: "E-1",
  description: "Example repository",
  keywords: ["example"],
  profiles: ["general"],
};

test("skips comparison when the optional repo map is absent", () => {
  expect(compareRepoMapRecord(packageJson, { available: false, record: null })).toEqual([]);
});

test("skips comparison when the repo map has no matching entry", () => {
  expect(compareRepoMapRecord(packageJson, { available: true, record: null })).toEqual([]);
});

test("compares package metadata when the repo map has a matching entry", () => {
  expect(compareRepoMapRecord(packageJson, { available: true, record })).toEqual([]);
  expect(
    compareRepoMapRecord({ ...packageJson, description: "Mismatch" }, { available: true, record }),
  ).toEqual(["package.json.description must match repo-map.yaml."]);
});
