import { expect, test } from "@jest/globals";
import { formatEntrypointFilesystemDiagnostic } from "../../../../../../src/checks/application/E-0.1.4.1.1/validate/entrypoint/filesystem-diagnostic.mjs";

test.each([
  ["symlink", "Entrypoint target path must not contain a symlink: bin/tool.mjs."],
  ["directory", "Entrypoint target path segment must be a directory: bin/tool.mjs."],
  ["file", "Entrypoint target must be an existing file: bin/tool.mjs."],
  ["missing", "Entrypoint target does not exist: bin/tool.mjs."],
])("formats the %s filesystem diagnostic", (result, message) => {
  expect(formatEntrypointFilesystemDiagnostic(result, "bin/tool.mjs")).toBe(message);
});

test("returns no diagnostic for a valid filesystem result", () => {
  expect(formatEntrypointFilesystemDiagnostic(null, "bin/tool.mjs")).toBeNull();
});
