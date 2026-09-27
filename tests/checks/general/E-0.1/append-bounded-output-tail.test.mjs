import { expect, test } from "@jest/globals";
import { appendBoundedOutputTail } from "../../../../src/checks/general/E-0.1/append-bounded-output-tail.mjs";

test("keeps only the bounded output tail", () => {
  expect(appendBoundedOutputTail("", "x".repeat(5_000), 4_000)).toBe("x".repeat(4_000));
  expect(appendBoundedOutputTail("prefix", "tail", 8)).toBe("efixtail");
});
