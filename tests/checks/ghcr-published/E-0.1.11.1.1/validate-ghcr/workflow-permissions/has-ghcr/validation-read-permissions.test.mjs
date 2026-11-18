import { expect, test } from "@jest/globals";
import method from "../../../../../../../src/checks/ghcr-published/E-0.1.11.1.1/validate-ghcr/workflow-permissions/has-ghcr/validation-read-permissions.mjs";

test("exports one default method", () => {
  expect(typeof method).toBe("function");
});
