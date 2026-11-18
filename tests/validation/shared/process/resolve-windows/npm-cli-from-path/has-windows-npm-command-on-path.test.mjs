import { expect, test } from "@jest/globals";
import method from "../../../../../../src/validation/shared/process/resolve-windows/npm-cli-from-path/has-windows-npm-command-on-path.mjs";

test("exports one default method", () => {
  expect(typeof method).toBe("function");
});
