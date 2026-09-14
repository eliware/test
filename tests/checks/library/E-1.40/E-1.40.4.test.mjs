import { expect, test } from "@jest/globals";
import { run } from "../../../../src/checks/library/E-1.40/E-1.40.4.mjs";

test("requires a pack validation command", () => {
  expect(run({ packageJson: { scripts: { pack: "eliware-test --pack" } } }).status).toBe("pass");
  expect(run({ packageJson: { scripts: { pack: "echo package" } } }).status).toBe("fail");
});
