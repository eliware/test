import { expect, test } from "@jest/globals";
import { run } from "../../../../../src/checks/general/E-1/E-1.9/A-1.9.6.mjs";

test("accepts approved crosslink relationships", () => {
  expect(
    run({
      packageJson: { eliware: { crosslinks: [{ path: "../docs", relation: "relatedAuthority" }] } },
    }),
  ).toEqual({ ruleId: "A-1.9.6", status: "pass", message: "" });
});

test("rejects unknown crosslink relationships", () => {
  expect(
    run({ packageJson: { eliware: { crosslinks: [{ path: "../docs", relation: "unknown" }] } } }),
  ).toEqual(expect.objectContaining({ status: "fail" }));
});

test.each([
  undefined,
  null,
  {},
  { crosslinks: [null] },
  { crosslinks: [{}] },
  { crosslinks: [{ path: "   ", relation: "implements" }] },
  { crosslinks: [{ path: "docs", relation: "" }] },
  { crosslinks: [{ path: 42, relation: "dependsOn" }] },
])("rejects malformed crosslink configuration %#", (eliware) => {
  expect(run({ packageJson: { eliware } })).toEqual(expect.objectContaining({ status: "fail" }));
});

test("accepts every approved relationship value", () => {
  expect(
    run({
      packageJson: {
        eliware: {
          crosslinks: [
            { path: "a", relation: "dependsOn" },
            { path: "b", relation: "consumedBy" },
            { path: "c", relation: "implements" },
            { path: "d", relation: "supersedes" },
          ],
        },
      },
    }),
  ).toEqual({ ruleId: "A-1.9.6", status: "pass", message: "" });
});
