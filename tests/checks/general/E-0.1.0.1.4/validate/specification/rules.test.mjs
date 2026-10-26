import { expect, test } from "@jest/globals";
import { validateSpecificationRules } from "../../../../../../src/checks/general/E-0.1.0.1.4/validate/specification/rules.mjs";

test("validates directive objects and their required fields", () => {
  expect(
    validateSpecificationRules([{ id: "E-0.1", dos: ["Do"], donts: ["Do not"] }], "rules"),
  ).toEqual([]);
  expect(validateSpecificationRules([null], "rules")).toEqual(["rules[0] must be an object."]);
  expect(
    validateSpecificationRules([{ id: "A-1", dos: [], donts: [" "] }], "rules").join(" "),
  ).toContain("valid E-rule ID");
  expect(
    validateSpecificationRules(
      [{ id: "E-1", dos: ["Do"], donts: ["Do not"], extra: true }],
      "rules",
    ).join(" "),
  ).toContain("unsupported fields");
});

test("validates optional examples and nested directive children", () => {
  expect(
    validateSpecificationRules(
      [{ id: "E-1", dos: ["Do"], donts: ["Do not"], examples: [" "] }],
      "rules",
    ),
  ).toEqual(["rules[0].examples must be a nonempty string list."]);
  expect(
    validateSpecificationRules(
      [{ id: "E-1", dos: ["Do"], donts: ["Do not"], children: [] }],
      "rules",
    ),
  ).toEqual(["rules[0].children must be a nonempty array."]);
  expect(
    validateSpecificationRules(
      [
        {
          id: "E-1",
          dos: ["Do"],
          donts: ["Do not"],
          children: [{ id: "E-1.0", dos: ["Child"], donts: ["No child"] }],
        },
      ],
      "rules",
    ),
  ).toEqual([]);
});
