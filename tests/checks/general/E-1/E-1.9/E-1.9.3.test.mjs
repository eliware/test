import { expect, test } from "@jest/globals";
import { run } from "../../../../../src/checks/general/E-1/E-1.9/E-1.9.3.mjs";

const valid = {
  ruleId: "E-1.130.14",
  reason: "fixture",
  approver: "Eli",
  approvalTimestamp: "2026-09-13T00:00:00Z",
  expiry: "2026-09-30",
};

test("accepts approved permanent and temporary exemption metadata", () => {
  expect(
    run({
      packageJson: { eliware: { exempt: [valid, { ...valid, ruleId: "E-1.3", expiry: null, review: undefined }] } },
    }),
  ).toEqual({ ruleId: "E-1.9.3", status: "pass", message: "" });
});

test("rejects incomplete or invalid exemption metadata", () => {
  expect(run({ packageJson: { eliware: { exempt: [{ ...valid, expiry: "soon" }] } } })).toEqual(
    expect.objectContaining({ status: "fail" }),
  );
});

test("accepts repositories without exemptions and rejects malformed metadata shapes", () => {
  expect(run({ packageJson: {} })).toEqual({ ruleId: "E-1.9.3", status: "pass", message: "" });
  expect(run({ packageJson: { eliware: { exempt: "invalid" } } })).toEqual(
    expect.objectContaining({ status: "fail" }),
  );
  for (const field of ["ruleId", "reason", "approver", "approvalTimestamp"]) {
    expect(run({ packageJson: { eliware: { exempt: [{ ...valid, [field]: "" }] } } })).toEqual(
      expect.objectContaining({ status: "fail" }),
    );
  }
  for (const expiry of ["2026-02-30", "2026/09/30", 20260930, undefined]) {
    expect(run({ packageJson: { eliware: { exempt: [{ ...valid, expiry }] } } })).toEqual(
      expect.objectContaining({ status: "fail" }),
    );
  }
  expect(run({ packageJson: { eliware: { exempt: [null] } } })).toEqual(
    expect.objectContaining({ status: "fail" }),
  );
});

test.each(["random-user", "eli", "Eliware", ""]) (
  "rejects non-Eli approver %j",
  (approver) => {
    expect(run({ packageJson: { eliware: { exempt: [{ ...valid, approver }] } } })).toEqual(
      expect.objectContaining({ status: "fail" }),
    );
  },
);

test("accepts canonical temporary exemptions without review metadata", () => {
  expect(run({ packageJson: { eliware: { exempt: [valid] } } }).status).toBe("pass");
});
