import { readFile } from "node:fs/promises";
import { resolve, sep } from "node:path";
import { createInstrumenter } from "istanbul-lib-instrument";
import { isInScopeSource, normalizeSourcePath } from "./coverage-source-path.mjs";

export function expectedCoverageShape(source, filename) {
  const instrumenter = createInstrumenter({
    esModules: true,
    parserPlugins: ["typescript", "jsx", "topLevelAwait"],
    produceSourceMap: false,
  });
  instrumenter.instrumentSync(source, filename);
  const coverage = instrumenter.lastFileCoverage();
  const lineMap = Object.fromEntries(
    [...new Set(Object.values(coverage.statementMap).map(({ start }) => String(start.line)))].map(
      (line) => [line, {}],
    ),
  );
  return {
    statementMap: coverage.statementMap,
    branchMap: coverage.branchMap,
    fnMap: coverage.fnMap,
    lineMap,
  };
}

export async function readExpectedCoverageShapes(root, files, readSource = readFile) {
  const shapes = {};
  for (const file of files.filter(isInScopeSource)) {
    const path = resolve(root, ...file.replaceAll("\\", "/").split("/"));
    const source = await readSource(path, "utf8");
    shapes[normalizeSourcePath(file)] = expectedCoverageShape(source, path.split(sep).join("/"));
  }
  return shapes;
}
