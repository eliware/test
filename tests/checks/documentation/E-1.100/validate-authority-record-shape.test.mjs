import { expect, test } from "@jest/globals";
import { validateAuthorityRecordShape } from "../../../../src/checks/documentation/E-1.100/validate-authority-record-shape.mjs";

const baseSubject = {
  id: "subject",
  kind: "specification",
  authority: { path: "../authority.json" },
  directives: [{ path: "../directives.json" }],
  implementation: [{ path: "../src", role: "implementation" }],
  consumers: ["consumers"],
  reviewers: ["reviewers"],
  evidence: [],
  status: "active",
};

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

test("enforces authority subject schema, kinds, and uniqueness", () => {
  const base = { repositoryId: "x", globalAuthorityMap: "../global-map.json" };
  expect(validateAuthorityRecordShape({ ...base, subjects: [baseSubject] })).toBeNull();
  expect(validateAuthorityRecordShape({ ...base, subjects: [{ ...baseSubject, kind: "unknown" }] })).toContain("supported kind");
  expect(validateAuthorityRecordShape({ ...base, subjects: [{ ...baseSubject, directives: [] }] })).toContain("nonempty");
  const { directives: _directives, ...withoutDirectives } = baseSubject;
  expect(validateAuthorityRecordShape({ ...base, subjects: [withoutDirectives] })).toContain("directives must be an array");
  expect(validateAuthorityRecordShape({ ...base, subjects: [{ ...baseSubject, implementation: [] }] })).toContain("implementation");
  expect(validateAuthorityRecordShape({ ...base, subjects: [{ ...baseSubject, consumers: null }] })).toContain("consumers");
  expect(validateAuthorityRecordShape({ ...base, subjects: [{ ...baseSubject, status: "unknown" }] })).toContain("supported status");
  expect(validateAuthorityRecordShape({ ...base, subjects: [baseSubject, { ...baseSubject, id: "other" }] })).toContain("normative target");
  expect(validateAuthorityRecordShape({ ...base, subjects: [baseSubject, { ...baseSubject }] })).toContain("duplicated");
});
