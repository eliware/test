import { collectKnitSourceImportBindings } from "./collect-knit-source-import-bindings.mjs";
import { hasUnsupportedKnitSourceAlias } from "./find-unsupported-knit-source-alias.mjs";
import { hasUnsupportedKnitSourceOperation } from "./find-unsupported-knit-source-operation.mjs";
import { parseKnitSourceOperations } from "./parse-knit-source-operations.mjs";

const invalidSourceMessage = ".knit/validate.mjs is not valid JavaScript.";
const unsupportedOperationMessage =
  ".knit/validate.mjs contains an unsupported filesystem, network, process, or subprocess operation.";

export function validateKnitSourceOperations(source, parsedAst = null) {
  let program;
  try {
    program = parseKnitSourceOperations(source, parsedAst);
  } catch {
    return invalidSourceMessage;
  }
  const bindings = collectKnitSourceImportBindings(program);
  if (
    hasUnsupportedKnitSourceAlias(program) ||
    hasUnsupportedKnitSourceOperation(program, bindings)
  )
    return unsupportedOperationMessage;
  return null;
}
