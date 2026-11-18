function fail(ruleId, message) {
  return {
    ruleId,
    status: "fail",
    message,
  };
}
export default fail;
