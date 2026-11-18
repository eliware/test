import createBasicValidationStageRunners from "./basic-validation-stage-runners.mjs";
import createProfileValidationStageRunners from "./profile-validation-stage-runners.mjs";
export default function createValidationStageRunners(options = {}) {
  return {
    ...createBasicValidationStageRunners(options),
    ...createProfileValidationStageRunners(options),
  };
}
