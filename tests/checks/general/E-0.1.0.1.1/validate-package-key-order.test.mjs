import { validatePackageKeyOrder } from "../../../../src/checks/general/E-0.1.0.1.1/validate-package-key-order.mjs";

test("accepts canonical keys in order and unlisted keys at the end", () => {
  expect(
    validatePackageKeyOrder({
      name: "@eliware/example",
      version: "12.0.0",
      type: "module",
      private: true,
      eliware: {},
      extra: true,
    }),
  ).toEqual([]);
});

test("rejects listed keys in the wrong order", () => {
  expect(validatePackageKeyOrder({ version: "12.0.0", name: "@eliware/example" })).toEqual([
    expect.stringContaining("package.json keys must follow canonical order"),
  ]);
});

test("rejects an unlisted key before listed keys", () => {
  expect(validatePackageKeyOrder({ extra: true, name: "@eliware/example" })).toEqual([
    expect.stringContaining("Unlisted keys must follow listed keys"),
  ]);
});

test("requires type in its canonical position", () => {
  expect(
    validatePackageKeyOrder({ name: "@eliware/example", version: "12.0.0", type: "module" }),
  ).toEqual([]);
  expect(
    validatePackageKeyOrder({
      name: "@eliware/example",
      version: "12.0.0",
      description: "Example",
      type: "module",
    }),
  ).toEqual([expect.stringContaining("package.json keys must follow canonical order")]);
});

test("accepts an empty package object", () => {
  expect(validatePackageKeyOrder({})).toEqual([]);
});
