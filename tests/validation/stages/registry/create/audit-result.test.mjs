import { expect, test } from "@jest/globals";
import createAuditStageResult from "../../../../../src/validation/stages/registry/create/audit-result.mjs";
test("maps audit outcomes and applies matching exemptions", () => {
  expect(createAuditStageResult({ code: 0 })).toMatchObject({ code: 0, message: "" });
  expect(createAuditStageResult({ code: 1, stdout: "details" })).toMatchObject({
    code: 7,
    message: "npm audit failed.\ndetails",
  });
  const exempt = createAuditStageResult(
    {
      code: 1,
      stdout: JSON.stringify({
        vulnerabilities: {
          x: {
            severity: "high",
            via: [{ url: "https://github.com/advisories/GHSA-fc5q-39xc-vjpf" }],
          },
        },
      }),
    },
    { eliware: { exempt: [{ ruleId: "stage:audit", advisories: ["GHSA-fc5q-39xc-vjpf"] }] } },
  );
  expect(exempt).toMatchObject({ code: 0, message: "" });
});
test("marks a timed out audit as a warning", () => {
  expect(createAuditStageResult({ code: null, timedOut: true })).toMatchObject({
    code: 0,
    status: "warning",
  });
});
