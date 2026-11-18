import { expect, test } from "@jest/globals";
import method from "../../../../../src/checks/application/E-0.1.4.1.2/jest-globals-import/is-test-namespace.mjs";

test("exports one default method", () => {
  expect(typeof method).toBe("function");
});

test("recognizes Jest global namespace identifiers", () => {
  const names = {
    namespaces: new Set(["jest"]),
  };
  expect(
    method(
      {
        type: "Identifier",
        name: "jest",
      },
      names,
    ),
  ).toBe(true);
  expect(
    method(
      {
        type: "Identifier",
        name: "globalThis",
      },
      names,
    ),
  ).toBe(true);
  expect(
    method(
      {
        type: "Identifier",
        name: "other",
      },
      names,
    ),
  ).toBe(false);
});
