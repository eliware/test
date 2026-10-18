import { expect, test } from "@jest/globals";
import { ruleId, run } from "../../../src/checks/web/E-0.1.6.1.2.mjs";

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
  dependencies: { lighthouse: "1", puppeteer: "1" },
  devDependencies: { webpack: "1", "webpack-cli": "1" },
  scripts: {
    build: "webpack --config webpack.config.mjs",
    lighthouse: "lighthouse http://127.0.0.1:3000",
    screenshots: "node bin/screenshots.mjs",
  },
};

test("accepts the required Web tooling and canonical build model", async () => {
  const result = await run({
    packageJson,
    repositoryInventory: { readText: async () => config },
  });
  expect(result).toEqual({ ruleId, status: "pass", message: "" });
});

test("fails when the webpack configuration cannot be read", async () => {
  const result = await run({
    packageJson,
    repositoryInventory: {
      readText: async () => {
        throw new Error("missing");
      },
    },
  });
  expect(result).toMatchObject({
    ruleId,
    status: "fail",
    message: "Web applications must define a valid root webpack.config.mjs.",
  });
});

test("fails when repository metadata and its file reader are unavailable", async () => {
  const result = await run();
  expect(result).toMatchObject({ ruleId, status: "fail" });
  expect(result.message).toContain("Web applications must define a valid root webpack.config.mjs.");
});
