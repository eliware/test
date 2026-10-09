import { expect, test } from "@jest/globals";
import {
  readProfileComposition,
  validateProfileComposition,
} from "../../../src/validation/check-discovery/validate-profile-composition.mjs";

test("reads valid profile requirements and conflicts", () => {
  expect(
    readProfileComposition(
      { requires: ["application"], conflicts: ["private"] },
      "cli-semantic.yaml",
      "cli",
    ),
  ).toEqual({ requires: ["application"], conflicts: ["private"] });
});

test("rejects malformed profile relationship lists", () => {
  for (const [document, field] of [
    [{ requires: null, conflicts: [] }, "requires"],
    [{ requires: ["cli"], conflicts: [] }, "requires"],
    [{ requires: ["cli", "cli"], conflicts: [] }, "requires"],
    [{ requires: [], conflicts: ["Bad Name"] }, "conflicts"],
  ])
    expect(() => readProfileComposition(document, "cli.yaml", "cli")).toThrow(
      `invalid ${field} list`,
    );
});

test("requires known profiles and symmetric conflicts", () => {
  expect(() => validateProfileComposition({ cli: { requires: ["app"], conflicts: [] } })).toThrow(
    "requires unknown profiles",
  );
  expect(() =>
    validateProfileComposition({
      cli: { requires: [], conflicts: ["private"] },
      private: { requires: [], conflicts: [] },
    }),
  ).toThrow("asymmetric conflicts");
  expect(() =>
    validateProfileComposition({
      cli: { requires: [], conflicts: ["private"] },
      private: { requires: [], conflicts: ["cli"] },
    }),
  ).not.toThrow();
});
