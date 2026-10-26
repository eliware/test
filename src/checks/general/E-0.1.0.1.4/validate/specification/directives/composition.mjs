import { validateBundledSpecifications } from "../../bundled-specifications.mjs";
import { validateConsumerSpecifications } from "../../consumer-specifications.mjs";
import { getConsumerDirectiveNamespace } from "./consumer-namespace.mjs";

export async function validateBundledAndConsumerSpecifications(root, packageJson, dependencies) {
  const errors = [...(await validateBundledSpecifications(dependencies))];
  errors.push(
    ...(await validateConsumerSpecifications(
      root,
      getConsumerDirectiveNamespace(packageJson),
      dependencies,
    )),
  );
  return errors;
}
