import { expect, test } from "@jest/globals";
import { run } from "../../../../../src/checks/general/E-0.1/E-0.1.20/A-0.1.20.11.mjs";

test("requires stage scripts to be backed by explicit capabilities", () => {
  expect(
    run({ packageJson: { scripts: {} } }),
  ).toEqual({ ruleId: "A-0.1.20.11", status: "pass", message: "" });
  expect(run({ packageJson: {
    scripts: { typecheck: "tsc --noEmit", build: "npm run compile" },
    eliware: { capabilities: ["typecheck", "build"] },
  } })).toEqual({ ruleId: "A-0.1.20.11", status: "pass", message: "" });
  expect(run({ packageJson: { scripts: { typecheck: "tsc --noEmit" } } })).toMatchObject({ status: "fail" });
  expect(run({ packageJson: { scripts: {}, eliware: { capabilities: ["build"] } } })).toMatchObject({ status: "fail" });
  expect(run({ packageJson: { scripts: {}, eliware: { capabilities: ["deploy"] } } })).toMatchObject({ status: "fail" });
});
