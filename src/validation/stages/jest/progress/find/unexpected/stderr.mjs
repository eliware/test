import findUnexpectedJestLineRecords from "./jest-lines/find-unexpected-jest-line-records.mjs";
import isDefaultJestConsoleLine from "../jest-console/output/is-default-jest-console-line.mjs";
import redactProcessOutput from "../../../../../shared/output/redaction/redact/process-output.mjs";
export default function findUnexpectedJestStderr(stderr, consoleOutput, secrets, root) {
  return findUnexpectedJestLineRecords(stderr)
    .filter(
      ({ line, suite }) =>
        line !== "…" &&
        !/^\[?eliware-test(?:-progress)?\b/u.test(line) &&
        !/^E-0\.1\.20(?::|\.)/u.test(line) &&
        !isDefaultJestConsoleLine(
          {
            line,
            suite,
          },
          consoleOutput,
          root,
        ),
    )
    .map(({ line, suite }) =>
      redactProcessOutput(`Unexpected output from ${suite}: ${line}`, secrets),
    );
}
