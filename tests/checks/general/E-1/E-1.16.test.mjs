import { expect, test } from "@jest/globals";
import { run } from "../../../../src/checks/general/E-1/E-1.16.mjs";

test("requires a v8 release version", () => {
  expect(run({ packageJson: { version: "8.0.0" } }).status).toBe("pass");
  expect(run({ packageJson: { version: "7.0.0" } }).status).toBe("fail");
});
