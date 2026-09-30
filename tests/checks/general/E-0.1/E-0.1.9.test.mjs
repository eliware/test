import { expect, test } from "@jest/globals";
import { run } from "../../../../src/checks/general/E-0.1/E-0.1.9.mjs";

test("requires an Eliware metadata object with profile applicability", () => {
  expect(run({ packageJson: { eliware: { apply: ["general"] } } })).toEqual({
    ruleId: "E-0.1.9",
    status: "pass",
    message: "",
  });
  expect(run({ packageJson: {} })).toEqual(expect.objectContaining({ status: "fail" }));
  expect(run({})).toEqual({
    ruleId: "E-0.1.9",
    status: "fail",
    message: "package.json must contain an eliware metadata object.",
  });
  expect(run({ packageJson: { eliware: {} } })).toMatchObject({
    status: "fail",
    message: expect.stringContaining("package.json.eliware.apply is required."),
  });
});

test("reports profile applicability failures", () => {
  for (const apply of [null, [], [""], [1], ["unknown"]]) {
    expect(run({ packageJson: { eliware: { apply } } })).toMatchObject({
      status: "fail",
    });
  }
});
