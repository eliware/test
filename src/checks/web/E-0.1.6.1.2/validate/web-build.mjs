import {
  getImportedLocalName,
  parseWebpackConfig,
  readProperties,
} from "../parse-webpack-config.mjs";
import { hasRepositoryRoot } from "../has-repository-root.mjs";

const expectedBuildCommand = "webpack --config webpack.config.mjs";
const dependencySections = [
  "dependencies",
  "devDependencies",
  "optionalDependencies",
  "peerDependencies",
];

export function validateWebBuild(packageJson = {}, configText = "") {
  const errors = [];
  for (const name of ["webpack", "webpack-cli"]) {
    const found = dependencySections.some((section) => {
      const value = packageJson[section]?.[name];
      return typeof value === "string" && Boolean(value.trim());
    });
    if (!found) errors.push(`Web applications must directly declare ${name}.`);
  }

  if (packageJson.scripts?.build !== expectedBuildCommand)
    errors.push(
      "Web applications must define scripts.build as webpack --config webpack.config.mjs.",
    );

  const parsed = parseWebpackConfig(configText);
  if (!parsed) {
    errors.push("Web applications must define a valid root webpack.config.mjs.");
    return errors;
  }
  const { program, properties } = parsed;
  const root = properties.get("context");
  const dirname = getImportedLocalName(program, "node:path", "dirname");
  const fileURLToPath = getImportedLocalName(program, "node:url", "fileURLToPath");
  if (root?.type !== "Identifier" || !hasRepositoryRoot(program, root.name, dirname, fileURLToPath))
    errors.push("Webpack context must resolve to the repository root.");
  if (properties.get("mode")?.value !== "production")
    errors.push("Webpack mode must be production.");
  if (properties.get("target")?.value !== "web") errors.push("Webpack target must be web.");
  const entries = readProperties(properties.get("entry"));
  if (!entries?.size) errors.push("Webpack entry must define one or more named bundles.");

  const output = readProperties(properties.get("output"));
  const path = output?.get("path");
  const resolve = getImportedLocalName(program, "node:path", "resolve");
  if (
    !output ||
    path?.type !== "CallExpression" ||
    path.callee.type !== "Identifier" ||
    !resolve ||
    path.callee.name !== resolve ||
    path.arguments.length !== 2 ||
    path.arguments[0]?.type !== "Identifier" ||
    path.arguments[0].name !== root?.name ||
    path.arguments[1]?.value !== "dist"
  )
    errors.push("Webpack output.path must be <repo-root>/dist.");
  if (output?.get("filename")?.value !== "[name].js")
    errors.push("Webpack output.filename must be [name].js.");
  if (output?.get("clean")?.value !== true) errors.push("Webpack output.clean must be true.");
  return errors;
}
