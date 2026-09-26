import { expect, test } from "@jest/globals";
import { countSourceLines } from "../../../../../src/checks/general/E-0.1/E-0.1.20/count-source-lines.mjs";

test("counts empty, newline-terminated, and unterminated source", () => {
  expect(countSourceLines("")).toBe(0);
  expect(countSourceLines("a\n")).toBe(1);
  expect(countSourceLines("a\nb")).toBe(2);
});
