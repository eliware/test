import { expect, test } from "@jest/globals";
import { createOutputByteBudget } from "../../src/checks/create-output-byte-budget.mjs";

test("accounts for a shared byte limit across output streams", () => {
  const budget = createOutputByteBudget(5);
  budget.append("stdout", "abc");
  budget.append("stderr", "def");

  expect(budget.output).toEqual({ stdout: "abc", stderr: "de" });
  expect(budget.isFull()).toBe(true);
});

test("truncates output and diagnostics at valid UTF-8 boundaries", () => {
  const budget = createOutputByteBudget(4);
  budget.append("stdout", "abc🔐");

  expect(budget.output.stdout).toBe("abc");
  expect(budget.truncate("abc🔐")).toBe("abc");
  expect(budget.truncate("abcdef")).toBe("abcd");
});

test("keeps empty budgets empty and accepts exact byte-limit values", () => {
  const empty = createOutputByteBudget(0);
  empty.append("stdout", "ignored");
  expect(empty.truncate("ignored")).toBe("");
  expect(empty.output).toEqual({ stdout: "", stderr: "" });

  const exact = createOutputByteBudget(4);
  exact.append("stderr", "okay");
  expect(exact.output.stderr).toBe("okay");
});
