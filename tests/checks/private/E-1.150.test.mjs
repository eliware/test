import { expect, test } from "@jest/globals";
import { run } from "../../../src/checks/private/E-1.150.mjs";

test("requires private distribution", () => {
  expect(run({ packageJson: { private: true } }).status).toBe("pass");
  expect(run({ packageJson: { private: false } }).status).toBe("fail");
});
