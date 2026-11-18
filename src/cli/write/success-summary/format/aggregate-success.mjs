import formatValidationSummary from "./validation-summary.mjs";

function formatAggregateSuccess(result, startedAt) {
  return formatValidationSummary("Aggregate validation passed.", result, startedAt);
}
export default formatAggregateSuccess;
