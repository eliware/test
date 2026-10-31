import { findUnexpectedJestLineRecords } from "./jest-lines.mjs";
import { isDefaultJestConsoleLine } from "../jest-console/output.mjs";
import { redactProcessOutput } from "../../../../../shared/output/redaction/redact/process-output.mjs";

export function findUnexpectedJestStdout(stdout, consoleOutput, secrets, root) {
  return findUnexpectedJestLineRecords(stdout)
    .filter(
      (record) =>
        record.line !== "…" &&
        !/^\[?eliware(?:-test)?(?:-progress)?\b/u.test(record.line) &&
        !isDefaultJestConsoleLine(record, consoleOutput, root),
    )
    .map(({ line, suite }) =>
      redactProcessOutput(`Unexpected output from ${suite}: ${line}`, secrets),
    );
}
