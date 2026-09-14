import { expect, test } from "@jest/globals";
import { run } from "../../../../src/checks/general/E-1/E-1.9.mjs";

test("requires the Eliware metadata object and its core fields", () => {
  expect(run({ packageJson: { eliware: { apply: [], authority: {}, crosslinks: [] } } })).toEqual({
    ruleId: "E-1.9",
    status: "pass",
    message: "",
  });
  expect(run({ packageJson: {} })).toEqual(expect.objectContaining({ status: "fail" }));
  expect(run({})).toEqual({
    ruleId: "E-1.9",
    status: "fail",
    message: "package.json must contain an eliware metadata object.",
  });
  for (const field of ["apply", "authority", "crosslinks"]) {
    const eliware = { apply: [], authority: {}, crosslinks: [] };
    delete eliware[field];
    expect(run({ packageJson: { eliware } })).toEqual({
      ruleId: "E-1.9",
      status: "fail",
      message: `package.json.eliware.${field} is required.`,
    });
  }
});
