import { AUDIT_TIMEOUT_MS } from "../../audit/execute-audit-process.mjs";
import auditFailureIsExempt from "../../audit/format-audit-failure.mjs";
import formatAuditFailure from "../../audit/format-audit-failure/format-audit-failure.mjs";
import createValidationStageResult from "../../shared/create-validation-stage-result.mjs";
export default function createAuditStageResult(value, packageJson = {}) {
  if (value.timedOut) {
    return {
      ...createValidationStageResult(
        "audit",
        0,
        `WARNING: Audit stage timed out after ${AUDIT_TIMEOUT_MS / 1000} seconds. Validation will continue.`,
        value,
      ),
      status: "warning",
    };
  }
  const exemption = (packageJson?.eliware?.exempt ?? []).find(
    (entry) => entry.ruleId === "stage:audit",
  );
  if (value.code !== 0 && exemption && auditFailureIsExempt(value, exemption.advisories))
    return createValidationStageResult("audit", 0, "", value);
  return createValidationStageResult(
    "audit",
    value.code === 0 ? 0 : 7,
    value.code === 0 ? "" : `npm audit failed.\n${formatAuditFailure(value)}`,
    value,
  );
}
