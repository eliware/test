import { expect, test } from "@jest/globals";
import { parseEnvironmentAssignments } from "../../../../src/checks/general/E-0.1/parse-environment-assignments.mjs";

test("parses exported and quoted environment assignments", () => {
  expect(
    parseEnvironmentAssignments('export MAIL_OWNER_ADDRESS="fixture@eliware.org"\nOTHER=value'),
  ).toEqual([
    ["MAIL_OWNER_ADDRESS", "fixture@eliware.org"],
    ["OTHER", "value"],
  ]);
});

test("preserves valid lower-case environment assignment names", () => {
  expect(parseEnvironmentAssignments("export local_setting=value")).toEqual([
    ["local_setting", "value"],
  ]);
});
