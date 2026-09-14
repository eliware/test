import { expect, test } from "@jest/globals";
import {
  nonEmptyString,
  stringList,
  validRecord,
} from "../../../../src/checks/workspace/E-1.110/validate-runbook-shape.mjs";

test("models the generic workspace runbook contract", () => {
  expect(nonEmptyString("owner")).toBe(true);
  expect(stringList(["step"])).toBe(true);
  expect(
    validRecord({
      id: "deploy",
      purpose: "Deploy",
      owner: "Ops",
      boundaries: { owns: ["production"], excludes: ["development"] },
      steps: ["verify"],
    }),
  ).toBe(true);
  expect(validRecord({ id: "deploy", purpose: "Deploy" })).toBe(false);
});
