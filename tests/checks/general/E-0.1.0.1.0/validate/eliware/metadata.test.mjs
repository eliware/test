import { expect, test } from "@jest/globals";
import { validateEliwareMetadata } from "../../../../../../src/checks/general/E-0.1.0.1.0/validate/eliware/metadata.mjs";

test("accepts valid Eliware metadata", () => {
  expect(
    validateEliwareMetadata({
      eliware: { id: "E-1", apply: ["general"] },
    }),
  ).toEqual([]);
});

test("accepts the optional exemption key in canonical order", () => {
  expect(
    validateEliwareMetadata({ eliware: { id: "E-1", apply: ["general"], exempt: [] } }),
  ).toEqual([]);
});

test("rejects invalid keys and IDs", () => {
  const errors = validateEliwareMetadata({
    eliware: { apply: ["general"], extra: true },
  });
  expect(errors).toEqual(
    expect.arrayContaining([
      expect.stringContaining("ordered keys"),
      expect.stringContaining("E-number"),
    ]),
  );
});
