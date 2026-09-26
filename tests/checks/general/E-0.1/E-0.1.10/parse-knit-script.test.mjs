import { expect, test } from "@jest/globals";
import { parse } from "@babel/parser";
import { parseKnitScript } from "../../../../../src/checks/general/E-0.1/E-0.1.10/parse-knit-script.mjs";

test("parses and analyzes valid source", () => {
  expect(parseKnitScript('import { spawnSync } from "node:child_process"; spawnSync("npm", ["test"]);'))
    .toMatchObject({ calls: [expect.objectContaining({ command: "npm", args: ["test"] })] });
});

test("analyzes a shared parsed AST without parsing the source again", () => {
  const source = 'import { spawnSync } from "node:child_process"; spawnSync("npm", ["test"]);';
  const ast = parse(source, { sourceType: "module", plugins: ["importAttributes", "topLevelAwait"] });
  expect(parseKnitScript("invalid source", ast)).toEqual(parseKnitScript(source));
});

test("reports malformed JavaScript as a parse error", () => {
  expect(parseKnitScript("import { spawnSync } from")).toEqual(
    expect.objectContaining({ calls: [], error: expect.any(String) }),
  );
});
