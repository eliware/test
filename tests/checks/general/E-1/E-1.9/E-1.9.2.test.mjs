import { expect, test } from "@jest/globals";
import { run } from "../../../../../src/checks/general/E-1/E-1.9/E-1.9.2.mjs";

test("requires explicit convention documents", () => {
  expect(run({ packageJson: { eliware: { apply: ["general"] } } }).status).toBe("pass");
  expect(run({ packageJson: { eliware: { apply: [] } } }).status).toBe("fail");
});
