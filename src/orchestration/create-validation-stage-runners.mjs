import { createBasicValidationStageRunners } from "./create-basic-validation-stage-runners.mjs";
import { createProfileValidationStageRunners } from "./create-profile-validation-stage-runners.mjs";

export function createValidationStageRunners(options = {}) {
  return {
    ...createBasicValidationStageRunners(options),
    ...createProfileValidationStageRunners(options),
  };
}
