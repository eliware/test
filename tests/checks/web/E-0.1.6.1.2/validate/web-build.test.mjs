import { expect, test } from "@jest/globals";
import { validateWebBuild } from "../../../../../src/checks/web/E-0.1.6.1.2/validate/web-build.mjs";

const config = `import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const repositoryRoot = dirname(fileURLToPath(import.meta.url));
export default {
  context: repositoryRoot,
  mode: "production",
  target: "web",
  entry: { client: "./src/client-entry.mjs" },
  output: { path: resolve(repositoryRoot, "dist"), filename: "[name].js", clean: true },
};`;

const packageJson = {
  devDependencies: { webpack: "^5.0.0", "webpack-cli": "^5.0.0" },
  scripts: { build: "webpack --config webpack.config.mjs" },
};

test("accepts the canonical root webpack configuration and build script", () => {
  expect(validateWebBuild(packageJson, config)).toEqual([]);
});

test("requires direct webpack and webpack-cli dependencies", () => {
  expect(validateWebBuild({ scripts: packageJson.scripts }, config)).toEqual([
    "Web applications must directly declare webpack.",
    "Web applications must directly declare webpack-cli.",
  ]);
});

test.each([
  "webpack --entry ./src/client-entry.mjs --output-path ./dist --output-filename client.js --mode production",
  "webpack --config webpack.config.mjs && echo done",
  "vite build",
])("rejects a build command outside the required command: %s", (build) => {
  expect(validateWebBuild({ ...packageJson, scripts: { build } }, config)).toContain(
    "Web applications must define scripts.build as webpack --config webpack.config.mjs.",
  );
});

test("requires the repository-root context and output directory", () => {
  expect(
    validateWebBuild(
      packageJson,
      config.replace("context: repositoryRoot", 'context: "src"').replace('"dist"', '"build"'),
    ),
  ).toEqual([
    "Webpack context must resolve to the repository root.",
    "Webpack output.path must be <repo-root>/dist.",
  ]);
});

test("requires the production web target and named bundles", () => {
  expect(
    validateWebBuild(
      packageJson,
      config
        .replace('mode: "production"', 'mode: "development"')
        .replace('entry: { client: "./src/client-entry.mjs" }', "entry: {}"),
    ),
  ).toEqual([
    "Webpack mode must be production.",
    "Webpack entry must define one or more named bundles.",
  ]);
});

test("requires canonical output filename and cleanup", () => {
  expect(
    validateWebBuild(
      packageJson,
      config.replace("[name].js", "client.js").replace("clean: true", "clean: false"),
    ),
  ).toEqual(["Webpack output.filename must be [name].js.", "Webpack output.clean must be true."]);
});

test("rejects missing and invalid webpack config source", () => {
  expect(validateWebBuild()).toContain("Web applications must directly declare webpack.");
  expect(validateWebBuild(packageJson)).toContain(
    "Web applications must define a valid root webpack.config.mjs.",
  );
  expect(validateWebBuild(packageJson, "export default {};")).toContain(
    "Webpack context must resolve to the repository root.",
  );
});
