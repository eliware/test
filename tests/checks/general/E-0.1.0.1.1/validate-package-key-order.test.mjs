import { validatePackageKeyOrder } from "../../../../src/checks/general/E-0.1.0.1.1/validate-package-key-order.mjs";

test("accepts listed keys in canonical order and unlisted keys at the end", () => {
  expect(
    validatePackageKeyOrder({
      name: "@eliware/example",
      version: "12.0.0",
      private: true,
      eliware: {},
      type: "module",
    }),
  ).toEqual([]);
});

test("rejects listed keys in the wrong order", () => {
  expect(validatePackageKeyOrder({ version: "12.0.0", name: "@eliware/example" })).toEqual([
    expect.stringContaining("package.json keys must follow canonical order"),
  ]);
});

test("rejects an unlisted key before listed keys", () => {
  expect(validatePackageKeyOrder({ type: "module", name: "@eliware/example" })).toEqual([
    expect.stringContaining("Unlisted keys must follow listed keys"),
  ]);
});

test("accepts an empty package object", () => {
  expect(validatePackageKeyOrder({})).toEqual([]);
});
