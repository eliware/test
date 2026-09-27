import { expect, test } from "@jest/globals";
import { parseKnitSourceOperations } from "../../../../../src/checks/general/E-0.1/E-0.1.10/parse-knit-source-operations.mjs";

test("parses source with the supported module syntax", () => {
  expect(parseKnitSourceOperations("await run();").body[0].type).toBe("ExpressionStatement");
});

test("reuses a parsed program when supplied", () => {
  const program = { body: [] };
  expect(parseKnitSourceOperations("invalid source ignored", { program })).toBe(program);
});

test("throws for invalid source so the validator can report it", () => {
  expect(() => parseKnitSourceOperations("const value = ;")).toThrow();
});
