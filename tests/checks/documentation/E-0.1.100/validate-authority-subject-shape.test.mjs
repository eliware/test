import { expect, test } from "@jest/globals";
import { validateAuthoritySubjectShape } from "../../../../src/checks/documentation/E-0.1.100/validate-authority-subject-shape.mjs";

function validSubject(id = "subject") {
  return {
    id,
    kind: "directive",
    authority: { path: "specs/rule.json", anchor: "rule" },
    directives: [{ path: "specs/rule.json" }],
    implementation: [{ path: "src/check.mjs" }],
    evidence: [{ path: "tests/check.test.mjs" }],
    consumers: [],
    reviewers: [],
    status: "active",
  };
}

test("validates one authority subject and reports independent shape errors", () => {
  const result = validateAuthoritySubjectShape(
    {
      id: "bad",
      kind: "unknown",
      authority: {},
      directives: null,
      implementation: [],
      status: "bad",
    },
    0,
    new Set(),
    new Set(),
  );
  expect(result).toHaveLength(8);
  expect(result.join("\n")).toContain("authority path");
  expect(result.join("\n")).toContain("directives must be an array");
  expect(result.join("\n")).toContain("implementation must be a nonempty array");
  expect(result.join("\n")).toContain("supported kind");
  expect(result.join("\n")).toContain("supported status");
});

test("skips a subject whose identity cannot safely index other shape rules", () => {
  expect(validateAuthoritySubjectShape(null, 0, new Set(), new Set())).toEqual([
    "authority subject 0 must declare an id.",
  ]);
});

test("accepts a complete authority subject", () => {
  expect(validateAuthoritySubjectShape(validSubject(), 0, new Set(), new Set())).toEqual([]);
  const noAnchor = validSubject("without-anchor");
  noAnchor.authority = { path: "specs/other.json" };
  expect(validateAuthoritySubjectShape(noAnchor, 1, new Set(), new Set())).toEqual([]);
});

test("reports duplicate subject ids and normative targets", () => {
  const subjectIds = new Set(["subject"]);
  const authorityTargets = new Set(["specs/rule.json#rule"]);
  const result = validateAuthoritySubjectShape(validSubject(), 1, subjectIds, authorityTargets);
  expect(result).toHaveLength(2);
  expect(result.join("\n")).toContain("is duplicated");
  expect(result.join("\n")).toContain("duplicates normative target");
});

test("collects malformed record arrays and missing metadata independently", () => {
  const result = validateAuthoritySubjectShape(
    {
      id: "partial",
      authority: null,
      directives: [null, { path: 4 }],
      implementation: [null],
      evidence: "invalid",
      consumers: null,
      reviewers: [],
      status: "unknown",
    },
    2,
    new Set(),
    new Set(),
  );
  expect(result.join("\n")).toContain("authority path");
  expect(result.join("\n")).toContain("directives[0]");
  expect(result.join("\n")).toContain("implementation[0]");
  expect(result.join("\n")).toContain("evidence must be an array");
  expect(result.join("\n")).toContain("consumers must be an array");
  expect(result.join("\n")).toContain("supported kind");
  expect(result.join("\n")).toContain("supported status");
});

test("requires nonempty directives and implementation arrays", () => {
  const subject = validSubject();
  subject.directives = [];
  subject.implementation = [];
  const result = validateAuthoritySubjectShape(subject, 0, new Set(), new Set());
  expect(result.join("\n")).toContain("directives must be a nonempty array");
  expect(result.join("\n")).toContain("implementation must be a nonempty array");
});
