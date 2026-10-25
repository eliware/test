import { expect, jest, test } from "@jest/globals";
import { createJestOutputPersistence } from "../../../../../../../../src/validation/stages/jest/progress/create/jest/console/persist-output.mjs";

test("clears, appends, and replaces persisted output", () => {
  const append = jest.fn();
  const replace = jest.fn();
  const persistence = createJestOutputPersistence("coverage/jest.log", { append, replace });

  expect(persistence.start()).toBe(true);
  expect(persistence.append("raw output")).toBe(true);
  expect(persistence.finish("redacted output")).toBe(true);
  expect(replace).toHaveBeenNthCalledWith(1, "coverage/jest.log", "", "utf8");
  expect(append).toHaveBeenCalledWith("coverage/jest.log", "raw output", "utf8");
  expect(replace).toHaveBeenNthCalledWith(2, "coverage/jest.log", "redacted output", "utf8");
});

test("skips persistence when no path is set", () => {
  const persistence = createJestOutputPersistence(undefined);

  expect(persistence.start()).toBe(true);
  expect(persistence.append("text")).toBe(true);
  expect(persistence.finish("text")).toBe(true);
});

test("reports failed writes", () => {
  const persistence = createJestOutputPersistence("coverage/jest.log", {
    append: () => {
      throw new Error("append failed");
    },
    replace: () => {
      throw new Error("replace failed");
    },
  });

  expect(persistence.start()).toBe(false);
  expect(persistence.append("text")).toBe(false);
  expect(persistence.finish("safe text")).toBe(false);
});
test("reports an append failure after a successful start", () => {
  let replaceCount = 0;
  const persistence = createJestOutputPersistence("coverage/jest.log", {
    append: () => {
      throw new Error("append failed");
    },
    replace: () => {
      replaceCount += 1;
    },
  });

  expect(persistence.start()).toBe(true);
  expect(persistence.append("text")).toBe(false);
  expect(persistence.finish("safe text")).toBe(false);
  expect(replaceCount).toBe(2);
});
