import { expect, test } from "@jest/globals";
import { selectPackManifestEntry } from "../../../../src/validation/stages/pack/select-pack-manifest-entry.mjs";

const files = [{ path: "package.json" }];

test("selects one matching entry from an array", () => {
  const target = { name: "target", files };
  expect(selectPackManifestEntry([{ name: "other" }, target], "target")).toBe(target);
  expect(selectPackManifestEntry([target])).toBe(target);
});

test("selects a root manifest with a files array", () => {
  const target = { name: "target", files };
  expect(selectPackManifestEntry(target, "target")).toBe(target);
  expect(selectPackManifestEntry({ files })).toEqual({ files });
  expect(selectPackManifestEntry(target, "other")).toBeNull();
});

test("selects a named or unique entry from an object map", () => {
  const target = { name: "target", files };
  expect(selectPackManifestEntry({ target }, "target")).toBe(target);
  expect(selectPackManifestEntry({ target: { files } })).toEqual({ files });
  expect(selectPackManifestEntry({ target: { name: "other" } }, "target")).toBeNull();
});

test("rejects missing and ambiguous entries", () => {
  expect(selectPackManifestEntry([])).toBeNull();
  expect(selectPackManifestEntry([{ name: "other" }], "target")).toBeNull();
  expect(selectPackManifestEntry({ first: { files }, second: { files } })).toBeNull();
});
