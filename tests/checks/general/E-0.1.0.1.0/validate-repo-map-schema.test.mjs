import { expect, test } from "@jest/globals";
import { validateRepoMapAgainstSchema } from "../../../../src/checks/general/E-0.1.0.1.0/validate-repo-map-schema.mjs";

const schema = {
  type: "object",
  required: ["repository", "created"],
  properties: {
    repository: { type: "string" },
    created: { type: "string", format: "date" },
  },
  additionalProperties: false,
};

test("accepts data that matches the loaded schema", () => {
  expect(
    validateRepoMapAgainstSchema({ repository: "eliware/example", created: "2026-10-16" }, schema),
  ).toBeNull();
});

test("reports data that does not match the loaded schema", () => {
  expect(
    validateRepoMapAgainstSchema({ repository: "eliware/example", created: "bad" }, schema),
  ).toContain("repo-map.yaml does not match repo-map-schema.yaml");
});

test("reports an invalid loaded schema", () => {
  expect(validateRepoMapAgainstSchema({}, { type: "not-a-type" })).toContain(
    "repo-map-schema.yaml is invalid",
  );
});
