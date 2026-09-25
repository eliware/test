import { readOutdatedDependencies } from "./read-outdated-dependencies.mjs";

export function getOutdatedDependencies(context, readOutdated = readOutdatedDependencies) {
  if (context.outdatedDependencies !== undefined) {
    return Promise.resolve(context.outdatedDependencies);
  }
  context.outdatedDependenciesPromise ??= Promise.resolve().then(() =>
    readOutdated(context.root ?? process.cwd()),
  );
  return context.outdatedDependenciesPromise;
}
