import { createValidationStageRunners } from "./registry/create/validation-stage-runners.mjs";

export async function runValidationStages(context, stages, runners) {
  context.stageResults ??= {};
  const selectedRunners = runners ?? createValidationStageRunners();
  return (
    await Promise.all(
      stages.map(async (stage) => {
        const enabled = context[`execute${capitalize(stage)}`];
        if (!enabled) return null;
        if (!Object.hasOwn(context.stageResults, stage)) {
          context.timing?.stage?.(stage);
          try {
            context.stageResults[stage] = await selectedRunners[stage](context);
          } catch (error) {
            context.stageResults[stage] = {
              ruleId: `stage:${stage}`,
              stage,
              code: 1,
              status: "fail",
              message: error instanceof Error ? error.message : String(error),
            };
          }
        }
        const result = context.stageResults[stage];
        return result.status === "fail" || result.status === "warning" ? result : null;
      }),
    )
  ).filter(Boolean);
}

function capitalize(value) {
  return value[0].toUpperCase() + value.slice(1);
}
