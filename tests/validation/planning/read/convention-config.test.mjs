import { expect, test } from "@jest/globals";
import { readConventionConfig } from "../../../../src/validation/planning/read/convention-config.mjs";

test("requires a non-empty explicit apply list", () => {
  expect(readConventionConfig({ eliware: { apply: ["general"] } })).toEqual({ apply: ["general"] });
  expect(() => readConventionConfig({ eliware: { apply: [] } })).toThrow(
    "must define eliware.apply",
  );
  expect(() => readConventionConfig({ eliware: { apply: ["general", ""] } })).toThrow(
    "array of group names",
  );
});

test("keeps the explicitly selected profiles for planning validation", () => {
  expect(
    readConventionConfig({ eliware: { apply: ["general", "application", "web"] } }).apply,
  ).toEqual(["general", "application", "web"]);
  expect(readConventionConfig({ eliware: { apply: ["general", "bogus"] } }).apply).toEqual([
    "general",
    "bogus",
  ]);
});

test("accepts explicit inherited groups", () => {
  expect(readConventionConfig({ eliware: { apply: ["general", "application", "cli"] } })).toEqual({
    apply: ["general", "application", "cli"],
  });
});

test("uses only explicitly selected profiles from the bundled catalog", () => {
  expect(
    readConventionConfig({ eliware: { apply: ["general", "application", "cli"] } }).apply,
  ).toEqual(["general", "application", "cli"]);
});

test("rejects duplicate profiles before planning discovery", () => {
  expect(() => readConventionConfig({ eliware: { apply: ["general", "general"] } })).toThrow(
    "duplicate profile names",
  );
});
