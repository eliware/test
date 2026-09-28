import { expect, test } from "@jest/globals";
import { run } from "../../../../../src/checks/general/E-0.1/E-0.1.9/A-0.1.9.6.mjs";

test("accepts approved crosslink relationships", () => {
  expect(
    run({
      packageJson: { eliware: { crosslinks: [{ path: "../docs", relation: "relatedAuthority" }] } },
    }),
  ).toEqual({ ruleId: "A-0.1.9.6", status: "pass", message: "" });
});

test("rejects unknown crosslink relationships", () => {
  expect(
    run({ packageJson: { eliware: { crosslinks: [{ path: "../docs", relation: "unknown" }] } } }),
  ).toEqual(expect.objectContaining({ status: "fail" }));
});

test("reports all invalid crosslink relationships", () => {
  const result = run({
    packageJson: {
      eliware: {
        crosslinks: [
          { path: "a", relation: "invalid-one" },
          { path: "b", relation: "invalid-two" },
        ],
      },
    },
  });
  expect(result.status).toBe("fail");
  expect(result.message).toContain("crosslinks[0]");
  expect(result.message).toContain("crosslinks[1]");
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
  ).toEqual({ ruleId: "A-0.1.9.6", status: "pass", message: "" });
});
