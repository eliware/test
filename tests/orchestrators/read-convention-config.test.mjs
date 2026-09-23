import { expect, test } from "@jest/globals";
import { readConventionConfig } from "../../src/orchestrators/read-convention-config.mjs";

test("requires a non-empty explicit apply list", () => {
  expect(readConventionConfig({ eliware: { apply: ["general"] } })).toEqual({ apply: ["general"] });
  expect(() => readConventionConfig({ eliware: { apply: [] } })).toThrow(
    "must define eliware.apply",
  );
  expect(() => readConventionConfig({ eliware: { apply: ["general", ""] } })).toThrow(
    "array of group names",
  );
});

test("rejects unknown groups and does not infer additional profiles", () => {
  expect(readConventionConfig({ eliware: { apply: ["web"] } }).apply).toEqual(["web"]);
  expect(() => readConventionConfig({ eliware: { apply: ["general", "bogus"] } })).toThrow("Unknown convention group");
  expect(() => readConventionConfig({ eliware: { apply: ["general", "fork"] } })).toThrow("excludes");
});

test("accepts explicit inherited groups", () => {
  expect(readConventionConfig({ eliware: { apply: ["general", "application", "cli"] } })).toEqual({
    apply: ["general", "application", "cli"],
  });
});

test("uses only explicitly selected profiles from the bundled authority", () => {
  expect(readConventionConfig({ eliware: { apply: ["cli"] } }).apply).toEqual(["cli"]);
});
