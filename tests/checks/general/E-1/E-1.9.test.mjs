import { expect, test } from "@jest/globals";
import { run } from "../../../../src/checks/general/E-1/E-1.9.mjs";

test("requires the Eliware metadata object and its core fields", () => {
  expect(run({ packageJson: { eliware: { apply: ["general"], authority: { authoritativeFor: ["owned"], notAuthoritativeFor: ["not owned"] }, crosslinks: [{ path: "../docs", relation: "relatedAuthority", authoritativeFor: "docs" }] } } })).toEqual({
    ruleId: "E-1.9",
    status: "pass",
    message: "",
  });
  expect(run({ packageJson: {} })).toEqual(expect.objectContaining({ status: "fail" }));
  expect(run({})).toEqual({
    ruleId: "E-1.9",
    status: "fail",
    message: "package.json must contain an eliware metadata object.",
  });
  for (const field of ["apply", "authority", "crosslinks"]) {
    const eliware = { apply: [], authority: {}, crosslinks: [] };
    delete eliware[field];
    expect(run({ packageJson: { eliware } })).toEqual({
      ruleId: "E-1.9",
      status: "fail",
      message: `package.json.eliware.${field} is required.`,
    });
  }
});

test("rejects empty authority and malformed crosslinks", () => {
  expect(run({ packageJson: { eliware: { apply: ["general"], authority: { authoritativeFor: [], notAuthoritativeFor: ["x"] }, crosslinks: [{ path: "x", relation: "r", authoritativeFor: "a" }] } } })).toEqual(expect.objectContaining({ status: "fail" }));
  expect(run({ packageJson: { eliware: { apply: ["general"], authority: { authoritativeFor: ["x"], notAuthoritativeFor: ["y"] }, crosslinks: [] } } })).toEqual(expect.objectContaining({ status: "fail" }));
  expect(run({ packageJson: { eliware: { apply: ["general"], authority: { authoritativeFor: ["x"], notAuthoritativeFor: ["y"] }, crosslinks: [{ path: "x" }] } } })).toEqual(expect.objectContaining({ status: "fail" }));
});

test("rejects malformed authority and apply values", () => {
  const authority = { authoritativeFor: ["x"], notAuthoritativeFor: ["y"] };
  for (const field of ["authoritativeFor", "notAuthoritativeFor"]) {
    for (const value of [null, [], [""], [1]]) {
      expect(run({ packageJson: { eliware: { apply: ["general"], authority: { ...authority, [field]: value }, crosslinks: [{ path: "x", relation: "r", authoritativeFor: "a" }] } } })).toEqual(expect.objectContaining({ status: "fail" }));
    }
  }
  for (const apply of [null, [], [""], [1]]) {
    expect(run({ packageJson: { eliware: { apply, authority, crosslinks: [{ path: "x", relation: "r", authoritativeFor: "a" }] } } })).toEqual(expect.objectContaining({ status: "fail" }));
  }
  for (const crosslinks of [null, [{ path: "", relation: "r", authoritativeFor: "a" }], [{ path: "x", relation: "", authoritativeFor: "a" }], [{ path: "x", relation: "r", authoritativeFor: "" }], [null]]) {
    expect(run({ packageJson: { eliware: { apply: ["general"], authority, crosslinks } } })).toEqual(expect.objectContaining({ status: "fail" }));
  }
});
