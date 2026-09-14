import { expect, test } from "@jest/globals";
import { parseEnvExample } from "../../../../../src/checks/general/E-1/E-1.20/parse-env-example.mjs";

test("parses required and optional environment examples", () => {
  const parsed = parseEnvExample(
    "# default: value\nREQUIRED=value\n# default: default\n# OPTIONAL=default\n",
  );
  expect([...parsed.records.keys()]).toEqual(["REQUIRED", "OPTIONAL"]);
  expect(parsed.errors).toEqual([]);
});

test("reports empty, duplicate, and credential-like values", () => {
  const parsed = parseEnvExample("TOKEN=real-secret\nTOKEN=again\n# EMPTY=\n");
  expect(parsed.errors).toEqual(
    expect.arrayContaining([
      "TOKEN is declared more than once",
      "TOKEN must not contain a credential-like value",
      "EMPTY needs an explicit default or placeholder value",
    ]),
  );
});

test("validates allowed values and numeric ranges", () => {
  const parsed = parseEnvExample(
    "# default: staging allowed: development|staging\nMODE=staging\n# default: 2 range: 1..3\nCOUNT=2\n",
  );
  expect(parsed.errors).toEqual([]);
  expect(parsed.records.get("MODE").details).toEqual({ default: "staging", allowed: "development|staging" });
});

test("reports invalid allowed values, ranges, and empty metadata", () => {
  const parsed = parseEnvExample(
    "# default: production allowed: development|staging\nMODE=production\n# default: 9 range: 1-3\nCOUNT=9\n# default: x allowed: \nEMPTY=ok\n",
  );
  expect(parsed.errors).toEqual(
    expect.arrayContaining([
      "MODE has a default outside its allowed values",
      "COUNT has a default outside its allowed range",
      "EMPTY must not use empty environment metadata",
    ]),
  );
});

test("resets pending comments on ordinary lines and handles malformed assignments", () => {
  const parsed = parseEnvExample("# default: ignored\nnot an assignment\nVALUE=value\n");
  expect(parsed.errors).toEqual(["VALUE must document a nonempty default"]);
});
