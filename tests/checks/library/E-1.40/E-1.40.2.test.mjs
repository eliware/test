import { expect, test } from "@jest/globals";
import { run } from "../../../../src/checks/library/E-1.40/E-1.40.2.mjs";

test("requires a nonempty pack script", () => {
  expect(run({ packageJson: { scripts: { pack: "eliware-test --pack" } } }).status).toBe("pass");
  expect(run({ packageJson: { scripts: {} } }).status).toBe("fail");
});
