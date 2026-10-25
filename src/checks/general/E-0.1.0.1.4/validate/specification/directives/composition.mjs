import { validateBundledSpecifications } from "../../bundled-specifications.mjs";
import { validateConsumerSpecifications } from "../../consumer-specifications.mjs";

export async function validateBundledAndConsumerSpecifications(root, packageJson, dependencies) {
  const errors = [...(await validateBundledSpecifications(dependencies))];
  errors.push(
    ...(await validateConsumerSpecifications(root, packageJson?.eliware?.id, dependencies)),
  );
  return errors;
}
