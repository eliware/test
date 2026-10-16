import { expect, test } from "@jest/globals";
import { validateEliwareMetadata } from "../../../../../../src/checks/general/E-0.1.0.1.0/validate/eliware/metadata.mjs";

const valid = { eliware: { id: "E-1", apply: ["general"] } };

test("accepts valid Eliware metadata and exemptions", () => {
  expect(
    validateEliwareMetadata({
      eliware: {
        id: "E-1",
        apply: ["general"],
        exempt: [
          {
            ruleId: "E-0.1.0.1.0",
            reason: "Approved",
            approver: "Eli",
            approvalTimestamp: "2099-01-01T00:00:00Z",
            expiry: null,
          },
        ],
      },
    }),
  ).toEqual([]);
});

test("rejects invalid keys and IDs", () => {
  const errors = validateEliwareMetadata({
    eliware: { apply: ["general"], extra: true },
  });
  expect(errors).toEqual(
    expect.arrayContaining([
      expect.stringContaining("ordered keys"),
      expect.stringContaining("E-number"),
    ]),
  );
});

test.each([undefined, null, "bad"])("rejects malformed exemption data %p", (exempt) => {
  expect(
    validateEliwareMetadata({ ...valid, eliware: { ...valid.eliware, exempt } }),
  ).toContainEqual(expect.stringContaining("Every exemption"));
});

test("rejects exemptions for unknown rule IDs", () => {
  expect(
    validateEliwareMetadata({
      eliware: {
        id: "E-1",
        apply: ["general"],
        exempt: [
          {
            ruleId: "E-999.0",
            reason: "Approved",
            approver: "Eli",
            approvalTimestamp: "2099-01-01T00:00:00Z",
            expiry: null,
          },
        ],
      },
    }),
  ).toContain("Every convention exemption must identify a known rule ID.");
});

test("rejects known semantic directives that have no deterministic check", () => {
  expect(
    validateEliwareMetadata({
      eliware: {
        id: "E-1",
        apply: ["general"],
        exempt: [
          {
            ruleId: "E-0.1.0.0.0",
            reason: "Approved",
            approver: "Eli",
            approvalTimestamp: "2099-01-01T00:00:00Z",
            expiry: null,
          },
        ],
      },
    }),
  ).toContain("Every convention exemption must identify a known rule ID.");
});
