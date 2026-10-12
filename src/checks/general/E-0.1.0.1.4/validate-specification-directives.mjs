import { validateBundledSpecifications } from "./validate-bundled-specifications.mjs";
import { validateConsumerSpecifications } from "./validate-consumer-specifications.mjs";

export async function validateSpecificationDirectives(root, packageJson = {}, dependencies = {}) {
  const errors = [...(await validateBundledSpecifications(dependencies))];
  // codescope ignore this because consumer discovery reports its own error after bundled validation completes.
  errors.push(
    ...(await validateConsumerSpecifications(root, packageJson?.eliware?.id, dependencies)),
  );
  return errors;
}
