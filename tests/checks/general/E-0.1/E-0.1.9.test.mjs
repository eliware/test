import { expect, test } from "@jest/globals";
import { run } from "../../../../src/checks/general/E-0.1/E-0.1.9.mjs";

test("requires an Eliware metadata object with id and profile applicability", () => {
  expect(run({ packageJson: { eliware: { id: "E-0", apply: ["general"] } } })).toEqual({
    ruleId: "E-0.1.9",
    status: "pass",
    message: "",
  });
  expect(run({ packageJson: {} })).toEqual(expect.objectContaining({ status: "fail" }));
  expect(run({})).toEqual({
    ruleId: "E-0.1.9",
    status: "fail",
    message: "package.json must contain an eliware metadata object.",
  });
  expect(run({ packageJson: { eliware: {} } })).toMatchObject({
    status: "fail",
    message: expect.stringContaining("package.json.eliware.id is required."),
  });
});

test("reports profile applicability failures", () => {
  for (const apply of [null, [], [""], [1], ["unknown"]]) {
    expect(run({ packageJson: { eliware: { id: "E-0", apply } } })).toMatchObject({
      status: "fail",
    });
  }
});

test("allows id, apply, and optional exempt metadata keys in canonical order", () => {
  expect(
    run({ packageJson: { eliware: { id: "E-0", apply: ["general"], exempt: [] } } }),
  ).toMatchObject({
    status: "pass",
  });
  expect(
    run({ packageJson: { eliware: { id: "E-0", apply: ["general"], capabilities: [] } } }),
  ).toEqual({
    ruleId: "E-0.1.9",
    status: "fail",
    message: "package.json.eliware contains unsupported keys: capabilities.",
  });
  expect(
    run({
      packageJson: { eliware: { id: "E-0", apply: ["general"], zeta: true, authority: {} } },
    }),
  ).toMatchObject({
    status: "fail",
    message: "package.json.eliware contains unsupported keys: authority, zeta.",
  });
  expect(run({ packageJson: { eliware: { apply: ["general"], id: "E-0" } } })).toMatchObject({
    status: "fail",
    message: expect.stringContaining("keys must be ordered id, apply"),
  });
  expect(run({ packageJson: { eliware: { id: " ", apply: ["general"] } } })).toMatchObject({
    status: "fail",
    message: expect.stringContaining("id must be a non-empty string"),
  });
});
