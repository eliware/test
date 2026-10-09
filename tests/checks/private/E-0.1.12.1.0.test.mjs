import { expect, test } from "@jest/globals";
import { ruleId, run } from "../../../src/checks/private/E-0.1.12.1.0.mjs";

test("E-0.1.12.1.0 accepts Private with GHCR publication", () => {
  expect(
    run({
      packageJson: {
        private: true,
        eliware: { apply: ["general", "private", "ghcr-published"] },
      },
    }),
  ).toEqual({ ruleId, status: "pass", message: "" });
});

test.each([undefined, false, "true"])("rejects package.json.private value %s", (value) => {
  expect(run({ packageJson: { private: value } })).toEqual({
    ruleId,
    status: "fail",
    message: "Private repositories must set package.json.private to true.",
  });
});

test("rejects a missing package manifest", () => {
  expect(run()).toEqual({
    ruleId,
    status: "fail",
    message: "Private repositories must set package.json.private to true.",
  });
});
