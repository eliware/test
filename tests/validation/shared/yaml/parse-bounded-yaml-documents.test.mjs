import { expect, test } from "@jest/globals";
import {
  parseBoundedYamlDocuments,
  parseBoundedYamlValue,
  yamlLimits,
} from "../../../../src/validation/shared/yaml/parse-bounded-yaml-documents.mjs";

function aliases(count) {
  return `value: &value test\naliases:\n${Array.from({ length: count }, () => "  - *value").join("\n")}`;
}

test("accepts content at each size and line limit", () => {
  const exactBytes = `${"#".repeat(99)}\n${Array.from({ length: 998 }, () => "#".repeat(99)).join("\n")}\n${"#".repeat(100)}`;
  expect(Buffer.byteLength(exactBytes, "utf8")).toBe(yamlLimits.bytes);
  expect(parseBoundedYamlDocuments(exactBytes, "exact-bytes.yaml")).toHaveLength(0);
  expect(parseBoundedYamlDocuments(`${"#\n".repeat(999)}#`, "exact-lines.yaml")).toHaveLength(0);
  expect(parseBoundedYamlDocuments(`value: ${"x".repeat(93)}`, "exact-line.yaml")).toHaveLength(1);
});

test("reports byte, line, and character values above each limit", () => {
  expect(() => parseBoundedYamlDocuments("x".repeat(100001), "large.yaml")).toThrow(
    "large.yaml is 100001 UTF-8 bytes. limit is 100000.",
  );
  expect(() => parseBoundedYamlDocuments(`${"#\n".repeat(1000)}#`, "many.yaml")).toThrow(
    "many.yaml has 1001 lines. limit is 1000.",
  );
  expect(() => parseBoundedYamlDocuments(`value: ${"x".repeat(94)}`, "long.yaml")).toThrow(
    "long.yaml line 1 has 101 characters. limit is 100.",
  );
  expect(() => parseBoundedYamlDocuments("x".repeat(101), "long-line.yaml")).toThrow(
    "long-line.yaml line 1 has 101 characters. limit is 100.",
  );
});

test("reports every overlong YAML line in one pass", () => {
  const source = ["x".repeat(101), "valid: true", "y".repeat(104)].join("\n");
  expect(() => parseBoundedYamlDocuments(source, "multiple-long-lines.yaml")).toThrow(
    "multiple-long-lines.yaml line 1 has 101 characters. limit is 100.\n" +
      "multiple-long-lines.yaml line 3 has 104 characters. limit is 100.",
  );
});

test("allows caller-specific line limits and keeps the other bounds", () => {
  const source = `value: ${"x".repeat(300)}`;
  expect(
    parseBoundedYamlDocuments(source, "registry.yaml", { lineCharacters: Infinity }),
  ).toHaveLength(1);
  expect(() =>
    parseBoundedYamlDocuments("x".repeat(100001), "large-registry.yaml", {
      lineCharacters: Infinity,
    }),
  ).toThrow("limit is 100000");
});

test("sets the alias expansion limit for every document", () => {
  expect(parseBoundedYamlDocuments(aliases(99), "aliases.yaml")).toHaveLength(1);
  expect(
    parseBoundedYamlDocuments(`${aliases(99)}\n---\n${aliases(99)}`, "stream.yaml"),
  ).toHaveLength(2);
  expect(() => parseBoundedYamlDocuments(aliases(100), "too-many.yaml")).toThrow(
    "too-many.yaml has more than 100 expanded aliases in one document. limit is 100.",
  );
});

test("parses one bounded YAML document as a value", () => {
  expect(parseBoundedYamlValue("value: one", "value.yaml")).toEqual({ value: "one" });
  expect(parseBoundedYamlValue("value: one\n", "final-newline.yaml")).toEqual({ value: "one" });
  expect(parseBoundedYamlValue("", "empty.yaml")).toBeNull();
  expect(() => parseBoundedYamlValue("value: one\n---\nvalue: two", "multi.yaml")).toThrow(
    "multi.yaml must contain one YAML document.",
  );
  expect(() => parseBoundedYamlValue("value: [", "invalid.yaml")).toThrow();
});

test("keeps YAML parser and alias errors intact", () => {
  expect(() => parseBoundedYamlDocuments(null, "null.yaml")).toThrow("source is not a string");
  expect(parseBoundedYamlDocuments("value: [", "broken.yaml")).toHaveLength(1);
  expect(() => parseBoundedYamlDocuments("value: *missing", "missing-alias.yaml")).toThrow(
    "Unresolved alias",
  );
});
