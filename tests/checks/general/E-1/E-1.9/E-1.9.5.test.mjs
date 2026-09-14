import { expect, test } from "@jest/globals";
import { run } from "../../../../../src/checks/general/E-1/E-1.9/E-1.9.5.mjs";

test("requires crosslink authority records", () => {
  const packageJson = {
    eliware: {
      crosslinks: [{ path: "../docs", relation: "relatedAuthority", authoritativeFor: "docs" }],
    },
  };
  expect(run({ packageJson }).status).toBe("pass");
  expect(run({ packageJson: { eliware: { crosslinks: [{ path: "../docs" }] } } }).status).toBe(
    "fail",
  );
});

test.each([
  undefined,
  null,
  {},
  { crosslinks: [] },
  { crosslinks: [null] },
  { crosslinks: [{ path: "", relation: "relatedAuthority", authoritativeFor: "docs" }] },
  { crosslinks: [{ path: "docs", relation: "", authoritativeFor: "docs" }] },
  { crosslinks: [{ path: "docs", relation: "relatedAuthority", authoritativeFor: "" }] },
  { crosslinks: [{ path: 7, relation: "relatedAuthority", authoritativeFor: "docs" }] },
  { crosslinks: [{ path: "docs", relation: 7, authoritativeFor: "docs" }] },
  { crosslinks: [{ path: "docs", relation: "relatedAuthority", authoritativeFor: 7 }] },
])("rejects incomplete authority crosslinks %#", (eliware) => {
  expect(run({ packageJson: { eliware } })).toEqual(expect.objectContaining({ status: "fail" }));
});
