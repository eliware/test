import { expect, test } from "@jest/globals";
import { validateTextCoverageRows } from "../../../../../../src/checks/general/E-0.1/E-0.1.20/E-0.1.20.10/validate-text-coverage-rows.mjs";

test("accepts normalized Windows paths for source files", () => {
  expect(() =>
    validateTextCoverageRows([{ file: "C:\\repo\\src\\example.mjs" }], ["src/example.mjs"]),
  ).not.toThrow();
});

test("accepts valid source rows when the caller has not supplied a source inventory", () => {
  expect(() => validateTextCoverageRows([{ file: "src/example.mjs" }], [])).not.toThrow();
});

test("rejects report labels that are not source paths", () => {
  expect(() => validateTextCoverageRows([{ file: "README.md" }], [])).toThrow("non-source file");
  expect(() => validateTextCoverageRows([{ file: "src/generated/output.mjs" }], [])).toThrow(
    "non-source file",
  );
  expect(() => validateTextCoverageRows([{ file: "src/build/output.mjs" }], [])).toThrow(
    "non-source file",
  );
});

test("rejects missing, unexpected, and duplicate source rows", () => {
  expect(() =>
    validateTextCoverageRows([{ file: "src/a.mjs" }], ["src/a.mjs", "src/b.mjs"]),
  ).toThrow("missing: src/b.mjs");
  expect(() => validateTextCoverageRows([{ file: "src/b.mjs" }], ["src/a.mjs"])).toThrow(
    "unexpected: src/b.mjs",
  );
  expect(() =>
    validateTextCoverageRows([{ file: "src/a.mjs" }, { file: "src/a.mjs" }], ["src/a.mjs"]),
  ).toThrow("duplicate: src/a.mjs");
});
