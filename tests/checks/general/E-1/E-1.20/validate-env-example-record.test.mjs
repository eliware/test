import { expect, test } from "@jest/globals";
import { validateEnvironmentRecord } from "../../../../../src/checks/general/E-1/E-1.20/validate-env-example-record.mjs";

const record = (overrides = {}) => ({
  name: "MODE",
  value: "dev",
  optional: false,
  details: { default: "dev" },
  duplicate: false,
  ...overrides,
});

test("accepts a documented record", () => {
  expect(validateEnvironmentRecord(record())).toEqual([]);
  expect(validateEnvironmentRecord(record({ details: { default: "dev", allowed: "dev | prod" } }))).toEqual([]);
  expect(validateEnvironmentRecord(record({ value: "2", details: { default: "2", range: "1..3" } }))).toEqual([]);
});

test("reports missing, duplicate, sensitive, and metadata-invalid records", () => {
  expect(validateEnvironmentRecord(record({ value: "", duplicate: true }))).toEqual(expect.arrayContaining([
    "MODE is declared more than once",
    "MODE needs an explicit default or placeholder value",
  ]));
  expect(validateEnvironmentRecord(record({ name: "TOKEN", value: "secret" })).join(" ")).toContain(
    "must not contain a credential-like value",
  );
  expect(validateEnvironmentRecord(record({ details: {} })).join(" ")).toContain("nonempty default");
  expect(validateEnvironmentRecord(record({ details: { default: "dev", allowed: "prod" } })).join(" ")).toContain(
    "outside its allowed values",
  );
  expect(validateEnvironmentRecord(record({ value: "4", details: { default: "4", range: "1..3" } })).join(" ")).toContain(
    "outside its allowed range",
  );
  expect(validateEnvironmentRecord(record({ details: { default: "" } })).join(" ")).toContain("empty environment metadata");
  expect(validateEnvironmentRecord(record({ details: { default: "dev", allowed: "" } })).join(" ")).toContain("outside its allowed values");
  expect(validateEnvironmentRecord(record({ value: "x", details: { default: "x", range: "bad" } })).join(" ")).toContain("outside its allowed range");
  expect(validateEnvironmentRecord(record({ value: "4", details: { default: "4", range: "1-3" } })).join(" ")).toContain("outside its allowed range");
  expect(validateEnvironmentRecord(record({ value: "NaN", details: { default: "NaN", range: "1..3" } })).join(" ")).toContain("outside its allowed range");
  expect(validateEnvironmentRecord(record({ details: { default: "dev", note: "" } })).join(" ")).toContain("empty environment metadata");
  expect(validateEnvironmentRecord(record({ name: "TOKEN", value: "secret", optional: true })).join(" ")).not.toContain("credential-like");
});
