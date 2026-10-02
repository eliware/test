import { expect, test } from "@jest/globals";
import { validateDirectiveRecords } from "../../../../../src/checks/general/E-0.1/E-0.1.22/validate-directive-records.mjs";

const valid = {
  id: "E-4.2",
  dos: ["Do the work."],
  donts: ["Do not skip the work."],
  directives: [{ id: "A-4.2.1", dos: ["Act."], donts: ["Do not omit it."] }],
  examples: [{ purpose: "Usage", markdown: "```text\nexample\n```" }],
};

test("accepts records matching the directive schema", () => {
  expect(validateDirectiveRecords([valid])).toEqual([]);
  expect(
    validateDirectiveRecords([
      {
        ...valid,
        examples: [
          {
            purpose: "Canonical README heading table",
            markdown: "Sole source of truth.",
            generalHeadings: ["Features", "Support"],
            profileHeadings: { application: ["Configuration"], private: [] },
          },
        ],
      },
    ]),
  ).toEqual([]);
});

test("requires a non-empty directive list", () => {
  expect(validateDirectiveRecords([])).toEqual(["directives must be a non-empty array."]);
  expect(validateDirectiveRecords(null)).toEqual(["directives must be a non-empty array."]);
});

test.each([null, [], { ...valid, id: 3 }, { ...valid, extra: true }])(
  "rejects malformed directive records",
  (record) => {
    expect(validateDirectiveRecords([record]).length).toBeGreaterThan(0);
  },
);

test("rejects empty or incorrectly typed required and nested arrays", () => {
  const errors = validateDirectiveRecords([
    { ...valid, dos: [], donts: [""] },
    { ...valid, dos: [4] },
    { ...valid, directives: [] },
    { ...valid, examples: "example" },
  ]);
  expect(errors).toEqual(
    expect.arrayContaining([
      expect.stringContaining(".dos must be a non-empty array"),
      expect.stringContaining(".donts[0] must be a non-empty string"),
      expect.stringContaining(".directives must be a non-empty array"),
      expect.stringContaining(".examples must be an array"),
    ]),
  );
});

test("rejects malformed example records and malformed nested children", () => {
  const errors = validateDirectiveRecords([
    { ...valid, examples: [null, { purpose: "", markdown: 2, extra: true }] },
    { ...valid, directives: [null] },
  ]);
  expect(errors).toEqual(
    expect.arrayContaining([
      expect.stringContaining("examples[1] contains an unsupported field"),
      expect.stringContaining("examples[0] must be an object"),
      expect.stringContaining("examples[1].purpose must be a non-empty string"),
      expect.stringContaining("examples[1].markdown must be a non-empty string"),
      expect.stringContaining("directives[0] must be an object"),
    ]),
  );
});

test("validates structured README heading tables in examples", () => {
  const errors = validateDirectiveRecords([
    {
      ...valid,
      examples: [
        {
          purpose: "Headings",
          markdown: "table",
          generalHeadings: [],
          profileHeadings: {
            unknown: [],
            application: "Configuration",
            cli: [" "],
          },
        },
        { purpose: "Headings", markdown: "table", profileHeadings: null },
        { purpose: "Headings", markdown: "table", profileHeadings: [] },
      ],
    },
  ]);
  expect(errors).toEqual(
    expect.arrayContaining([
      expect.stringContaining("generalHeadings must be a non-empty array"),
      expect.stringContaining("contains unsupported profile unknown"),
      expect.stringContaining("profileHeadings.application must be an array"),
      expect.stringContaining("profileHeadings.cli[0] must be a non-empty string"),
      expect.stringContaining("profileHeadings must be an object"),
    ]),
  );
});
