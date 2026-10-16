import { validateBundledSpecifications } from "../bundled-specifications.mjs";
import { validateConsumerSpecifications } from "../consumer-specifications.mjs";

export async function validateSpecificationDirectives(root, packageJson = {}, dependencies = {}) {
  const errors = [...(await validateBundledSpecifications({ ...dependencies, packageJson }))];
  errors.push(
    ...(await validateConsumerSpecifications(root, packageJson?.eliware?.id, dependencies)),
  );
  return errors;
}
