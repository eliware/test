import { expect, test } from "@jest/globals";
import { parseEnvironmentAssignments } from "../../../../src/checks/general/E-1/parse-environment-assignments.mjs";

test("parses exported and quoted environment assignments", () => {
  expect(parseEnvironmentAssignments('export MAIL_OWNER_ADDRESS="fixture@eliware.org"\nOTHER=value')).toEqual([
    ["MAIL_OWNER_ADDRESS", "fixture@eliware.org"],
    ["OTHER", "value"],
  ]);
});
