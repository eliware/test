import { expect, test } from "@jest/globals";
import { isProtectedComponent } from "../../../../../../../src/checks/general/E-0.1.0.1.8/validate/tracked/is/protected-component.mjs";

test("detects protected component names and key formats without case sensitivity", () => {
  expect(isProtectedComponent("Credentials")).toBe(true);
  expect(isProtectedComponent("CLIENT.PFX")).toBe(true);
  expect(isProtectedComponent("client.p12")).toBe(true);
  expect(isProtectedComponent("public.json")).toBe(false);
});
