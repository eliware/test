export function getJestStageFailureCode(value, outputText) {
  if (value.status === "pass") return 0;
  if (/could not be started/i.test(value.message)) return 1;
  if (/coverage threshold.*not met|coverage for .+? does not meet .+? threshold/iu.test(outputText))
    return 4;
  return 2;
}
