import { expect, test } from "@jest/globals";
import { createOutputByteBudget } from "../../src/checks/create-output-byte-budget.mjs";

test("accounts for a shared byte limit across output streams", () => {
  const budget = createOutputByteBudget(5);
  budget.append("stdout", "abc");
  budget.append("stderr", "def");

  expect(budget.output).toEqual({ stdout: "abc", stderr: "de" });
  expect(budget.isFull()).toBe(true);
});

test("joins bounded stream chunks without changing their order", () => {
  const budget = createOutputByteBudget(1000);
  for (let index = 0; index < 100; index += 1) budget.append("stdout", "x");

  expect(budget.output.stdout).toBe("x".repeat(100));
  expect(budget.isFull()).toBe(false);
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

test("truncates large multibyte output at a bounded valid UTF-8 prefix", () => {
  const text = "🔐".repeat(25_000);
  const truncated = createOutputByteBudget(99_999).truncate(text);

  expect(Buffer.byteLength(truncated)).toBe(99_996);
  expect(truncated).toBe("🔐".repeat(24_999));
});

test("keeps multibyte boundaries valid when the byte limit is shared across streams", () => {
  const budget = createOutputByteBudget(6);
  budget.append("stdout", "ab");
  budget.append("stderr", "🔐x");

  expect(budget.output).toEqual({ stdout: "ab", stderr: "🔐" });
  expect(Buffer.byteLength(budget.output.stdout + budget.output.stderr)).toBe(6);
});

test("returns empty output for a negative truncate limit", () => {
  expect(createOutputByteBudget(-1).truncate("text")).toBe("");
});
