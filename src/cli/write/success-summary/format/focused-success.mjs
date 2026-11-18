import formatValidationSummary from "./validation-summary.mjs";

function formatFocusedSuccess(result, startedAt) {
  return formatValidationSummary("Focused validation passed.", result, startedAt);
}
export default formatFocusedSuccess;
