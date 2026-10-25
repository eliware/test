import { validateBundledAndConsumerSpecifications } from "./directives/composition.mjs";

export async function validateSpecificationDirectives(root, packageJson = {}, dependencies = {}) {
  return validateBundledAndConsumerSpecifications(root, packageJson, dependencies);
}
