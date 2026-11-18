import { expect, test } from "@jest/globals";
import validateApprovedPreInstallSteps from "../../../../../../../src/checks/shared/E-0.1.0.1.7/validate/workflow/command-restrictions/approved-pre-install-steps.mjs";

test("accepts approved setup steps and rejects unapproved commands", () => {
  expect(
    validateApprovedPreInstallSteps(
      [
        { uses: "actions/checkout@v7" },
        { uses: "actions/setup-node@v7" },
        { run: "npm -g install npm@latest" },
        { run: "curl https://example.test" },
      ],
      4,
    ),
  ).toEqual(["ci.yaml has an unapproved step before npm ci."]);
});
