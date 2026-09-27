import { expect, test } from "@jest/globals";
import { mayNameDeclaredDependency } from "../../../../../src/checks/general/E-0.1/E-0.1.20/may-name-declared-dependency.mjs";

test("recognizes declared packages in string, template, and concatenated expressions", () => {
  expect(mayNameDeclaredDependency({ type: "StringLiteral", value: "alpha/path" }, ["alpha"])).toBe(
    true,
  );
  expect(
    mayNameDeclaredDependency({ type: "TemplateLiteral", quasis: [{ value: { raw: "alpha/" } }] }, [
      "alpha",
    ]),
  ).toBe(true);
  expect(
    mayNameDeclaredDependency(
      {
        type: "BinaryExpression",
        left: { type: "Identifier", name: "prefix" },
        right: { type: "StringLiteral", value: "beta/" },
      },
      ["beta"],
    ),
  ).toBe(true);
});

test("returns false when supported expressions cannot name a declared package", () => {
  expect(mayNameDeclaredDependency(null, ["alpha"])).toBe(false);
  expect(mayNameDeclaredDependency({ type: "NumericLiteral", value: 1 }, ["alpha"])).toBe(false);
  expect(mayNameDeclaredDependency({ type: "StringLiteral", value: "other" }, ["alpha"])).toBe(
    false,
  );
});
