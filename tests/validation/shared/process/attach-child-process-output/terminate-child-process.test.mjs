import { expect, test } from "@jest/globals";
import method from "../../../../../src/validation/shared/process/attach-child-process-output/terminate-child-process.mjs";

test("exports one default method", () => {
  expect(typeof method).toBe("function");
});
