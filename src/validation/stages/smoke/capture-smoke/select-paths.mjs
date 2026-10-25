import { join } from "node:path";

export function selectSmokePaths(root, packageName, binNames) {
  const packagePath = join(root, "node_modules", ...packageName.split("/"));
  const paths = [
    join(root, "package.json"),
    join(root, "package-lock.json"),
    join(root, "npm-shrinkwrap.json"),
    join(root, "node_modules", ".package-lock.json"),
    packagePath,
    ...binNames.flatMap((name) =>
      ["", ".cmd", ".ps1"].map((suffix) => join(root, "node_modules", ".bin", `${name}${suffix}`)),
    ),
  ];
  return [...new Set(paths)];
}
