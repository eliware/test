import { expect, test } from "@jest/globals";
import {
  getImportedLocalName,
  parseWebpackConfig,
  readProperties,
} from "../../../../src/checks/web/E-0.1.6.1.2/parse-webpack-config.mjs";

test("parses one default object export and its simple properties", () => {
  const parsed = parseWebpackConfig(
    'import { resolve } from "node:path"; export default { mode: "production" };',
  );
  expect(parsed?.properties.get("mode").value).toBe("production");
  expect(getImportedLocalName(parsed.program, "node:path", "resolve")).toBe("resolve");
});

test("returns aliases for imported helpers", () => {
  const parsed = parseWebpackConfig(
    'import { resolve as joinPath } from "node:path"; export default {};',
  );
  expect(getImportedLocalName(parsed.program, "node:path", "resolve")).toBe("joinPath");
});

test("reads string property names and imported string names", () => {
  const parsed = parseWebpackConfig('import "node:path"; export default { "mode": "production" };');
  const program = {
    body: [
      {
        type: "ImportDeclaration",
        source: { value: "node:path" },
        specifiers: [
          {
            type: "ImportSpecifier",
            imported: { value: "resolve" },
            local: { name: "joinPath" },
          },
        ],
      },
    ],
  };
  expect(parsed.properties.get("mode").value).toBe("production");
  expect(getImportedLocalName(program, "node:path", "resolve")).toBe("joinPath");
  expect(getImportedLocalName(program, "node:path", "missing")).toBeNull();
  expect(getImportedLocalName(program, "node:url", "fileURLToPath")).toBeNull();
});

test.each(["export default {}; export default {};", "export default config;", "export default {"])(
  "rejects an invalid configuration module: %s",
  (source) => expect(parseWebpackConfig(source)).toBeNull(),
);

test("rejects configuration object spreads and duplicate keys", () => {
  const spread = parseWebpackConfig("export default { ...base }; ");
  const duplicate = parseWebpackConfig(
    "export default { mode: 'production', mode: 'development' }; ",
  );
  expect(spread).toBeNull();
  expect(duplicate).toBeNull();
  expect(readProperties({ type: "ObjectExpression", properties: [] })).toEqual(new Map());
});
