import { expect, test } from "@jest/globals";
import { resolvePackageOverride } from "../../../../../src/checks/general/E-0.1.0.1.1/validate/resolve-package-override.mjs";

test("resolves a root override for a dependency at any depth", () => {
  expect(resolvePackageOverride({ joi: "^18.0.0" }, "mailauth", "joi")).toBe("^18.0.0");
});

test("resolves a parent-scoped override before a root override", () => {
  expect(
    resolvePackageOverride({ joi: "^18.0.0", mailauth: { joi: "^19.0.0" } }, "mailauth", "joi"),
  ).toBe("^19.0.0");
});

test("resolves the package override from the full object form", () => {
  expect(resolvePackageOverride({ joi: { ".": "^18.0.0" } }, "mailauth", "joi")).toBe("^18.0.0");
});

test("returns no override when the dependency is not selected", () => {
  expect(resolvePackageOverride({ joi: "^18.0.0" }, "mailauth", "semver")).toBeUndefined();
  expect(resolvePackageOverride({ joi: "^18.0.0" }, undefined, "joi")).toBe("^18.0.0");
  expect(resolvePackageOverride({ mailauth: { semver: "^1.0.0" } }, "mailauth", "joi")).toBe(
    undefined,
  );
  expect(resolvePackageOverride([], "mailauth", "joi")).toBeUndefined();
});

test("does not apply a direct parent override to the parent's dependencies", () => {
  expect(resolvePackageOverride({ mailauth: "^4.0.0" }, "mailauth", "joi")).toBeUndefined();
});
