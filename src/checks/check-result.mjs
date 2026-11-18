export default function pass(ruleId, message = "") {
  return {
    ruleId,
    status: "pass",
    message,
  };
}
