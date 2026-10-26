import { expect, test } from "@jest/globals";
import { validateCliInformationResult } from "../../../../../src/checks/cli/E-0.1.5.1.0/validate/information-result.mjs";
import { packageVersion } from "../../../../../test-fixtures/helpers/project-version.mjs";

const validate = (result, argument = "--help", version = packageVersion) =>
  validateCliInformationResult({
    entrypoint: "bin/cli.mjs",
    argument,
    result,
    packageVersion: version,
  });

test("accepts output from either stream for successful commands", () => {
  expect(validate({ code: 0, stdout: "Usage" })).toEqual([]);
  expect(validate({ code: 0, stderr: "Usage" })).toEqual([]);
});

test("reports unsuccessful exit codes and signals", () => {
  expect(validate({ code: 1, stdout: "Usage" })).toEqual([
    "CLI entrypoint bin/cli.mjs must exit 0 for --help.",
  ]);
  expect(validate({ code: 0, signal: "SIGTERM", stdout: "Usage" })).toEqual([
    "CLI entrypoint bin/cli.mjs must exit 0 for --help.",
  ]);
});

test("reports empty output and accepts whitespace-only output as empty", () => {
  expect(validate({ code: 0 })).toEqual([
    "CLI entrypoint bin/cli.mjs must produce output for --help.",
  ]);
  expect(validate({ code: 0, stdout: "  \n" })).toEqual([
    "CLI entrypoint bin/cli.mjs must produce output for --help.",
  ]);
});

test("validates the package version only for the version argument", () => {
  expect(validate({ code: 0, stdout: `v${packageVersion}` }, "--version")).toEqual([]);
  expect(validate({ code: 0, stdout: "Usage" }, "--version")).toEqual([
    `CLI entrypoint bin/cli.mjs --version must report package version ${packageVersion}.`,
  ]);
  expect(validate({ code: 0, stdout: "Usage" }, "--help")).toEqual([]);
});

test("reports the supplied version when package metadata has no version", () => {
  expect(
    validateCliInformationResult({
      entrypoint: "bin/cli.mjs",
      argument: "--version",
      result: { code: 0, stdout: "1.0.0" },
      packageVersion: undefined,
    }),
  ).toEqual(["CLI entrypoint bin/cli.mjs --version must report package version undefined."]);
});
