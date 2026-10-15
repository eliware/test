const requiredStages = ["lint", "format"];

export function validateFormattingStages(stageResults) {
  if (!stageResults || typeof stageResults !== "object")
    return ["Cached lint and format-check results are required."];
  return requiredStages.flatMap((stage) => {
    const result = stageResults[stage];
    return result?.status === "pass" && result.code === 0
      ? []
      : [`The cached ${stage === "format" ? "format-check" : stage} stage must pass.`];
  });
}
