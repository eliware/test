import { expect, test } from "@jest/globals";
import { hasOwnValues } from "../../../../../../src/checks/general/E-1/E-1.25/A-1.25.0/contract-schema.mjs";

test("validates required schema fields", () => {
  expect(hasOwnValues({ id: "C-1" }, ["id"])).toBe(true);
});
