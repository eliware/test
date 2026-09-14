import { expect, test } from "@jest/globals";
import { run } from "../../../../../src/checks/general/E-1/E-1.9/E-1.9.0.mjs";

test("requires an explicit nonempty apply list", () => {
  expect(run({ packageJson: { eliware: { apply: ["general"] } } })).toEqual({
    ruleId: "E-1.9.0",
    status: "pass",
    message: "",
  });
  expect(run({ packageJson: { eliware: { apply: [] } } })).toEqual(
    expect.objectContaining({ status: "fail" }),
  );
});

test("rejects profiles absent from the bundled authority", () => {
  expect(run({ packageJson: { eliware: { apply: ["not-a-profile"] } } })).toMatchObject({ status: "fail" });
});
