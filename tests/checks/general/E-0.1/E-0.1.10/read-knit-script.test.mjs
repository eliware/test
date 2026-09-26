import { expect, jest, test } from "@jest/globals";
import { readKnitScript } from "../../../../../src/checks/general/E-0.1/E-0.1.10/read-knit-script.mjs";

test("reads and parses the Knit script using the shared AST cache when supplied", async () => {
  const source = "export const value = 1;";
  const readText = jest.fn().mockResolvedValue(source);
  const parseAst = jest.fn().mockResolvedValue({ type: "File", program: { body: [] } });
  const result = await readKnitScript({ root: "/repo", repositoryInventory: { readText }, parseAst });

  expect(result.source).toBe(source);
  expect(result.parsed).toEqual({ calls: [], leadingExecutable: false, unsupported: [] });
  expect(readText).toHaveBeenCalledWith(expect.stringMatching(/\.knit[\\/]validate\.mjs$/u));
  expect(parseAst).toHaveBeenCalledWith("/repo", ".knit/validate.mjs", {
    sourceType: "module",
    plugins: ["importAttributes", "topLevelAwait"],
  });
});

test("can skip reading source when only the cached AST is needed", async () => {
  const readText = jest.fn();
  const result = await readKnitScript({
    root: "/repo",
    repositoryInventory: { readText },
    parseAst: jest.fn().mockResolvedValue({ type: "File", program: { body: [] } }),
  }, { includeSource: false });

  expect(result.source).toBe("");
  expect(readText).not.toHaveBeenCalled();
});

test("reads and parses from source when no shared AST cache is supplied", async () => {
  const source = 'import { spawnSync } from "node:child_process"; spawnSync("npm", ["test"]);';
  const readText = jest.fn().mockResolvedValue(source);
  const result = await readKnitScript({ root: "/repo", repositoryInventory: { readText } }, { includeSource: false });

  expect(result.source).toBe(source);
  expect(result.parsed.calls).toHaveLength(1);
  expect(readText).toHaveBeenCalledWith(expect.stringMatching(/\.knit[\\/]validate\.mjs$/u));
});

test("returns parse errors for rule-specific mapping", async () => {
  const result = await readKnitScript({
    root: "/repo",
    repositoryInventory: { readText: jest.fn().mockResolvedValue("invalid") },
    parseAst: jest.fn().mockRejectedValue(new SyntaxError("Unexpected token")),
  });

  expect(result).toEqual({ source: "invalid", error: "Knit validation script is not valid JavaScript: Unexpected token" });
});
