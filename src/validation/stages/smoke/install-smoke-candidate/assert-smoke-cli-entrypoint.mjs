import { createRequire } from "node:module";
import { join, resolve } from "node:path";

export function assertSmokeCliEntrypoint({
  targetRoot,
  packageJson,
  resolveModule = (specifier, parent) => createRequire(parent).resolve(specifier),
}) {
  const binTarget =
    typeof packageJson.bin === "string" ? packageJson.bin : Object.values(packageJson.bin ?? {})[0];
  if (typeof binTarget !== "string") return;
  const expectedBin = join(
    targetRoot,
    "node_modules",
    ...packageJson.name.split("/"),
    binTarget.replace(/^\.\//u, ""),
  );
  const resolvedBin = resolveModule(expectedBin, join(targetRoot, "package.json"));
  if (resolve(resolvedBin) !== resolve(expectedBin))
    throw new Error("Consumer does not resolve the installed smoke package CLI entrypoint.");
}
