import { createValidationStageRunners } from "./create-validation-stage-runners.mjs";

export async function runValidationStages(context, stages, runners) {
  context.stageResults ??= {};
  const selectedRunners = runners ?? createValidationStageRunners();
  const results = [];
  for (const stage of stages) {
    const enabled = stage === "jest" ? context.executeJest : context[`execute${capitalize(stage)}`];
    if (!enabled) continue;
    if (!Object.hasOwn(context.stageResults, stage)) {
      try {
        context.stageResults[stage] = await selectedRunners[stage](context);
      } catch (error) {
        context.stageResults[stage] = {
          ruleId: `stage:${stage}`,
          stage,
          code: 14,
          status: "fail",
          message: error instanceof Error ? error.message : String(error),
        };
      }
    }
    const result = context.stageResults[stage];
    if (result.status === "fail") results.push(result);
  }
  return results;
}

function capitalize(value) {
  return value[0].toUpperCase() + value.slice(1);
}
