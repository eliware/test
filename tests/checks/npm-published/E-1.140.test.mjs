import { expect, test } from "@jest/globals";
import { run } from "../../../src/checks/npm-published/E-1.140.mjs";

test("requires explicit public npm metadata", () => {
  expect(run({ packageJson: { private: false, publishConfig: { access: "public" } } })).toEqual({
    ruleId: "E-1.140",
    status: "pass",
    message: "",
  });
  expect(run({ packageJson: { private: true, publishConfig: { access: "public" } } })).toEqual(
    expect.objectContaining({ status: "fail" }),
  );
  expect(run({ packageJson: { private: false } })).toEqual(
    expect.objectContaining({ status: "fail", message: expect.stringContaining("publishConfig") }),
  );
  expect(run({ packageJson: { private: false, publishConfig: { access: "restricted" } } })).toEqual(
    expect.objectContaining({ status: "fail" }),
  );
});
