import { expect, test } from "@jest/globals";
import { validateAuthorityRecordShape } from "../../../../src/checks/documentation/E-1.100/validate-authority-record-shape.mjs";

test("rejects malformed authority records", () => {
  expect(validateAuthorityRecordShape({})).toContain("subjects array");
  expect(validateAuthorityRecordShape({ repositoryId: "x", globalAuthorityMap: "../../docs/map.json", subjects: [{}] })).toContain("must declare an id");
});

test("requires repository identity and validates subject path record fields", () => {
  expect(validateAuthorityRecordShape({ subjects: [] })).toBe("authority.json must declare repositoryId.");
  expect(validateAuthorityRecordShape({ repositoryId: "x", subjects: [] })).toBe("authority.json must declare globalAuthorityMap.");
  const base = { repositoryId: "x", globalAuthorityMap: "../global-map.json" };
  expect(validateAuthorityRecordShape({ ...base, subjects: [null] })).toBe("authority subject 0 must declare an id.");
  expect(validateAuthorityRecordShape({ ...base, subjects: [{ id: "subject" }] })).toBe("authority subject subject must declare an authority path.");
  expect(validateAuthorityRecordShape({ ...base, subjects: [{ id: "subject", authority: { path: "../authority.json" }, directives: null }] })).toBe("authority subject subject.directives must be an array.");
  expect(validateAuthorityRecordShape({ ...base, subjects: [{ id: "subject", authority: { path: "../authority.json" }, directives: [{}] }] })).toBe("authority subject subject.directives[0] must contain a path.");
});
