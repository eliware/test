import { expect, test } from "@jest/globals";
import { validateEntrypointMetadata } from "../../../../src/checks/application/E-0.1.4.1.1/validate-entrypoint-metadata.mjs";

test("allows profiles without an entrypoint and validates bin object names", () => {
  expect(validateEntrypointMetadata({})).toEqual([]);
  expect(validateEntrypointMetadata({ main: 42 })).toEqual([]);
  expect(validateEntrypointMetadata({ bin: { "bad name": "bin/a" } })).toContain(
    "package.json bin command name is invalid: bad name.",
  );
});

test("rejects malformed bin maps and accepts valid string or object forms", () => {
  expect(validateEntrypointMetadata({ bin: [] })).toContain(
    "package.json bin must be a path or a command map.",
  );
  expect(validateEntrypointMetadata({ bin: "bin/a" })).toEqual([]);
  expect(validateEntrypointMetadata({ bin: { app: "bin/a" } })).toEqual([]);
});
