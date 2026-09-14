import { expect, test } from "@jest/globals";
import { run } from "../../../../../src/checks/general/E-1/E-1.20/A-1.20.11.mjs";

test("accepts absent or nonempty declared stage scripts", () => {
  expect(
    run({ packageJson: { scripts: { typecheck: "tsc --noEmit", build: "npm run compile" } } }),
  ).toEqual({ ruleId: "A-1.20.11", status: "pass", message: "" });
  expect(run({ packageJson: { scripts: { build: "" } } })).toEqual(
    expect.objectContaining({ status: "fail" }),
  );
});
