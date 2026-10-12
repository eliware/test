import { validateBundledSpecifications } from "./validate-bundled-specifications.mjs";
import { validateConsumerSpecifications } from "./validate-consumer-specifications.mjs";

export async function validateSpecificationDirectives(root, packageJson = {}, dependencies = {}) {
  const errors = [...(await validateBundledSpecifications(dependencies))];
  errors.push(
    ...(await validateConsumerSpecifications(root, packageJson?.eliware?.id, dependencies)),
  );
  return errors;
}
