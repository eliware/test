import validateEntrypointTarget from "./target.mjs";
export default async function validateEntrypointTargets(targets, root, checkPath) {
  const errors = [];
  for (const target of targets) {
    const error = await validateEntrypointTarget(target, root, checkPath);
    if (error) errors.push(error);
  }
  return errors;
}
