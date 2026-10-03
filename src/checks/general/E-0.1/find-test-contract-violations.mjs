import { parse } from "@babel/parser";
import { posix } from "node:path";
import { inspectMirroredTestAst } from "./analyze-mirrored-test-ast.mjs";

export function findTestContractViolations(sourceFiles, testContents) {
  return sourceFiles.flatMap((source) => {
    const test = source.replace(/\.mjs$/u, ".test.mjs");
    return validateTestContract(source, `tests/${test}`, testContents.get(test) ?? "");
  });
}

export function validateTestContract(source, testPath, content) {
  let ast;
  try {
    ast = parse(content, { sourceType: "module" });
  } catch (error) {
    return [`${testPath} could not be parsed as JavaScript: ${error.message}`];
  }

  const { hasExecutableTest, moduleSpecifiers } = inspectMirroredTestAst(ast);

  const expectedSource = `src/${source}`;
  const importsMatchingSource = moduleSpecifiers.some((specifier) =>
    resolvesToSource(specifier, testPath, expectedSource),
  );
  const findings = [];
  if (!hasExecutableTest) findings.push(`${testPath} does not declare an executable Jest test`);
  if (!importsMatchingSource)
    findings.push(`${testPath} does not import its matching source module (${expectedSource})`);
  return findings;
}

function resolvesToSource(specifier, testPath, expectedSource) {
  if (typeof specifier !== "string" || !specifier.startsWith(".")) return false;
  const resolved = posix.normalize(posix.join(posix.dirname(testPath), specifier));
  return resolved === expectedSource;
}
