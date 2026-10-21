import { expect, test } from "@jest/globals";
import { normalizeRedactedPackMetadata } from "../../../../src/validation/stages/pack/normalize-redacted-pack-metadata.mjs";

test("replaces redacted numeric npm metadata with valid numbers", () => {
  const output =
    '{"size":[REDACTED]3,"unpackedSize":[REDACTED],"entryCount":2,' +
    '"files":[{"path":"package.json","size":[REDACTED]3,"mode":[REDACTED]}]}';

  expect(JSON.parse(normalizeRedactedPackMetadata(output))).toEqual({
    size: 0,
    unpackedSize: 0,
    entryCount: 0,
    files: [{ path: "package.json", size: 0, mode: 0 }],
  });
});

test("leaves unrelated JSON text unchanged", () => {
  const output = '{"name":"target","size":"unknown"}';

  expect(normalizeRedactedPackMetadata(output)).toBe(output);
});
